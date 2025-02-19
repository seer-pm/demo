import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";

function parseCollectionId(url: string) {
  return url.split("/collections-handler/")[1].split("/")[0] || null;
}

export default async (req: Request) => {
  try {
    const userId = verifyToken(req.headers.get("Authorization") || "");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);
    const collectionId = parseCollectionId(req.url);

    // Handle GET request
    if (req.method === "GET") {
      const { data: collections = [] } = await supabase.from("collections").select().eq("user_id", userId);
      return new Response(JSON.stringify({ data: collections }), { status: 200 });
    }

    // Handle POST request
    if (req.method === "POST") {
      //create a new collection
      const { name } = await req.json();
      if (!name) {
        return new Response(JSON.stringify({ error: "collection name must be provided" }), { status: 400 });
      }
      console.log(name, userId);
      const { error: insertError } = await supabase.from("collections").insert({
        user_id: userId,
        name,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to add collection" }), { status: 500 });
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
