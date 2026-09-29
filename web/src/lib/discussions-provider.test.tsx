// @vitest-environment jsdom
import {
  type DiscussionUser,
  type DiscussionsClient,
  DiscussionsProvider,
  createDiscussionsClient,
  useDiscussions,
  userFromAddress,
} from "@seer-pm/discussions";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { act, cleanup, render as renderTree, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const FIRST = "0x1234567890abcdef1234567890abcdef12345678";
const SECOND = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const SEER_CLIENT_OPTIONS = {
  baseUrl: "https://seer.example",
  marketId: "0xmarket",
  chainId: 100,
  getAccessToken: () => "",
};
let rerender: ((tree: React.ReactElement) => void) | undefined;
let queryClient: QueryClient;
let context: ReturnType<typeof useDiscussions>;

/** Captures the provider's identity for assertions. */
function Probe() {
  context = useDiscussions();
  return null;
}

/** Builds a client stub around a username lookup, scoped to a deployment. */
function clientWith(
  getUsername: DiscussionsClient["getUsername"],
  baseUrl = "https://seer.example",
): DiscussionsClient {
  return {
    marketId: "0xmarket",
    baseUrl,
    getUsername,
    getProfileHref: (user) => `${baseUrl}/portfolio/${user.username ? `@${user.username}` : user.address}`,
    listComments: async () => [],
    createComment: async () => ({ id: "comment", positions: [] }),
    editComment: async () => {},
    deleteComment: async () => {},
    setLike: async () => {},
  };
}

/** Creates a username lookup that the test can resolve after a wallet change. */
function deferredUsername() {
  let resolve!: (username: string | null) => void;
  const promise = new Promise<string | null>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Mounts or updates the provider using the test's shared QueryClient. */
async function render(client: DiscussionsClient, user: DiscussionUser | null) {
  await act(async () => {
    const tree = (
      <QueryClientProvider client={queryClient}>
        <DiscussionsProvider client={client} user={user}>
          <Probe />
        </DiscussionsProvider>
      </QueryClientProvider>
    );
    if (rerender) rerender(tree);
    else rerender = renderTree(tree).rerender;
  });
}

/** The identity the provider derives for a stub client: the default profile route on its deployment. */
function expected(address: string, username?: string | null, baseUrl = "https://seer.example") {
  return userFromAddress(address, username, `${baseUrl}/portfolio/${username ? `@${username}` : address}`);
}

/** Waits for React Query notifications to reach the provider before checking its identity. */
async function expectUser(user: DiscussionUser | null) {
  await waitFor(() => expect(context.user).toEqual(user), { interval: 5 });
}

/** Unmounts the tree so the next render starts a fresh provider. */
function unmount() {
  cleanup();
  rerender = undefined;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } } });
});

afterEach(() => {
  unmount();
  queryClient.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  focusManager.setFocused(undefined);
});

