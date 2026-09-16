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

type HoldingRow = {
  token: string;
  owner: string;
  balance: string;
};

type AuthorPosition = {
  tokenId: string;
  outcome: string;
  balance: string;
};

function parseChainId(value: unknown): number | null {
  const chainId = Number(value);
  return value && Number.isInteger(chainId) ? chainId : null;
}

/** Parses an optional comment id and action from a function request URL. */
function parsePath(url: string) {
  // /.netlify/functions/market-comments/:id?/action?
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("market-comments");
  const id = parts[idx + 1] || null;
  const action = parts[idx + 2] || null;
  return { id, action };
}

/** Converts a stored comment and its viewer-specific metadata to the API shape. */
function toComment(
  row: CommentRow,
  likeCount: number,
  likedByMe: boolean,
  username?: string,
  positions: AuthorPosition[] = [],
) {
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
    positions,
  };
}

/** Current outcome-token positions of `authors` in the market, keyed by lowercase address in outcome order. */
async function getAuthorPositions(chainId: number | null, marketId: string, authors: string[]) {
  const positionsByAuthor = new Map<string, AuthorPosition[]>();
  if (chainId === null || authors.length === 0) return positionsByAuthor;

  try {
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("wrappedTokens:subgraph_data->wrappedTokens, outcomes:subgraph_data->outcomes")
      .eq("id", marketId)
      .eq("chain_id", chainId)
      .maybeSingle();
    if (marketError) throw marketError;

    const wrappedTokens = ((market?.wrappedTokens ?? []) as string[]).map((token) => token.toLowerCase());
    const outcomes = (market?.outcomes ?? []) as string[];
    if (wrappedTokens.length === 0) return positionsByAuthor;

    const { data: holdings, error } = await supabase
      .from("tokens_holdings_v")
      .select("token, owner, balance::text")
      .eq("chain_id", chainId)
      .in("token", wrappedTokens)
      .in("owner", [...new Set(authors.map((author) => author.toLowerCase()))])
      .gt("balance", 0);
    if (error) throw error;

    for (const { token, owner, balance } of (holdings ?? []) as HoldingRow[]) {
      const outcomeIndex = wrappedTokens.indexOf(token.toLowerCase());
      const outcome = outcomes[outcomeIndex];
      if (!outcome) continue;

      const address = owner.toLowerCase();
      const positions = positionsByAuthor.get(address) ?? [];
      positions.push({ tokenId: wrappedTokens[outcomeIndex], outcome, balance });
      positionsByAuthor.set(address, positions);
    }
    for (const positions of positionsByAuthor.values()) {
      positions.sort((a, b) => wrappedTokens.indexOf(a.tokenId) - wrappedTokens.indexOf(b.tokenId));
    }
  } catch (error) {
    // Position badges are secondary; never fail the comments request over them.
    console.error("Author positions error:", error);
    positionsByAuthor.clear();
  }
  return positionsByAuthor;
}

/** Loads usernames for the supplied comment-author addresses. */
async function getUsernames(addresses: string[]) {
  const normalized = [...new Set(addresses.map((address) => address.toLowerCase()))];
  if (normalized.length === 0) return new Map<string, string>();

  const { data, error } = await supabase.from("users").select("id, username").in("id", normalized);
  if (error) {
    // Labels are secondary; a lookup failure renders every author by address rather than failing the thread.
    console.error("Comment author usernames error:", error);
    return new Map<string, string>();
  }

  // Usernames are optional, so rows without one are omitted and the author renders by fallback.
  return new Map(
    (data ?? []).flatMap((row) => (row.username ? ([[row.id.toLowerCase(), row.username]] as [string, string][]) : [])),
  );
}

/** Returns like totals and the set liked by the current viewer. */
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

/** Handles public comment reads and authenticated comment mutations. */
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
      const [{ counts, liked }, usernames, positionsByAuthor] = await Promise.all([
        getLikeStats(
          rows.map((r) => r.id),
          viewer,
        ),
        getUsernames(rows.map((row) => row.author)),
        getAuthorPositions(
          parseChainId(url.searchParams.get("chain_id")),
          marketId,
          rows.map((r) => r.author),
        ),
      ]);

      return new Response(
        JSON.stringify({
          // An author without a users row still renders (by address) rather than failing the whole thread.
          data: rows.map((row) =>
            toComment(
              row,
              counts.get(row.id) || 0,
              liked.has(row.id),
              usernames.get(row.author.toLowerCase()),
              positionsByAuthor.get(row.author.toLowerCase()),
            ),
          ),
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

      const positionsByAuthor = await getAuthorPositions(parseChainId(body.chain_id), marketId, [viewer]);

      return new Response(
        JSON.stringify({
          id: data.id,
          data: toComment(data as CommentRow, 0, false, undefined, positionsByAuthor.get(viewer.toLowerCase())),
        }),
        {
          status: 200,
          headers: jsonHeaders,
        },
      );
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
