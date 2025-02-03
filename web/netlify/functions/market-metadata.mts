import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export default async (req: Request) => {
  const body = await req.json();

  if (!body) {
    return new Response(JSON.stringify({ error: "Missing request body" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  const { id, url } = body;
  if (!id && !url) {
    return new Response(JSON.stringify({ error: "Missing Id and Url" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  try {
    const { data, error } = id
      ? await supabase.from("markets").select("metadata").eq("id", id).single()
      : await supabase.from("markets").select("metadata").eq("url", url).single();

    if (error) {
      throw error;
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.log(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
