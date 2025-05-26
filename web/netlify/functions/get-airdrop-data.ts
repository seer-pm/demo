import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export default async (req: Request) => {
  try {
    // Handle GET request
    if (req.method === "GET") {
      const { data, error } = await supabase.rpc("get_airdrop_totals_current_week");
      if (error) {
        throw error;
      }
      return new Response(JSON.stringify({ data }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
