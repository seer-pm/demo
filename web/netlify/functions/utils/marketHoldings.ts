import type { SupportedChain } from "@seer-pm/sdk";
import { type Address, formatUnits } from "viem";
import { seerEnvioSdk } from "./envioClient";
import type { HoldingsByWallet } from "./marketMtmRefresh";
import { getTokenDecimals } from "./tokenDecimals";

const PAGE = 1000;

/**
 * Every wallet holding any of these tokens, in human units.
 *
 * This is the read that makes the MTM loop market-shaped: one query per market returns all its
 * holders, instead of one balance query per wallet. Zero balances are dropped — a wallet that
 * exited still needs its row set to 0, but the caller learns that from the row's absence here.
 */
export async function fetchHoldersOfTokens(chainId: SupportedChain, tokens: Address[]): Promise<HoldingsByWallet> {
  const out: HoldingsByWallet = new Map();
  const tokenLcs = [...new Set(tokens.map((t) => t.toLowerCase()))];
  if (tokenLcs.length === 0) return out;

  const decimalsByToken = getTokenDecimals(chainId, tokenLcs as Address[]);
  const sdk = seerEnvioSdk(chainId);
  let offset = 0;
  for (;;) {
    const { TokenBalance: rows } = await sdk.GetTokenBalances({
      limit: PAGE,
      offset,
      where: {
        chainId: { _eq: String(chainId) },
        token: { _in: tokenLcs },
      },
    });
    for (const row of rows) {
      const balance = BigInt(row.balance);
      if (balance === 0n) continue;
      const token = row.token.toLowerCase();
      const account = row.account.toLowerCase();
      const decimals = decimalsByToken[token] ?? 18;
      const byToken = out.get(account) ?? new Map<string, number>();
      byToken.set(token, Number(formatUnits(balance, decimals)));
      out.set(account, byToken);
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return out;
}
