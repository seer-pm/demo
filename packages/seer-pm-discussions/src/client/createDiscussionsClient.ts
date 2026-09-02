import type {
  Comment,
  CreateCommentInput,
  DiscussionMarket,
  DiscussionPosition,
  DiscussionUser,
  DiscussionsClient,
} from "../types";

export type CreateDiscussionsClientOptions = {
  /** Base URL, e.g. "" or "https://app.seer.pm" */
  baseUrl?: string;
  /** Seer market used for comments and commenter outcome positions. */
  market: DiscussionMarket;
  /** Returns current Seer JWT, or empty string if signed out */
  getAccessToken: () => string;
};

type Holder = {
  address: string;
  balance: string;
};

type TokenHoldersResponse = {
  topHolders?: Record<string, Holder[]>;
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
  const commentsEndpoint = `${base}/.netlify/functions/market-comments`;
  const positionsEndpoint = `${base}/.netlify/functions/get-token-transactions`;
  const marketId = options.market.id.toLowerCase();

  return {
    marketId,

    async listComments() {
      const token = options.getAccessToken();
      const res = await fetch(`${commentsEndpoint}?market_id=${encodeURIComponent(marketId)}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const json = (await res.json()) as { data: Comment[] };
      return json.data ?? [];
    },

    async listCommenterPositions(account?: string) {
      const params = new URLSearchParams({
        chainId: String(options.market.chainId),
        marketId,
        holdersOnly: "true",
        commentersOnly: "true",
      });
      if (account) params.set("account", account.toLowerCase());
      const res = await fetch(`${positionsEndpoint}?${params}`);
      if (!res.ok) {
        throw new Error(await readError(res));
      }

      const json = (await res.json()) as TokenHoldersResponse;
      const positionsByAddress = new Map<string, DiscussionPosition[]>();

      for (const [tokenId, holders] of Object.entries(json.topHolders ?? {})) {
        const outcomeIndex = options.market.wrappedTokens.findIndex(
          (wrappedToken) => wrappedToken.toLowerCase() === tokenId.toLowerCase(),
        );
        const outcome = options.market.outcomes[outcomeIndex];
        if (!outcome) continue;

        for (const holder of holders) {
          let balance: bigint;
          try {
            balance = BigInt(holder.balance);
          } catch {
            continue;
          }
          if (balance <= 0n) continue;

          const address = holder.address.toLowerCase();
          const positions = positionsByAddress.get(address) ?? [];
          positions.push({ tokenId, outcome, balance });
          positionsByAddress.set(address, positions);
        }
      }

      return positionsByAddress;
    },

    async createComment(input: CreateCommentInput) {
      const token = options.getAccessToken();
      const res = await fetch(commentsEndpoint, {
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
      const res = await fetch(`${commentsEndpoint}/${encodeURIComponent(id)}`, {
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
      const res = await fetch(`${commentsEndpoint}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
    },

    async setLike(id: string, liked: boolean) {
      const token = options.getAccessToken();
      const res = await fetch(`${commentsEndpoint}/${encodeURIComponent(id)}/like`, {
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
