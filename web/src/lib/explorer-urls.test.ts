import { getLiquidityUrl } from "@seer-pm/order-book";
import type { Market } from "@seer-pm/sdk";
import { base } from "viem/chains";
import { describe, expect, it } from "vitest";

describe("getLiquidityUrl", () => {
  const orderBookMarket = {
    chainId: base.id,
    type: "Generic",
    collateralToken: "0x0000000000000000000000000000000000000003",
    wrappedTokens: ["0x0000000000000000000000000000000000000002", "0x0000000000000000000000000000000000000001"],
  } as unknown as Market;

  it("links to Uniswap V4 with LimitOrderHook for order-book markets", () => {
    const url = getLiquidityUrl(orderBookMarket, 0);
    expect(url).toContain("app.uniswap.org/positions/create/v4");
    expect(url).toContain("hook=0x8D34ff3de81395859E14267f2678a3044344D040");
    expect(url).toContain("chain=base");
    expect(url).toContain("feeTier=3000");
  });

  it("links to Uniswap explore pool page when the V4 pool is initialized", () => {
    const url = getLiquidityUrl(orderBookMarket, 0, { isPoolInitialized: true });
    expect(url).toMatch(/^https:\/\/app\.uniswap\.org\/explore\/pools\/base\/0x[0-9a-f]{64}$/);
    expect(url).not.toContain("positions/create");
  });

  it("links to Uniswap V3 when dex is UniV3 on an order-book market", () => {
    const url = getLiquidityUrl(orderBookMarket, 0, { dex: "UniV3" });
    expect(url).toContain("app.uniswap.org/positions/create/v3");
    expect(url).toContain("chain=base");
    expect(url).not.toContain("positions/create/v4");
  });

  it("links to Uniswap explore pool page when UniV3 pool is initialized", () => {
    const poolId = "0x1111111111111111111111111111111111111111";
    const url = getLiquidityUrl(orderBookMarket, 0, {
      dex: "UniV3",
      isPoolInitialized: true,
      poolId,
    });
    expect(url).toBe(`https://app.uniswap.org/explore/pools/base/${poolId}`);
    expect(url).not.toContain("positions/create");
  });
});
