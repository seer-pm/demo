import { type DiscussionMarket, createDiscussionsClient } from "@seer-pm/discussions";
import { afterEach, describe, expect, it, vi } from "vitest";

const market: DiscussionMarket = {
  id: "0xABCDEF",
  chainId: 100,
  outcomes: ["Invalid", "Yes", "No"],
  wrappedTokens: ["0x0001", "0x0002", "0x0003"],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createDiscussionsClient", () => {
  it("loads comments from the Seer comments endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createDiscussionsClient({
      baseUrl: "https://app.seer.pm/",
      market,
      getAccessToken: () => "seer-token",
    });

    await expect(client.listComments()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.seer.pm/.netlify/functions/market-comments?market_id=0xabcdef",
      { headers: { "Content-Type": "application/json", Authorization: "Bearer seer-token" } },
    );
  });

  it("loads and maps positive outcome positions by commenter address", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          topHolders: {
            "0x0002": [
              { address: "0xAABB", balance: "1500000000000000000" },
              { address: "0xCCDD", balance: "0" },
            ],
            "0x0003": [{ address: "0xaabb", balance: "2000000000000000000" }],
            "0x9999": [{ address: "0xAABB", balance: "3000000000000000000" }],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createDiscussionsClient({
      baseUrl: "https://app.seer.pm",
      market,
      getAccessToken: () => "",
    });
    const positions = await client.listCommenterPositions("0xAABB");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.seer.pm/.netlify/functions/get-token-transactions?chainId=100&marketId=0xabcdef&holdersOnly=true&commentersOnly=true&account=0xaabb",
    );
    expect(positions.get("0xaabb")).toEqual([
      { tokenId: "0x0002", outcome: "Yes", balance: 1_500_000_000_000_000_000n },
      { tokenId: "0x0003", outcome: "No", balance: 2_000_000_000_000_000_000n },
    ]);
    expect(positions.has("0xccdd")).toBe(false);
  });

  it("retries a failed commenter positions request once", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network error"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ topHolders: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createDiscussionsClient({
      baseUrl: "https://app.seer.pm",
      market,
      getAccessToken: () => "",
    });

    await expect(client.listCommenterPositions()).resolves.toEqual(new Map());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
