import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import type { PublicClient } from "viem";
import { verifyMessage } from "viem/actions";
import { parseSiweMessage } from "viem/siwe";
import { CORS_HEADERS } from "./utils/common";
import { getPublicClientByChainId } from "./utils/config";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

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

    // Store or update user in Supabase
    const { data: user, error: upsertError } = await supabase
      .from("users")
      .upsert({
        id: address.toLowerCase(),
        last_login_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting user:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to update user data" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

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
