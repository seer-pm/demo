import { type Address, getAddress } from "viem";
import { gnosis, optimism } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCode = vi.fn<(args: { address: Address }) => Promise<string | undefined>>();

vi.mock("./config", () => ({
  getPublicClientByChainId: () => ({ getCode }),
}));

const { clearPortfolioIdentityCache, resolvePortfolioIdentity } = await import("./portfolioIdentity");
const { TRADE_EXECUTOR_CHAINS, predictedExecutorsForOwner } = await import("./tradeExecutorOwnersCore");

/** The wallet from the report: two deployed executors on Optimism. */
const OWNER = "0xf0d2e80166588893f14d5ace57cdd342c15f7fdf" as Address;

const OP_EXECUTORS = predictedExecutorsForOwner(OWNER, TRADE_EXECUTOR_CHAINS[optimism.id]) as Address[];
const GNOSIS_EXECUTORS = predictedExecutorsForOwner(OWNER, TRADE_EXECUTOR_CHAINS[gnosis.id]) as Address[];

const CODE = "0x60806040";

/** `getCode` returning code only for `deployed`; everything else is an empty account. */
function deployOnly(deployed: string[]) {
  const set = new Set(deployed.map((address) => address.toLowerCase()));
  getCode.mockImplementation(async ({ address }) => (set.has(address.toLowerCase()) ? CODE : "0x"));
}

beforeEach(() => {
  clearPortfolioIdentityCache();
  getCode.mockReset();
});

describe("resolvePortfolioIdentity", () => {
  it("predicts the two real Optimism executors for the reported wallet", () => {
    // Verified against Optimism: both of these have bytecode.
    expect(OP_EXECUTORS).toEqual([
      "0x37bf93b1380e0df59d2d54bd19d6333accfa0185",
      "0x730a646f7b9256e32e7dbaa76ba7a862c6979db0",
    ]);
  });

  it("keeps every deployed executor", async () => {
    deployOnly(OP_EXECUTORS);
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(identity.wallets).toEqual([OWNER, ...OP_EXECUTORS]);
    expect(identity.walletsForChain(optimism.id)).toEqual([OWNER, ...OP_EXECUTORS]);
    expect(OP_EXECUTORS.every((executor) => identity.isExecutor(executor))).toBe(true);
    expect(identity.isExecutor(OWNER)).toBe(false);
  });

  it("drops a predicted address that was never deployed", async () => {
    deployOnly([OP_EXECUTORS[0]]);
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(identity.wallets).toEqual([OWNER, OP_EXECUTORS[0]]);
  });

  it("returns the account alone when nothing is deployed", async () => {
    deployOnly([]);
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(identity.wallets).toEqual([OWNER]);
    expect(identity.walletsForChain(optimism.id)).toEqual([OWNER]);
  });

  it("scopes executors to their own chain", async () => {
    deployOnly([...OP_EXECUTORS, ...GNOSIS_EXECUTORS]);
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(identity.walletsForChain(optimism.id)).toEqual([OWNER, ...OP_EXECUTORS]);
    expect(identity.walletsForChain(gnosis.id)).toEqual([OWNER, ...GNOSIS_EXECUTORS]);
    // A chain without a TradeExecutor factory contributes nothing.
    expect(identity.walletsForChain(1)).toEqual([OWNER]);
  });

  it("keeps one chain's executors when another chain's RPC fails", async () => {
    const gnosisSet = new Set(GNOSIS_EXECUTORS.map((a) => a.toLowerCase()));
    getCode.mockImplementation(async ({ address }) => {
      if (gnosisSet.has(address.toLowerCase())) throw new Error("gnosis rpc down");
      return OP_EXECUTORS.includes(address.toLowerCase() as Address) ? CODE : "0x";
    });
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(identity.wallets).toEqual([OWNER, ...OP_EXECUTORS]);
  });

  it("degrades to the account alone when every probe throws", async () => {
    getCode.mockRejectedValue(new Error("rpc down"));
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(identity.wallets).toEqual([OWNER]);
  });

  it("does not canonicalize an executor address to its owner", async () => {
    // Decision: /portfolio/<executor> stays the executor's own view. Its predicted executors are
    // undeployed, so this needs no special case.
    deployOnly(OP_EXECUTORS);
    const identity = await resolvePortfolioIdentity(OP_EXECUTORS[0]);
    expect(identity.wallets).toEqual([OP_EXECUTORS[0]]);
  });

  it("lowercases a checksummed account so cache keys and row tags match", async () => {
    deployOnly(OP_EXECUTORS);
    const identity = await resolvePortfolioIdentity(getAddress(OWNER));
    expect(identity.account).toBe(OWNER);
    expect(identity.wallets[0]).toBe(OWNER);
  });

  it("memoizes, so a second call issues no further getCode", async () => {
    deployOnly(OP_EXECUTORS);
    await resolvePortfolioIdentity(OWNER);
    const callsAfterFirst = getCode.mock.calls.length;
    await resolvePortfolioIdentity(OWNER);
    expect(getCode.mock.calls.length).toBe(callsAfterFirst);
  });

  it("does not cache a total failure, so the next caller retries", async () => {
    getCode.mockRejectedValue(new Error("rpc down"));
    await resolvePortfolioIdentity(OWNER);
    const callsAfterFirst = getCode.mock.calls.length;
    deployOnly(OP_EXECUTORS);
    const identity = await resolvePortfolioIdentity(OWNER);
    expect(getCode.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    expect(identity.wallets).toEqual([OWNER, ...OP_EXECUTORS]);
  });
});