describe("discussion user resolution", () => {
  it("keeps the wallet usable while loading the default username and profile link", async () => {
    const lookup = deferredUsername();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ user: { username: await lookup.promise } })));
    vi.stubGlobal("fetch", fetchMock);
    const client = createDiscussionsClient(SEER_CLIENT_OPTIONS);
    await render(client, userFromAddress(FIRST));
    expect(context.user).toEqual(userFromAddress(FIRST, undefined, `https://seer.example/portfolio/${FIRST}`));
    lookup.resolve("alice");
    await expectUser(userFromAddress(FIRST, "alice", "https://seer.example/portfolio/@alice"));
    await render(client, userFromAddress(FIRST));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("switches wallets and does not display a late result for the old wallet", async () => {
    const first = deferredUsername();
    const second = deferredUsername();
    const client = clientWith(vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise));
    await render(client, userFromAddress(FIRST));
    await render(client, userFromAddress(SECOND));
    first.resolve("alice");
    await expectUser(expected(SECOND));
    second.resolve("bob");
    await expectUser(expected(SECOND, "bob"));
  });

  it("does not restore a user after sign-out while a lookup is pending", async () => {
    const lookup = deferredUsername();
    const client = clientWith(() => lookup.promise);
    await render(client, userFromAddress(FIRST));
    await render(client, null);
    lookup.resolve("alice");
    await expectUser(null);
  });

  it("keeps cached usernames separate for different API deployments", async () => {
    await render(
      clientWith(async () => "first-api"),
      userFromAddress(FIRST),
    );
    await expectUser(expected(FIRST, "first-api"));
    const lookup = deferredUsername();
    const other = "https://other-seer.example";
    await render(
      clientWith(() => lookup.promise, other),
      userFromAddress(FIRST),
    );
    expect(context.user).toEqual(expected(FIRST, undefined, other));
    lookup.resolve("second-api");
    await expectUser(expected(FIRST, "second-api", other));
  });

  it.each([undefined, "/host-profile"])(
    "uses a supplied username with optional href override %s",
    async (profileHref) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const client = createDiscussionsClient(SEER_CLIENT_OPTIONS);
      await render(client, userFromAddress(FIRST, "host-name", profileHref));
      expect(context.user).toEqual(
        userFromAddress(FIRST, "host-name", profileHref ?? "https://seer.example/portfolio/@host-name"),
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("loads the default username while preserving an href-only override", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: { username: "alice" } }))));
    const client = createDiscussionsClient(SEER_CLIENT_OPTIONS);
    await render(client, userFromAddress(FIRST, undefined, "/host-profile"));
    await expectUser(userFromAddress(FIRST, "alice", "/host-profile"));
  });

  it.each(["alice", null])("reuses a fresh cached username (%s) across markets", async (username) => {
    const getUsername = vi.fn().mockResolvedValue(username);
    const client = clientWith(getUsername);
    await render(client, userFromAddress(FIRST));
    await expectUser(expected(FIRST, username));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    unmount();
    await render({ ...client, marketId: "another-market" }, userFromAddress(FIRST));
    expect(context.user).toEqual(expected(FIRST, username));
    expect(getUsername).toHaveBeenCalledTimes(1);
  });

  it.each(["alice", null])("refreshes username (%s) through the app's publicUser invalidation", async (username) => {
    const getUsername = vi.fn().mockResolvedValueOnce(username).mockResolvedValueOnce("updated");
    await render(clientWith(getUsername), userFromAddress(FIRST));
    await expectUser(expected(FIRST, username));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ["publicUser"] });
    });
    await expectUser(expected(FIRST, "updated"));
    expect(getUsername).toHaveBeenCalledTimes(2);
  });

  it("inherits retries from the app's QueryClient without blocking the wallet", async () => {
    queryClient.setDefaultOptions({ queries: { retry: 1, retryDelay: 0, gcTime: Number.POSITIVE_INFINITY } });
    const getUsername = vi.fn().mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValueOnce("alice");
    await render(clientWith(getUsername), userFromAddress(FIRST));
    expect(context.user?.address).toBe(FIRST);
    await expectUser(expected(FIRST, "alice"));
    expect(getUsername).toHaveBeenCalledTimes(2);
  });

  it("refetches stale usernames on focus using the app's settings", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    queryClient.setDefaultOptions({
      queries: { retry: false, refetchOnWindowFocus: true, gcTime: Number.POSITIVE_INFINITY },
    });
    const getUsername = vi.fn().mockResolvedValueOnce("alice").mockResolvedValueOnce("renamed");
    await render(clientWith(getUsername), userFromAddress(FIRST));
    await expectUser(expected(FIRST, "alice"));
    now.mockReturnValue(61_001);
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    await expectUser(expected(FIRST, "renamed"));
    expect(getUsername).toHaveBeenCalledTimes(2);
  });

  it("keeps the wallet identity after lookup fails", async () => {
    const getUsername = vi.fn().mockRejectedValue(new Error("Unavailable"));
    await render(clientWith(getUsername), userFromAddress(FIRST));
    await waitFor(() => expect(queryClient.getQueryCache().getAll()[0].state.status).toBe("error"));
    expect(context.user).toEqual(expected(FIRST));
  });

  it("ignores a cached lookup when the host supplies the username", async () => {
    queryClient.setQueryData(["publicUser", "seer-discussions-username", "https://seer.example", FIRST], "cached-name");
    await render(
      clientWith(async () => "cached-name"),
      userFromAddress(FIRST, "alice"),
    );
    expect(context.user).toEqual(expected(FIRST, "alice"));
  });
});
