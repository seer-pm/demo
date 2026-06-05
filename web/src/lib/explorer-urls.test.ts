import { getLiquidityUrl } from "@seer-pm/sdk";
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
});
