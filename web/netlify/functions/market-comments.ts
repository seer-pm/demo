import { createClient } from "@supabase/supabase-js";
import { verifyToken } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

type CommentRow = {
  id: string;
  market_id: string;
  author: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function parsePath(url: string) {
  // /.netlify/functions/market-comments/:id?/action?
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("market-comments");
  const id = parts[idx + 1] || null;
  const action = parts[idx + 2] || null;
  return { id, action };
}

function toComment(row: CommentRow, likeCount: number, likedByMe: boolean, username?: string) {
  const author = row.author.toLowerCase();
  return {
    id: row.id,
    author,
    authorDetails: {
      address: author,
      ...(username ? { username } : {}),
    },
    body: row.body,
    parentId: row.parent_id,
    createdAt: Math.floor(new Date(row.created_at).getTime() / 1000),
    likeCount,
    likedByMe,
  };
}

async function getUsernames(addresses: string[]) {
  const normalized = [...new Set(addresses.map((address) => address.toLowerCase()))];
  if (normalized.length === 0) return new Map<string, string>();

  const { data, error } = await supabase.from("users").select("id, username").in("id", normalized);
  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id.toLowerCase(), row.username]));
}

async function getLikeStats(commentIds: string[], viewer: string | null) {
  if (commentIds.length === 0) {
    return { counts: new Map<string, number>(), liked: new Set<string>() };
  }

  const { data: likes, error } = await supabase
    .from("market_comment_likes")
    .select("comment_id, author")
    .in("comment_id", commentIds);
  if (error) throw error;

  const counts = new Map<string, number>();
  const liked = new Set<string>();
  for (const like of likes || []) {
    counts.set(like.comment_id, (counts.get(like.comment_id) || 0) + 1);
    if (viewer && like.author === viewer) {
      liked.add(like.comment_id);
    }
  }
  return { counts, liked };
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const viewer = verifyToken(req.headers.get("Authorization") || "");
    const { id, action } = parsePath(req.url);
    const url = new URL(req.url);

    if (req.method === "GET") {
      const marketId = (url.searchParams.get("market_id") || "").toLowerCase();
      if (!marketId) {
        return new Response(JSON.stringify({ error: "market_id required" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const { data, error } = await supabase
        .from("market_comments")
        .select("*")
        .eq("market_id", marketId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("List comments error:", error);
        return new Response(JSON.stringify({ error: "Failed to list comments" }), {
          status: 500,
          headers: jsonHeaders,
        });
      }

      const rows = (data || []) as CommentRow[];
      const [{ counts, liked }, usernames] = await Promise.all([
        getLikeStats(
          rows.map((r) => r.id),
          viewer,
        ),
        getUsernames(rows.map((row) => row.author)),
      ]);

      return new Response(
        JSON.stringify({
          data: rows.map((row) => {
            const username = usernames.get(row.author.toLowerCase());
            if (!username) throw new Error(`Username not found for ${row.author}`);
            return toComment(row, counts.get(row.id) || 0, liked.has(row.id), username);
          }),
        }),
        { status: 200, headers: jsonHeaders },
      );
    }

    if (!viewer) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }

    if (req.method === "POST" && !id) {
      const body = await req.json();
      const marketId = String(body.market_id || "").toLowerCase();
      const text = String(body.body || "").trim();
      const parentId = body.parent_id ? String(body.parent_id) : null;

      if (!marketId || !text) {
        return new Response(JSON.stringify({ error: "market_id and body required" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }
      if (text.length > 5000) {
        return new Response(JSON.stringify({ error: "body too long" }), { status: 400, headers: jsonHeaders });
      }

      if (parentId) {
        const { data: parent } = await supabase
          .from("market_comments")
          .select("id, market_id, deleted_at")
          .eq("id", parentId)
          .maybeSingle();
        if (!parent || parent.deleted_at || parent.market_id !== marketId) {
          return new Response(JSON.stringify({ error: "Invalid parent_id" }), {
            status: 400,
            headers: jsonHeaders,
          });
        }
      }

      const { data, error } = await supabase
        .from("market_comments")
        .insert({
          market_id: marketId,
          author: viewer,
          body: text,
          parent_id: parentId,
        })
        .select("*")
        .single();

      if (error || !data) {
        console.error("Create comment error:", error);
        return new Response(JSON.stringify({ error: "Failed to create comment" }), {
          status: 500,
          headers: jsonHeaders,
        });
      }

      return new Response(JSON.stringify({ id: data.id, data: toComment(data as CommentRow, 0, false) }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (req.method === "POST" && id && action === "like") {
      const body = await req.json().catch(() => ({}));
      const type = body.type === "unlike" ? "unlike" : "like";

      const { data: comment } = await supabase
        .from("market_comments")
        .select("id, deleted_at")
        .eq("id", id)
        .maybeSingle();
      if (!comment || comment.deleted_at) {
        return new Response(JSON.stringify({ error: "Comment not found" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }

      if (type === "unlike") {
        const { error } = await supabase
          .from("market_comment_likes")
          .delete()
          .eq("comment_id", id)
          .eq("author", viewer);
        if (error) {
          console.error("Unlike comment error:", error);
          return new Response(JSON.stringify({ error: "Failed to update like" }), {
            status: 500,
            headers: jsonHeaders,
          });
        }
      } else {
        const { error } = await supabase
          .from("market_comment_likes")
          .upsert({ comment_id: id, author: viewer }, { onConflict: "comment_id,author" });
        if (error) {
          console.error("Like comment error:", error);
          return new Response(JSON.stringify({ error: "Failed to update like" }), {
            status: 500,
            headers: jsonHeaders,
          });
        }
      }

      return new Response(JSON.stringify({ status: 200, type }), { status: 200, headers: jsonHeaders });
    }

    if (req.method === "PATCH" && id) {
      const body = await req.json();
      const text = String(body.body || "").trim();
      if (!text) {
        return new Response(JSON.stringify({ error: "body required" }), { status: 400, headers: jsonHeaders });
      }
      if (text.length > 5000) {
        return new Response(JSON.stringify({ error: "body too long" }), { status: 400, headers: jsonHeaders });
      }

      const { data: existing } = await supabase.from("market_comments").select("*").eq("id", id).maybeSingle();
      if (!existing || existing.deleted_at) {
        return new Response(JSON.stringify({ error: "Comment not found" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }
      if (existing.author !== viewer) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });
      }

      const { data, error } = await supabase
        .from("market_comments")
        .update({ body: text, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("author", viewer)
        .select("*")
        .single();

      if (error || !data) {
        console.error("Edit comment error:", error);
        return new Response(JSON.stringify({ error: "Failed to edit comment" }), {
          status: 500,
          headers: jsonHeaders,
        });
      }

      const { counts, liked } = await getLikeStats([id], viewer);
      return new Response(
        JSON.stringify({ status: 200, data: toComment(data as CommentRow, counts.get(id) || 0, liked.has(id)) }),
        {
          status: 200,
          headers: jsonHeaders,
        },
      );
    }

    if (req.method === "DELETE" && id) {
      const { data: existing } = await supabase.from("market_comments").select("*").eq("id", id).maybeSingle();
      if (!existing || existing.deleted_at) {
        return new Response(JSON.stringify({ error: "Comment not found" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }
      if (existing.author !== viewer) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });
      }

      const { error } = await supabase
        .from("market_comments")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("author", viewer);

      if (error) {
        console.error("Delete comment error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete comment" }), {
          status: 500,
          headers: jsonHeaders,
        });
      }

      return new Response(JSON.stringify({ status: 200 }), { status: 200, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  } catch (error) {
    console.error("market-comments error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
