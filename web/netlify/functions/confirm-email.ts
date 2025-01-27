import { createClient } from "@supabase/supabase-js";

export default async (req: Request) => {
  const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

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
