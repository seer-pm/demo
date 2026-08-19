import { createDiscussionsClient } from "@seer-pm/discussions";
import { afterEach, describe, expect, it, vi } from "vitest";

const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createDiscussionsClient", () => {
  it("adds host profile links", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "comment-1",
              author: ADDRESS,
              authorDetails: { address: ADDRESS, username: "seer-user" },
              body: "hello",
              parentId: null,
              createdAt: 1,
              likeCount: 0,
              likedByMe: false,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = createDiscussionsClient({
      marketId: "0xABC",
      getAccessToken: () => "",
      getProfileHref: ({ username }) => `/portfolio/@${username}`,
    });

    const comments = await client.listComments();

    expect(comments[0].authorDetails.profileHref).toBe("/portfolio/@seer-user");
  });
});
