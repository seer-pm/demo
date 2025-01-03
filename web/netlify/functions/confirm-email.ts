import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
require("dotenv").config();

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

  const verificationToken = event.queryStringParameters?.token;
  if (verificationToken) {
    const { data: user, error } = await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("verification_token", verificationToken)
      .select()
      .single();

    if (error || !user) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: 0 }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: 1 }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: 0 }),
  };
};
