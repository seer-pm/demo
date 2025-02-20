import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";
import { getPostmarkClient } from "./utils/common";
import { FROM_EMAIL } from "./utils/common";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export default async (req: Request) => {
  // Handle GET request
  if (req.method === "GET") {
    const userId = verifyToken(req.headers.get("Authorization") || "");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: user, error } = await supabase.from("users").select().eq("id", userId).single();

    if (error) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ user }), { status: 200 });
  }

  // Handle POST request
  if (req.method === "POST") {
    const userId = verifyToken(req.headers.get("Authorization") || "");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
      const { email } = await req.json();
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
      }

      const verificationToken = crypto.randomUUID();

      const { data: user, error: updateError } = await supabase
        .from("users")
        .update({ email, email_verified: false, verification_token: verificationToken })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to update email" }), { status: 500 });
      }

      await getPostmarkClient().sendEmailWithTemplate({
        From: FROM_EMAIL,
        To: email,
        TemplateAlias: "welcome",
        TemplateModel: {
          confirm_url: `https://app.seer.pm/confirm-email/${verificationToken}`,
        },
      });

      return new Response(JSON.stringify({ user }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};
