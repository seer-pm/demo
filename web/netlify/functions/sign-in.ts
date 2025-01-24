import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifyMessage } from "@wagmi/core";
import jwt from "jsonwebtoken";
import { parseSiweMessage } from "viem/siwe";
import { config } from "./utils/config";

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

    const { signature, message } = JSON.parse(event.body || "{}");
    if (!signature || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing signature or message" }),
      };
    }

    // Parse the SIWE message
    const siweMessage = parseSiweMessage(message);
    const address = siweMessage.address!;

    // Verify the signature
    const isValid = await verifyMessage(config, {
      address,
      message,
      signature,
    });

    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid signature" }),
      };
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to update user data" }),
      };
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user,
      }),
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
