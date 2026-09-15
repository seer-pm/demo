import { createDiscussionsClient } from "@seer-pm/discussions";
import { afterEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createDiscussionsClient", () => {
  it("loads comments with author positions from the Seer comments endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: "c1",
            author: "0xaabb",
            authorDetails: { address: "0xaabb" },
            body: "hi",
            parentId: null,
            createdAt: 1,
            likeCount: 0,
            likedByMe: false,
            positions: [
              { tokenId: "0x0002", outcome: "Yes", balance: "1500000000000000000" },
              { tokenId: "0x0003", outcome: "No", balance: "2000000000000000000" },
            ],
          },
          {
            id: "c2",
            author: "0xccdd",
            authorDetails: { address: "0xccdd" },
            body: "no positions field",
            parentId: null,
            createdAt: 2,
            likeCount: 0,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createDiscussionsClient({
      baseUrl: "https://app.seer.pm/",
      marketId: "0xABCDEF",
      chainId: 100,
      getAccessToken: () => "seer-token",
    });
    const comments = await client.listComments();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.seer.pm/.netlify/functions/market-comments?market_id=0xabcdef&chain_id=100",
      { headers: { "Content-Type": "application/json", Authorization: "Bearer seer-token" } },
    );
    expect(comments[0].positions).toEqual([
      { tokenId: "0x0002", outcome: "Yes", balance: 1_500_000_000_000_000_000n },
      { tokenId: "0x0003", outcome: "No", balance: 2_000_000_000_000_000_000n },
    ]);
    expect(comments[1].positions).toEqual([]);
  });

  it("returns the viewer's positions when creating a comment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: "c3",
        data: { id: "c3", positions: [{ tokenId: "0x0002", outcome: "Yes", balance: "10" }] },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createDiscussionsClient({
      baseUrl: "https://app.seer.pm",
      marketId: "0xabcdef",
      chainId: 100,
      getAccessToken: () => "seer-token",
    });

    await expect(client.createComment({ body: "hello" })).resolves.toEqual({
      id: "c3",
      positions: [{ tokenId: "0x0002", outcome: "Yes", balance: 10n }],
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      market_id: "0xabcdef",
      chain_id: 100,
      body: "hello",
      parent_id: null,
    });
  });
});
