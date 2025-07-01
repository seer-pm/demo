import { createClient } from "@supabase/supabase-js";
import slug from "slug";
import { verifyToken } from "./utils/auth";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function parseCollectionId(url: string) {
  const idOrSlug = url.split("/")[url.split("/").indexOf("collections-handler") + 1] || "";
  return idOrSlug.split("-").slice(-1)[0] || idOrSlug || null;
}

export default async (req: Request) => {
  try {
    const userId = verifyToken(req.headers.get("Authorization") || "");

    const collectionId = parseCollectionId(req.url);

    // Handle GET request
    if (req.method === "GET") {
      let query = supabase.from("collections").select();
      if (collectionId) {
        query = query.eq("id", collectionId);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data: collections = [] } = await query;
      return new Response(JSON.stringify({ data: collections }), { status: 200 });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    // Handle POST request
    if (req.method === "POST") {
      //create a new collection
      const { name } = await req.json();
      if (!name) {
        return new Response(JSON.stringify({ error: "collection name must be provided" }), { status: 400 });
      }

      const { error: insertError, data: collections } = await supabase
        .from("collections")
        .insert({
          user_id: userId,
          name,
        })
        .select();
      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to add collection" }), { status: 500 });
      }

      // update url
      if (collections[0]?.id) {
        const url = `${slug(name).slice(0, 80)}-${collections[0].id}`;
        const { error: updateError } = await supabase
          .from("collections")
          .update({
            url,
          })
          .eq("id", collections[0].id);
        if (updateError) {
          console.error("Update url error:", updateError);
          return new Response(JSON.stringify({ error: "Failed to update url collection" }), { status: 500 });
        }
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Handle PATCH request
    if (req.method === "PATCH") {
      //update a collection
      const { name } = await req.json();
      if (!collectionId) {
        return new Response(JSON.stringify({ error: "collection id required" }), { status: 400 });
      }
      if (!name) {
        return new Response(JSON.stringify({ error: "collection name required" }), { status: 400 });
      }
      const { data, error } = await supabase.from("collections").select().eq("id", collectionId);
      if (!data?.length || error) {
        return new Response(JSON.stringify({ error: "Collection not found" }), { status: 500 });
      }
      const { error: updateError } = await supabase
        .from("collections")
        .update({
          name,
          url: `${slug(name).slice(0, 80)}-${collectionId}`,
        })
        .eq("id", collectionId);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update collection" }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Handle DELETE request
    if (req.method === "DELETE") {
      //delete a collection
      if (!collectionId) {
        return new Response(JSON.stringify({ error: "collection id required" }), { status: 400 });
      }
      const { data, error } = await supabase.from("collections").select().eq("id", collectionId);
      if (!data?.length || error) {
        return new Response(JSON.stringify({ error: "Collection not found" }), { status: 500 });
      }
      const { error: deleteError } = await supabase.from("collections").delete().eq("id", collectionId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return new Response(JSON.stringify({ error: "Failed to delete collection" }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
