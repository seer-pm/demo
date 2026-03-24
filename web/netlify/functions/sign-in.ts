import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import type { PublicClient } from "viem";
import { verifyMessage } from "viem/actions";
import { parseSiweMessage } from "viem/siwe";
import { getPublicClientByChainId } from "./utils/config";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { signature, message } = await req.json();
    if (!signature || !message) {
      return new Response(JSON.stringify({ error: "Missing signature or message" }), { status: 400 });
    }

    // Parse the SIWE message
    const siweMessage = parseSiweMessage(message);
    const address = siweMessage.address!;
    let publicClient: PublicClient;
    try {
      publicClient = getPublicClientByChainId(siweMessage.chainId);
    } catch {
      return new Response(JSON.stringify({ error: "Unsupported chain" }), { status: 400 });
    }

    // Verify the signature
    const isValid = await verifyMessage(publicClient, {
      address,
      message,
      signature,
    });

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
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
      return new Response(JSON.stringify({ error: "Failed to update user data" }), { status: 500 });
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

    return new Response(JSON.stringify({ token, user }), { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
