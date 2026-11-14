import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import {
  type AccountReward,
  type Distribution,
  IPFS_GATEWAY,
  PAYOUT_CHAINS,
  accountRewards,
  accountTokens,
  bytes32ToCid,
  urdAbi,
} from "@seer-pm/rewards/claims";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readContract, writeContract } from "@wagmi/core";
import { type Address, type Hex, erc20Abi, zeroHash } from "viem";

export const LIQUIDITY_REWARDS_QUERY_KEY = "liquidityRewards";

export type LiquidityRewardRow = AccountReward & {
  chainId: number;
  distributor: Address;
  symbol: string;
  decimals: number;
};

export type LiquidityRewardsData = {
  rows: LiquidityRewardRow[];
  /** Payout chains with a distributor; empty until the first one is deployed. */
  liveChainIds: number[];
  /** When each chain's pending root becomes claimable (unix seconds), if one is pending. */
  pendingValidAt: Map<number, number>;
};

async function fetchDistribution(hash: Hex, root: Hex, chainId: number): Promise<Distribution> {
  const cid = bytes32ToCid(hash);
  const res = await fetch(`${IPFS_GATEWAY}${cid}`);
  if (!res.ok) throw new Error(`Couldn't read the rewards file ${cid} (${res.status})`);
  const file: Distribution = await res.json();
  // The root is what the distributor checks proofs against; a file for another root would make
  // every claim revert.
  if (file.root !== root || file.payoutChainId !== chainId) {
    throw new Error(`The rewards file ${cid} doesn't match the distributor's root on chain ${chainId}`);
  }
  return file;
}

async function fetchChainRewards(account: Address, chainId: number, distributor: Address) {
  const read = <T>(functionName: "root" | "ipfsHash" | "pendingRoot") =>
    readContract(config, { address: distributor, abi: urdAbi, functionName, chainId }) as Promise<T>;
  const [root, ipfsHash, [pendingRootHash, pendingIpfsHash, validAt]] = await Promise.all([
    read<Hex>("root"),
    read<Hex>("ipfsHash"),
    read<readonly [Hex, Hex, bigint]>("pendingRoot"),
  ]);
  const [active, pending] = await Promise.all([
    ipfsHash === zeroHash ? undefined : fetchDistribution(ipfsHash, root, chainId),
    validAt === 0n ? undefined : fetchDistribution(pendingIpfsHash, pendingRootHash, chainId),
  ]);

  const tokens = accountTokens(account, active, pending);
  const meta = await Promise.all(
    tokens.map(async (token) => {
      const [claimed, symbol, decimals] = await Promise.all([
        readContract(config, {
          address: distributor,
          abi: urdAbi,
          functionName: "claimed",
          args: [account, token],
          chainId,
        }),
        readContract(config, { address: token, abi: erc20Abi, functionName: "symbol", chainId }),
        readContract(config, { address: token, abi: erc20Abi, functionName: "decimals", chainId }),
      ]);
      return { token, claimed, symbol, decimals };
    }),
  );
  const claimed = new Map(meta.map((m) => [m.token, m.claimed]));
  const rows = accountRewards({ account, active, pending, claimed }).map((reward) => {
    const { symbol, decimals } = meta.find((m) => m.token === reward.token)!;
    return { ...reward, chainId, distributor, symbol, decimals };
  });
  return { rows, pendingValidAt: validAt === 0n ? undefined : Number(validAt) };
}

/** Liquidity rewards of `account` on every payout chain whose distributor is deployed. */
export function useLiquidityRewards(account: Address | undefined) {
  const live = Object.entries(PAYOUT_CHAINS).flatMap(([chainId, { distributor }]) =>
    distributor ? [{ chainId: Number(chainId), address: distributor.address }] : [],
  );
  return useQuery({
    queryKey: [LIQUIDITY_REWARDS_QUERY_KEY, account?.toLowerCase()],
    enabled: Boolean(account),
    queryFn: async (): Promise<LiquidityRewardsData> => {
      const chains = await Promise.all(live.map((d) => fetchChainRewards(account!, d.chainId, d.address)));
      const pendingValidAt = new Map<number, number>();
      chains.forEach((c, i) => c.pendingValidAt !== undefined && pendingValidAt.set(live[i].chainId, c.pendingValidAt));
      return { rows: chains.flatMap((c) => c.rows), liveChainIds: live.map((d) => d.chainId), pendingValidAt };
    },
  });
}

/**
 * Claims `row` for `account`. Anyone may send it: the distributor always pays `account`, so a
 * visitor can claim on behalf of the portfolio they are viewing.
 */
export function useClaimLiquidityReward(account: Address | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (row: LiquidityRewardRow) => {
      if (!account) throw new Error("Account required");
      const result = await toastifyTx(
        () =>
          writeContract(config, {
            address: row.distributor,
            abi: urdAbi,
            functionName: "claim",
            args: [account, row.token, row.earned, row.proof],
            chainId: row.chainId as (typeof config)["chains"][number]["id"],
          }),
        { txSent: { title: `Claiming ${row.symbol}...` }, txSuccess: { title: `${row.symbol} claimed!` } },
      );
      if (!result.status) throw result.error;
      return result.receipt;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [LIQUIDITY_REWARDS_QUERY_KEY] }),
  });
}
