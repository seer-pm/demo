import type { Comment, CreateCommentInput, DiscussionPosition, DiscussionUser, DiscussionsClient } from "../types";

export type CreateDiscussionsClientOptions = {
  /** Base URL, e.g. "" or "https://app.seer.pm" */
  baseUrl?: string;
  /** Market id used as market_id */
  marketId: string;
  /** Market chain, used to resolve commenter outcome positions */
  chainId: number;
  /** Returns current Seer JWT, or empty string if signed out */
  getAccessToken: () => string;
  /** Optional override for profile links, which default to the Seer deployment's portfolio routes. */
  getProfileHref?: (user: DiscussionUser) => string;
};

type ApiPosition = {
  tokenId: string;
  outcome: string;
  balance: string;
};

type ApiComment = Omit<Comment, "positions"> & {
  positions?: ApiPosition[];
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

function parsePositions(positions: ApiPosition[] | undefined): DiscussionPosition[] {
  return (positions ?? []).map(({ tokenId, outcome, balance }) => ({ tokenId, outcome, balance: BigInt(balance) }));
}

/** HTTP client for market discussion comments. */
export function createDiscussionsClient(options: CreateDiscussionsClientOptions): DiscussionsClient {
  const base = (options.baseUrl ?? "").replace(/\/$/, "");
  const endpoint = `${base}/.netlify/functions/market-comments`;
  const marketId = options.marketId.toLowerCase();
  const chainId = options.chainId;

  /** Uses an explicit profile URL, then the host's route override, then the Seer portfolio route. */
  const getProfileHref = (user: DiscussionUser): string =>
    user.profileHref ??
    options.getProfileHref?.(user) ??
    `${base}/portfolio/${user.username ? `@${encodeURIComponent(user.username)}` : user.address.toLowerCase()}`;

  return {
    marketId,
    baseUrl: base,
    getProfileHref,

    /** Loads a public username; missing profiles return null and request failures remain retryable. */
    async getUsername(address) {
      const res = await fetch(`${base}/.netlify/functions/users?address=${encodeURIComponent(address.toLowerCase())}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(await readError(res));
      const json = (await res.json()) as { user?: { username?: string | null } };
      return json.user?.username || null;
    },

    /** Loads comments with author profile links and current outcome-token positions. */
    async listComments() {
      const token = options.getAccessToken();
      const res = await fetch(`${endpoint}?market_id=${encodeURIComponent(marketId)}&chain_id=${chainId}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const json = (await res.json()) as { data?: ApiComment[] };
      return (json.data ?? []).map((comment) => ({
        ...comment,
        authorDetails: { ...comment.authorDetails, profileHref: getProfileHref(comment.authorDetails) },
        positions: parsePositions(comment.positions),
      }));
    },

    async createComment(input: CreateCommentInput) {
      const token = options.getAccessToken();
      const res = await fetch(endpoint, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          market_id: marketId,
          chain_id: chainId,
          body: input.body,
          parent_id: input.parentId ?? null,
        }),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const json = (await res.json()) as { id?: string; data?: ApiComment };
      const id = json.id;
      if (!id) throw new Error("Missing comment id in response");
      return { id, positions: parsePositions(json.data?.positions) };
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

/**
 * Builds the discussion identity supplied by a signed-in host application.
 *
 * The Seer client loads an omitted username automatically. A host-supplied username takes precedence.
 * A wallet without one still posts and renders, falling back to its ENS name or a generated nickname.
 */
export function userFromAddress(
  address: string,
  username?: string | null,
  profileHref?: string | null,
): DiscussionUser {
  return {
    address: address.toLowerCase(),
    ...(username ? { username } : {}),
    profileHref: profileHref ?? null,
  };
}
