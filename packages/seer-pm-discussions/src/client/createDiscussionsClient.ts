import type { Comment, CreateCommentInput, DiscussionUser, DiscussionsClient } from "../types";

export type CreateDiscussionsClientOptions = {
  /** Base URL, e.g. "" or "https://app.seer.pm" */
  baseUrl?: string;
  /** Market id used as market_id */
  marketId: string;
  /** Returns current Seer JWT, or empty string if signed out */
  getAccessToken: () => string;
};

function authHeaders(token: string): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readError(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { error?: string };
    return json.error || res.statusText || `HTTP ${res.status}`;
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

/** HTTP client for market discussion comments. */
export function createDiscussionsClient(options: CreateDiscussionsClientOptions): DiscussionsClient {
  const base = (options.baseUrl ?? "").replace(/\/$/, "");
  const endpoint = `${base}/.netlify/functions/market-comments`;
  const marketId = options.marketId.toLowerCase();

  return {
    async listComments() {
      const token = options.getAccessToken();
      const res = await fetch(`${endpoint}?market_id=${encodeURIComponent(marketId)}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const json = (await res.json()) as { data: Comment[] };
      return json.data ?? [];
    },

    async createComment(input: CreateCommentInput) {
      const token = options.getAccessToken();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          market_id: marketId,
          body: input.body,
          parent_id: input.parentId ?? null,
        }),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const json = (await res.json()) as { id?: string };
      const id = json.id;
      if (!id) throw new Error("Missing comment id in response");
      return { id };
    },

    async editComment(id: string, body: string) {
      const token = options.getAccessToken();
      const res = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
    },

    async deleteComment(id: string) {
      const token = options.getAccessToken();
      const res = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
    },

    async setLike(id: string, liked: boolean) {
      const token = options.getAccessToken();
      const res = await fetch(`${endpoint}/${encodeURIComponent(id)}/like`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ type: liked ? "like" : "unlike" }),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
    },
  };
}

export function userFromAddress(address: string): DiscussionUser {
  return {
    address: address.toLowerCase(),
  };
}
