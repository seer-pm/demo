import type { Address } from "viem";
import { formatUnits, getAddress, isAddressEqual, zeroAddress } from "viem";
import type { SupportedChain } from "./chains";
import { COLLATERAL_TOKENS } from "./collateral";
import type { Market } from "./market-types";
import { getComputedPoolAddressesForMarket } from "./pool-address";
import type { TransactionData } from "./portfolio-types";
import { getRouterAddresses } from "./router-addresses";
import type { TokenTransfer } from "./tokens";

export type ReconstructSplitMergeRedeemParams = {
  market: Market;
  options?: {
    identifySwaps?: boolean;
    /** Overrides CREATE2-derived pools (tests / non-standard factory). */
    poolAddresses?: Address[];
  };
};

/** Unique wallet on router↔user legs for this tx (same address on all such legs). */
function inferTradeCounterparty(
  grouped: { outcome: TokenTransfer[]; primary: TokenTransfer[] },
  routers: Address[],
): Address | null {
  const candidates = new Set<Address>();
  const isRouter = (a: Address) => routers.some((r) => isAddressEqual(r, a));
  const consider = (from: Address, to: Address) => {
    const fromIsRouter = isRouter(from);
    const toIsRouter = isRouter(to);
    // Mint / wrap paths show `from` as zero; ignore so splitFromBase (router↔user) still resolves to one wallet.
    if (fromIsRouter && !toIsRouter && !isAddressEqual(to, zeroAddress)) candidates.add(getAddress(to));
    else if (!fromIsRouter && toIsRouter && !isAddressEqual(from, zeroAddress)) candidates.add(getAddress(from));
  };

  for (const row of grouped.outcome) consider(row.from, row.to);
  for (const row of grouped.primary) consider(row.from, row.to);
  if (candidates.size !== 1) return null;

  const winner = [...candidates][0]!;
  for (const row of [...grouped.outcome, ...grouped.primary]) {
    if (isAddressEqual(row.from, winner)) return row.from;
    if (isAddressEqual(row.to, winner)) return row.to;
  }
  return winner;
}

function pow10(exp: number): bigint {
  let out = 1n;
  for (let i = 0; i < exp; i++) out *= 10n;
  return out;
}

function normalizeWeiTo18(valueWei: bigint, decimals: number): bigint {
  if (decimals === 18) return valueWei;
  if (decimals < 18) return valueWei * pow10(18 - decimals);
  return valueWei / pow10(decimals - 18);
}

/**
 * Groups collateral + outcome transfers by tx and classifies split / merge / redeem for one market.
 * Optional swap legs (DEX pool ↔ user) when `options.identifySwaps` is true.
 */
