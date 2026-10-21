import { isTwoStringsEqual } from "@/lib/utils.ts";
import type { CollateralProfile, SupportedChain, Token } from "@seer-pm/sdk";
import { NATIVE_TOKEN } from "@seer-pm/sdk";
import { type Address, erc20Abi, formatUnits } from "viem";
import { getBalance, multicall } from "viem/actions";
import { getPublicClientByChainId } from "./config.ts";

export type CollateralHolding = { token: Token; balance: bigint };

/**
 * The tokens that count as money ready to trade: every token the swap widget accepts as payment.
 * That is the profile primary plus its secondary (with the wrapped form, so wxDAI counts next to
 * xDAI) and the swap tokens. Counting only the primary would hide the xDAI most Gnosis wallets
 * actually hold, while the app wraps and deposits it on the user's behalf at buy time.
 */
export function availableCollateralTokens(profile: CollateralProfile): Token[] {
  const tokens: Token[] = [profile.primary];
  if (profile.secondary) {
    tokens.push(profile.secondary);
    if (profile.secondary.wrapped) tokens.push(profile.secondary.wrapped);
  }
  tokens.push(...(profile.swap ?? []));
  return tokens;
}

/**
 * USD value of idle collateral. The primary is marked at its own USD price because yield-bearing
 * tokens (sDAI, sUSDS) trade above 1. Every other accepted token is a USD stablecoin (xDAI, wxDAI,
 * DAI, USDS, USDC), so it is marked at 1 rather than paying a price lookup per token.
 */
export function sumAvailableCollateralUsd(holdings: CollateralHolding[], primary: Token, primaryPriceUsd: number) {
  return holdings.reduce((sum, { token, balance }) => {
    const units = Number(formatUnits(balance, token.decimals));
    const price = isTwoStringsEqual(token.address, primary.address) ? primaryPriceUsd : 1;
    return sum + units * price;
  }, 0);
}

/** Balances of `tokens` across `wallets` on one chain: ERC20s in one multicall, the native coin per wallet. */
export async function fetchAvailableCollateralHoldings(
  chainId: SupportedChain,
  wallets: Address[],
  tokens: Token[],
): Promise<CollateralHolding[]> {
  const client = getPublicClientByChainId(chainId);
  const erc20 = tokens.filter((t) => !isTwoStringsEqual(t.address, NATIVE_TOKEN));
  const native = tokens.filter((t) => isTwoStringsEqual(t.address, NATIVE_TOKEN));
  const pairs = wallets.flatMap((wallet) => erc20.map((token) => ({ wallet, token })));

  const [erc20Balances, nativeHoldings] = await Promise.all([
    pairs.length === 0
      ? Promise.resolve([] as bigint[])
      : multicall(client, {
          allowFailure: false,
          contracts: pairs.map(({ wallet, token }) => ({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf" as const,
            args: [wallet] as const,
          })),
        }),
    Promise.all(
      native.flatMap((token) =>
        wallets.map(async (wallet) => ({ token, balance: await getBalance(client, { address: wallet }) })),
      ),
    ),
  ]);

  return [...pairs.map(({ token }, i) => ({ token, balance: erc20Balances[i] })), ...nativeHoldings];
}
