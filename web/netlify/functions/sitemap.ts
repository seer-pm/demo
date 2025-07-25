import { createClient } from "@supabase/supabase-js";
import { sepolia } from "viem/chains";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export default async () => {
  try {
    const { data: markets, error } = await supabase
      .from("markets")
      .select("url, chain_id")
      .not("url", "is", null)
      .not("chain_id", "is", null)
      .not("chain_id", "eq", sepolia.id);

    if (error) {
      throw error;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${markets
  .filter((market) => market.url)
  .map(
    (market) => `  <url>
    <loc>https://app.seer.pm/markets/${market.chain_id}/${market.url}</loc>
    <changefreq>daily</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
