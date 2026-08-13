import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import type { PublicClient } from "viem";
import { verifyMessage } from "viem/actions";
import { parseSiweMessage } from "viem/siwe";
import { CORS_HEADERS } from "./utils/common";
import { getPublicClientByChainId } from "./utils/config";
import { makeUsername } from "./utils/username";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

async function findOrCreateUser(address: string) {
  const userId = address.toLowerCase();
  const lastLoginAt = new Date().toISOString();

  const { data: existingUser, error: updateError } = await supabase
    .from("users")
    .update({ last_login_at: lastLoginAt })
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (updateError) throw updateError;
  if (existingUser) return existingUser;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const username = makeUsername(attempt === 0 ? address.toLowerCase() : undefined);
    const { data: user, error } = await supabase
      .from("users")
      .insert({ id: userId, last_login_at: lastLoginAt, username })
      .select()
      .single();

    if (!error && user) return user;
    if (error?.code !== "23505") throw error;

    // A concurrent sign-in for this address may have created the row.
    const { data: concurrentUser, error: concurrentUserError } = await supabase
      .from("users")
      .select()
      .eq("id", userId)
      .maybeSingle();
    if (concurrentUserError) throw concurrentUserError;
    if (concurrentUser) return concurrentUser;
  }

  throw new Error("Unable to create user with a unique username");
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  try {
    const { signature, message } = await req.json();
    if (!signature || !message) {
      return new Response(JSON.stringify({ error: "Missing signature or message" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Parse the SIWE message
    const siweMessage = parseSiweMessage(message);
    const address = siweMessage.address!;
    let publicClient: PublicClient;
    try {
      publicClient = getPublicClientByChainId(siweMessage.chainId);
    } catch {
      return new Response(JSON.stringify({ error: "Unsupported chain" }), { status: 400, headers: jsonHeaders });
    }

    // Verify the signature
    const isValid = await verifyMessage(publicClient, {
      address,
      message,
      signature,
    });

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: jsonHeaders });
    }

    const user = await findOrCreateUser(address);

    // Create JWT token
    const token = jwt.sign(
      {
        sub: address.toLowerCase(),
        iat: Math.floor(Date.now() / 1000),
        iss: "Seer",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    return new Response(JSON.stringify({ token, user }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