export function reconstructSplitMergeRedeemFromTransfers(
  transfers: TokenTransfer[],
  params: ReconstructSplitMergeRedeemParams,
): TransactionData[] {
  const { market, options } = params;
  const chainId = market.chainId as SupportedChain;
  const identifySwaps = options?.identifySwaps === true;

  const primary = COLLATERAL_TOKENS[chainId]?.primary;
  if (!primary) {
    return [];
  }

  const routers = getRouterAddresses(chainId);
  if (routers.length === 0) {
    return [];
  }

  const poolOverride = options?.poolAddresses;
  const effectivePools: Address[] =
    poolOverride && poolOverride.length > 0 ? poolOverride : getComputedPoolAddressesForMarket(market);
  const poolHas = (a: Address) => effectivePools.some((p) => isAddressEqual(p, a));
  const routerHas = (a: Address) => routers.some((r) => isAddressEqual(r, a));

  const primaryTokenLc = primary.address.toLowerCase();
  const outcomeTokenLcs = market.wrappedTokens.map((t) => t.toLowerCase());
  const outcomeTokenSet = new Set(outcomeTokenLcs);
  const primaryDecimals = primary.decimals;

  const transfersByTx = new Map<string, { outcome: TokenTransfer[]; primary: TokenTransfer[] }>();

  for (const t of transfers) {
    const tokenLc = String(t.token).toLowerCase();
    const entry = transfersByTx.get(t.tx_hash) ?? { outcome: [], primary: [] };
    if (tokenLc === primaryTokenLc) {
      entry.primary.push(t);
    } else if (outcomeTokenSet.has(tokenLc)) {
      entry.outcome.push(t);
    }
    transfersByTx.set(t.tx_hash, entry);
  }

  const events: TransactionData[] = [];

  for (const [txHash, grouped] of transfersByTx.entries()) {
    if (grouped.outcome.length === 0) {
      continue;
    }

    const account = inferTradeCounterparty(grouped, routers);
    let smrEvent: TransactionData | null = null;
    if (account !== null) {
      const outcomeSentWeiByToken: Record<string, bigint> = {};
      const outcomeRecvWeiByToken: Record<string, bigint> = {};

      let timestamp = 0;
      let blockNumber = 0;
      for (const row of grouped.outcome) {
        timestamp = Math.max(timestamp, Number(row.timestamp));
        blockNumber = Math.max(blockNumber, Number(row.block_number));
        const tokenLc = String(row.token).toLowerCase();
        const valueWei = row.value;
        const fromIsUser = isAddressEqual(row.from, account);
        const toIsUser = isAddressEqual(row.to, account);

        if (toIsUser) {
          outcomeRecvWeiByToken[tokenLc] = (outcomeRecvWeiByToken[tokenLc] ?? 0n) + valueWei;
        } else if (fromIsUser) {
          outcomeSentWeiByToken[tokenLc] = (outcomeSentWeiByToken[tokenLc] ?? 0n) + valueWei;
        }
      }

      let primaryNetWei = 0n;
      for (const row of grouped.primary) {
        const valueWei = row.value;
        const toIsUser = isAddressEqual(row.to, account);
        const fromIsUser = isAddressEqual(row.from, account);
        // Mint/wrap: primary `from` zero → router counts like user paying primary (e.g. xDAI → sDAI then split).
        const mintedPrimaryToRouter = isAddressEqual(row.from, zeroAddress) && routerHas(row.to);

        if (toIsUser) primaryNetWei += valueWei;
        else if (fromIsUser) primaryNetWei -= valueWei;
        else if (mintedPrimaryToRouter) primaryNetWei -= valueWei;
      }

      const hasOutcomeRecv = Object.values(outcomeRecvWeiByToken).some((v) => v > 0n);
      const hasOutcomeSent = Object.values(outcomeSentWeiByToken).some((v) => v > 0n);

      const primaryNet18 = normalizeWeiTo18(primaryNetWei, primaryDecimals);

      const sentAllOutcomes = outcomeTokenLcs.every((t) => (outcomeSentWeiByToken[t] ?? 0n) > 0n);
      const recvAllOutcomes = outcomeTokenLcs.every((t) => (outcomeRecvWeiByToken[t] ?? 0n) > 0n);
      const sentAmounts = outcomeTokenLcs.map((t) => outcomeSentWeiByToken[t] ?? 0n);
      const recvAmounts = outcomeTokenLcs.map((t) => outcomeRecvWeiByToken[t] ?? 0n);

      const isAllEqual = (arr: bigint[]) => arr.length > 0 && arr.every((x) => x === arr[0]);

      let smrType: Extract<TransactionData["type"], "split" | "merge" | "redeem"> | null = null;
      let amountWei18: bigint | null = null;

      if (primaryNetWei < 0n && hasOutcomeRecv) {
        if (recvAllOutcomes && isAllEqual(recvAmounts)) {
          const base = recvAmounts[0]!;
          amountWei18 = base;
          smrType = "split";
        } else {
          smrType = "split";
        }
      } else if (primaryNetWei > 0n && hasOutcomeSent) {
        if (sentAllOutcomes && isAllEqual(sentAmounts)) {
          const base = sentAmounts[0]!;
          amountWei18 = base;
          if (primaryNet18 === base) {
            smrType = "merge";
          } else {
            smrType = "redeem";
          }
        } else {
          smrType = "redeem";
        }
      }
      if (smrType !== null) {
        const amountHuman =
          amountWei18 !== null
            ? formatUnits(amountWei18, 18)
            : formatUnits(primaryNetWei < 0n ? -primaryNetWei : primaryNetWei, primaryDecimals);

        smrEvent = {
          marketName: market.marketName,
          marketId: market.id.toLowerCase(),
          type: smrType,
          blockNumber,
          collateral: primary.address,
          collateralSymbol: primary.symbol,
          timestamp,
          transactionHash: txHash,
          amount: smrType === "redeem" ? undefined : amountHuman,
          payout: smrType === "redeem" ? formatUnits(primaryNetWei, primaryDecimals) : undefined,
          trader: account,
        };
      }
    }
    if (smrEvent !== null) {
      events.push(smrEvent);
      continue;
    }

    if (!identifySwaps || effectivePools.length === 0) {
      continue;
    }

    for (const row of grouped.outcome) {
      if (routerHas(row.from) || routerHas(row.to)) {
        continue;
      }

      const legType: "bought" | "sold" = poolHas(row.from) ? "bought" : "sold";
      const trader = poolHas(row.from) ? row.to : row.from;

      events.push({
        marketName: market.marketName,
        marketId: market.id.toLowerCase(),
        type: legType,
        blockNumber: Number(row.block_number),
        collateral: primary.address,
        collateralSymbol: primary.symbol,
        timestamp: Number(row.timestamp),
        transactionHash: txHash,
        amount: formatUnits(row.value, 18),
        trader,
        outcomeToken: row.token,
        transferId: row.id,
      });
    }
  }

  events.sort((a, b) => b.timestamp - a.timestamp);

  return events;
}
