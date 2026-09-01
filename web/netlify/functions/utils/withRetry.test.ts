import { afterEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "./withRetry";

// withRetry logs each retry; keep the test output readable.
vi.spyOn(console, "log").mockImplementation(() => {});
afterEach(() => vi.clearAllMocks());

/** Fails `failures` times with `error`, then returns "ok". Records how many times it ran. */
function flaky(failures: number, error: unknown) {
  const state = { calls: 0 };
  const fn = async () => {
    state.calls++;
    if (state.calls <= failures) throw error;
    return "ok";
  };
  return { fn, state };
}

describe("withRetry", () => {
  it("retries a Postgres statement timeout and returns the eventual result", async () => {
    const { fn, state } = flaky(1, { code: "57014", message: "canceling statement due to statement timeout" });
    await expect(withRetry(fn, "test", 2)).resolves.toBe("ok");
    expect(state.calls).toBe(2);
  });

  it("retries a Graph gateway indexer failure", async () => {
    // The real shape that aborted an airdrop backfill mid-run: no `code`, no `name`, and a message
    // that none of the original network patterns matched, so it was treated as permanent.
    const { fn, state } = flaky(1, {
      message: "bad indexers: {0x3b9ba748691f135b71582dc3292e5e3ed7e13341: BadResponse(404)}",
    });
    await expect(withRetry(fn, "subgraph", 2)).resolves.toBe("ok");
    expect(state.calls).toBe(2);
  });

  it.each([
    ["bad gateway", { message: "502 bad gateway" }],
    ["service unavailable", { message: "service unavailable" }],
    ["socket hang up", { message: "socket hang up" }],
    ["abort", { name: "AbortError", message: "The operation was aborted" }],
    ["fetch failed", { message: "fetch failed" }],
  ])("treats %s as transient", async (_label, error) => {
    const { fn } = flaky(1, error);
    await expect(withRetry(fn, "test", 2)).resolves.toBe("ok");
  });

  it("does not retry an error that is not transient", async () => {
    // Widening the matcher must not turn genuine failures into slow ones.
    const { fn, state } = flaky(5, { code: "42703", message: 'column "nope" does not exist' });
    await expect(withRetry(fn, "test", 3)).rejects.toMatchObject({ code: "42703" });
    expect(state.calls).toBe(1);
  });

  it("gives up after the retry budget and rethrows the last error", async () => {
    const { fn, state } = flaky(99, { code: "57014", message: "statement timeout" });
    await expect(withRetry(fn, "test", 2)).rejects.toMatchObject({ code: "57014" });
    expect(state.calls).toBe(3); // initial attempt + 2 retries
  });
});
