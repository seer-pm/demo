import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async (req: Request) => {
  const verificationToken = new URL(req.url).searchParams.get("token");
  if (verificationToken) {
    const { data: user, error } = await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("verification_token", verificationToken)
      .select()
      .single();

    if (error || !user) {
      return new Response(JSON.stringify({ success: 0 }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: 1 }), { status: 200 });
  }

  return new Response(JSON.stringify({ success: 0 }), { status: 200 });
};
