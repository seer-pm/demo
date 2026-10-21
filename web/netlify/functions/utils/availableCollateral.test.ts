import type { CollateralProfile, Token } from "@seer-pm/sdk";
import { NATIVE_TOKEN } from "@seer-pm/sdk";
import { describe, expect, it } from "vitest";
import { availableCollateralTokens, sumAvailableCollateralUsd } from "./availableCollateral";

const sDAI: Token = {
  address: "0xaf204776c7245bf4147c2612bf6e5972ee483701",
  chainId: 100,
  symbol: "sDAI",
  decimals: 18,
};
const wxDAI: Token = {
  address: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  chainId: 100,
  symbol: "wxDAI",
  decimals: 18,
};
const xDAI: Token = { address: NATIVE_TOKEN, chainId: 100, symbol: "xDAI", decimals: 18, wrapped: wxDAI };
const USDC: Token = { address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", chainId: 10, symbol: "USDC", decimals: 6 };

describe("available collateral", () => {
  it("counts the primary, the secondary with its wrapped form, and the swap tokens", () => {
    const gnosis: CollateralProfile = { primary: sDAI, secondary: xDAI };
    expect(availableCollateralTokens(gnosis).map((t) => t.symbol)).toEqual(["sDAI", "xDAI", "wxDAI"]);
    const optimism: CollateralProfile = { primary: { ...sDAI, symbol: "sUSDS" }, swap: [USDC] };
    expect(availableCollateralTokens(optimism).map((t) => t.symbol)).toEqual(["sUSDS", "USDC"]);
  });

  it("marks the primary at its USD price and every stablecoin at 1, honouring decimals", () => {
    const usd = sumAvailableCollateralUsd(
      [
        { token: sDAI, balance: 100n * 10n ** 18n },
        { token: xDAI, balance: 5n * 10n ** 18n },
        { token: wxDAI, balance: 2n * 10n ** 18n },
        { token: USDC, balance: 3n * 10n ** 6n },
      ],
      sDAI,
      1.1,
    );
    expect(usd).toBeCloseTo(100 * 1.1 + 5 + 2 + 3, 9);
  });

  it("is zero for an empty wallet", () => {
    expect(sumAvailableCollateralUsd([], sDAI, 1.1)).toBe(0);
  });
});
