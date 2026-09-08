import type { SupportedChain } from "@seer-pm/sdk";
import type { Market } from "@seer-pm/sdk/market-types";
import type { Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetTransferDistinctMarkets = vi.fn();
const GetTokenBalances = vi.fn();
const fetchMarketIdsByTokens = vi.fn();
const loadMarketsByIds = vi.fn();

vi.mock("./envioClient", () => ({
  seerEnvioSdk: () => ({ GetTransferDistinctMarkets, GetTokenBalances }),
}));
vi.mock("./markets", () => ({
  fetchMarketIdsByTokens: (...args: unknown[]) => fetchMarketIdsByTokens(...args),
  loadMarketsByIds: (...args: unknown[]) => loadMarketsByIds(...args),
}));

import { loadAccountMarkets } from "./accountMarkets";
import { fetchMarketIdsFromAccountTransfers } from "./seerIndexerPortfolio";

const CHAIN = 10 as SupportedChain;
const ACCOUNT = "0xaB07C88E2aAb4BfFe8BfaE10043BA2Bbdd82A809" as Address;
const MARKET_A = "0xaaaa000000000000000000000000000000000001";
const MARKET_B = "0xaaaa000000000000000000000000000000000002";
const TOKEN_A1 = "0xtoken000000000000000000000000000000000a1";
const TOKEN_A2 = "0xtoken000000000000000000000000000000000a2";
const TOKEN_B1 = "0xtoken000000000000000000000000000000000b1";

function market(id: string, wrappedTokens: string[]): Market {
  return { id, wrappedTokens } as unknown as Market;
}

function balanceRow(token: string, balance: string) {
  return { token, balance };
}

beforeEach(() => {
  GetTransferDistinctMarkets.mockReset();
  GetTokenBalances.mockReset();
  fetchMarketIdsByTokens.mockReset();
  loadMarketsByIds.mockReset();
  GetTokenBalances.mockResolvedValue({ TokenBalance: [] });
  GetTransferDistinctMarkets.mockResolvedValue({ Transfer: [] });
  fetchMarketIdsByTokens.mockResolvedValue([]);
  loadMarketsByIds.mockResolvedValue([]);
});

describe("fetchMarketIdsFromAccountTransfers", () => {
  it("resolves the whole market set in one distinct_on call", async () => {
    GetTransferDistinctMarkets.mockResolvedValueOnce({
      Transfer: [
        { market_id: `10:${MARKET_A}`, market: { address: MARKET_A } },
        { market_id: `10:${MARKET_B}`, market: { address: MARKET_B } },
      ],
    });

    const ids = await fetchMarketIdsFromAccountTransfers(ACCOUNT, CHAIN, 1_700_000_000);

    expect(ids).toEqual([MARKET_A, MARKET_B]);
    expect(GetTransferDistinctMarkets).toHaveBeenCalledTimes(1);
  });

  it("drops the collapsed null-market row and lowercases", async () => {
    GetTransferDistinctMarkets.mockResolvedValueOnce({
      Transfer: [
        { market_id: null, market: null },
        { market_id: `10:${MARKET_A}`, market: { address: MARKET_A.toUpperCase() } },
        { market_id: `10:${MARKET_A}`, market: { address: MARKET_A } },
      ],
    });

    expect(await fetchMarketIdsFromAccountTransfers(ACCOUNT, CHAIN, 1_700_000_000)).toEqual([MARKET_A]);
  });

  it("keeps the same account/kind filter as the scan it replaces", async () => {
    await fetchMarketIdsFromAccountTransfers(ACCOUNT, CHAIN, 1_700_000_000);

    const { where } = GetTransferDistinctMarkets.mock.calls[0][0];
    expect(where.kind).toEqual({ _in: ["outcome", "router_collateral"] });
    expect(where.timestamp).toEqual({ _lte: "1700000000" });
    expect(where._or).toEqual([{ from: { _eq: ACCOUNT.toLowerCase() } }, { to: { _eq: ACCOUNT.toLowerCase() } }]);
  });
});

describe("loadAccountMarkets", () => {
  it("skips the token->market lookup when the transfer scan already covers every held token", async () => {
    GetTransferDistinctMarkets.mockResolvedValueOnce({
      Transfer: [{ market_id: `10:${MARKET_A}`, market: { address: MARKET_A } }],
    });
    GetTokenBalances.mockResolvedValueOnce({
      TokenBalance: [balanceRow(TOKEN_A1, "5"), balanceRow(TOKEN_A2, "0")],
    });
    loadMarketsByIds.mockResolvedValueOnce([market(MARKET_A, [TOKEN_A1, TOKEN_A2])]);

    const { markets, heldTokenIds } = await loadAccountMarkets(ACCOUNT, CHAIN);

    expect(markets.map((m) => m.id)).toEqual([MARKET_A]);
    // Zero balances stay in the token list: they are markets the wallet traded and exited.
    expect(heldTokenIds).toEqual([TOKEN_A1, TOKEN_A2]);
    expect(fetchMarketIdsByTokens).not.toHaveBeenCalled();
    expect(loadMarketsByIds).toHaveBeenCalledTimes(1);
  });

  it("falls back to the token lookup only for tokens no scanned market covers", async () => {
    GetTransferDistinctMarkets.mockResolvedValueOnce({
      Transfer: [{ market_id: `10:${MARKET_A}`, market: { address: MARKET_A } }],
    });
    GetTokenBalances.mockResolvedValueOnce({
      TokenBalance: [balanceRow(TOKEN_A1, "5"), balanceRow(TOKEN_B1, "7")],
    });
    loadMarketsByIds
      .mockResolvedValueOnce([market(MARKET_A, [TOKEN_A1])])
      .mockResolvedValueOnce([market(MARKET_B, [TOKEN_B1])]);
    fetchMarketIdsByTokens.mockResolvedValueOnce([MARKET_B]);

    const { markets } = await loadAccountMarkets(ACCOUNT, CHAIN);

    expect(fetchMarketIdsByTokens).toHaveBeenCalledWith(CHAIN, [TOKEN_B1]);
    expect(markets.map((m) => m.id)).toEqual([MARKET_A, MARKET_B]);
  });

  it("does not reload a market the transfer scan already returned", async () => {
    GetTransferDistinctMarkets.mockResolvedValueOnce({
      Transfer: [{ market_id: `10:${MARKET_A}`, market: { address: MARKET_A } }],
    });
    GetTokenBalances.mockResolvedValueOnce({ TokenBalance: [balanceRow(TOKEN_B1, "7")] });
    loadMarketsByIds.mockResolvedValueOnce([market(MARKET_A, [TOKEN_A1])]);
    fetchMarketIdsByTokens.mockResolvedValueOnce([MARKET_A]);

    const { markets } = await loadAccountMarkets(ACCOUNT, CHAIN);

    expect(markets.map((m) => m.id)).toEqual([MARKET_A]);
    expect(loadMarketsByIds).toHaveBeenCalledTimes(1);
  });
});
