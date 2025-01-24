import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";
import { getPostmarkClient } from "./utils/common";
import { FROM_EMAIL } from "./utils/constants";

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

  // Handle GET request
  if (event.httpMethod === "GET") {
    const userId = verifyToken(event.headers.authorization);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    const { data: user, error } = await supabase.from("users").select().eq("id", userId).single();

    if (error) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ user }),
    };
  }

  // Handle POST request
  if (event.httpMethod === "POST") {
    const userId = verifyToken(event.headers.authorization);
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    try {
      const { email } = JSON.parse(event.body || "{}");
      if (!email) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email is required" }),
        };
      }

      const verificationToken = crypto.randomUUID();

      const { data: user, error: updateError } = await supabase
        .from("users")
        .update({ email, email_verified: false, verification_token: verificationToken })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to update email" }),
        };
      }

      await getPostmarkClient().sendEmailWithTemplate({
        From: FROM_EMAIL,
        To: email,
        TemplateAlias: "welcome",
        TemplateModel: {
          confirm_url: `https://app.seer.pm/confirm-email/${verificationToken}`,
        },
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ user }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Internal server error" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
