import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import type { RewardRate } from "@/lib/reward-campaigns";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { PAYOUT_CHAINS, rewardCampaignsAbi } from "@seer-pm/rewards/claims";
import { type SupportedChain, orderBookGraphQLClient } from "@seer-pm/sdk";
import { getSdk as getLimitOrderSdk } from "@seer-pm/sdk/subgraph/limit-order-hook";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccount, readContract, writeContract } from "@wagmi/core";
import { type Address, type Hex, type TransactionReceipt, encodeFunctionData, erc20Abi, isAddressEqual } from "viem";

const REWARD_CAMPAIGNS_QUERY_KEY = "rewardCampaigns";

type ConfigChainId = (typeof config)["chains"][number]["id"];

/** Payout chains whose campaign registry is deployed. */
export const REGISTRY_CHAINS = Object.entries(PAYOUT_CHAINS).flatMap(([chainId, { registry }]) =>
  registry ? [{ chainId: Number(chainId), address: registry.address }] : [],
);

const registryAddress = (chainId: number) => {
  const registry = PAYOUT_CHAINS[chainId]?.registry;
  if (!registry) throw new Error(`No campaign registry on chain ${chainId}`);
  return registry.address;
};

export type RewardCampaign = {
  id: bigint;
  /** The chain of the pool, whose registry holds the campaign and whose distributor pays it. */
  payoutChainId: number;
  poolId: Hex;
  rewardToken: Address;
  /** The wallet that deposited the budget: it changes the campaign and gets its refund. */
  funder: Address;
  /** The registry's owner, which may change any campaign of it. */
  registryOwner: Address;
  /** The deposit, minus what was refunded. */
  budget: bigint;
  /** Sent to the distributor so far: what the campaign emitted up to `releasedUpTo`. */
  released: bigint;
  /** Weekly cutoff (unix seconds) of the last release, 0 before the first. */
  releasedUpTo: number;
  minWidthTicks: number;
  rates: RewardRate[];
  /** Undefined when the token cannot be read on the payout chain. */
  token?: { symbol: string; decimals: number };
  /** The outcome token the pool trades. Undefined until the pool is initialized and indexed. */
  outcome?: { name: string; marketId: Address; marketName: string };
};

/**
 * Outcome and market of each pool in `poolIds` that the indexer has seen initialized, from its two currencies:
 * the one that is a market's outcome token. A pool id is a hash of its key, so a pool not created yet stays
 * unnamed rather than being searched for among every market of the chain.
 */
async function fetchPoolOutcomes(chainId: number, poolIds: Hex[]) {
  const outcomes = new Map<string, NonNullable<RewardCampaign["outcome"]>>();
  const client = orderBookGraphQLClient(chainId);
  if (!client || poolIds.length === 0) return outcomes;
  const sdk = getLimitOrderSdk(client);
  const { LimitOrderPool: pools } = await sdk.GetLimitOrderPoolsById({
    chainId: String(chainId),
    poolIds: poolIds.map((id) => id.toLowerCase()),
  });
  if (pools.length === 0) return outcomes;
  const { OutcomeTokenMarket: tokens } = await sdk.GetOutcomeTokenMarkets({
    chainId: String(chainId),
    tokens: pools.flatMap((p) => [p.currency0.toLowerCase(), p.currency1.toLowerCase()]),
  });
  const marketByToken = new Map(tokens.map((t) => [t.token.toLowerCase(), t.market]));
  for (const pool of pools) {
    const token = [pool.currency0, pool.currency1].map((c) => c.toLowerCase()).find((c) => marketByToken.get(c));
    const market = token && marketByToken.get(token);
    if (!market) continue;
    const index = market.wrappedTokens.findIndex((w) => w.toLowerCase() === token);
    outcomes.set(pool.poolId.toLowerCase(), {
      name: market.outcomes[index] ?? token,
      // The indexer keys markets as `<chainId>:<address>`.
      marketId: market.id.split(":").pop() as Address,
      marketName: market.marketName,
    });
  }
  return outcomes;
}

/** Reads `symbol` and `decimals` of `token` on `chainId`, or undefined when it is not an ERC20 there. */
export async function readTokenMeta(token: Address, chainId: number) {
  try {
    const read = <T>(functionName: "symbol" | "decimals") =>
      readContract(config, {
        address: token,
        abi: erc20Abi,
        functionName,
        chainId: chainId as ConfigChainId,
      }) as Promise<T>;
    const [symbol, decimals] = await Promise.all([read<string>("symbol"), read<number>("decimals")]);
    return { symbol, decimals };
  } catch {
    return undefined;
  }
}

async function fetchChainCampaigns(payoutChainId: number, address: Address): Promise<RewardCampaign[]> {
  const read = <T>(functionName: "getCampaigns" | "getReleases" | "getFunders" | "owner") =>
    readContract(config, {
      address,
      abi: rewardCampaignsAbi,
      functionName,
      chainId: payoutChainId as ConfigChainId,
    }) as Promise<T>;
  const [campaigns, releases, funders, registryOwner] = await Promise.all([
    read<
      readonly {
        poolId: Hex;
        rewardToken: Address;
        budget: bigint;
        minWidthTicks: number;
        rates: readonly RewardRate[];
      }[]
    >("getCampaigns"),
    read<readonly { released: bigint; upTo: bigint }[]>("getReleases"),
    read<readonly Address[]>("getFunders"),
    read<Address>("owner"),
  ]);
  // The names are a convenience: a failed lookup leaves the pool id, never the campaigns, unreadable.
  const poolOutcomes = fetchPoolOutcomes(
    payoutChainId,
    campaigns.map((c) => c.poolId),
  ).catch(() => new Map<string, NonNullable<RewardCampaign["outcome"]>>());
  const tokens = new Map<string, Promise<RewardCampaign["token"]>>();
  for (const c of campaigns) {
    const key = c.rewardToken.toLowerCase();
    if (!tokens.has(key)) tokens.set(key, readTokenMeta(c.rewardToken, payoutChainId));
  }
  return Promise.all(
    campaigns.map(async (c, i) => ({
      id: BigInt(i),
      payoutChainId,
      poolId: c.poolId,
      rewardToken: c.rewardToken,
      funder: funders[i],
      registryOwner,
      budget: c.budget,
      released: releases[i].released,
      releasedUpTo: Number(releases[i].upTo),
      minWidthTicks: c.minWidthTicks,
      rates: c.rates.map((rate) => ({ from: rate.from, perSecond: rate.perSecond })),
      token: await tokens.get(c.rewardToken.toLowerCase()),
      outcome: (await poolOutcomes).get(c.poolId.toLowerCase()),
    })),
  );
}

/** Every campaign of every deployed registry, newest first within each payout chain. */
export function useRewardCampaigns(enabled: boolean) {
  return useQuery({
    queryKey: [REWARD_CAMPAIGNS_QUERY_KEY, "list"],
    enabled: enabled && REGISTRY_CHAINS.length > 0,
    queryFn: async (): Promise<RewardCampaign[]> => {
      const chains = await Promise.all(REGISTRY_CHAINS.map((r) => fetchChainCampaigns(r.chainId, r.address)));
      return chains.flatMap((campaigns) => campaigns.reverse());
    },
  });
}

/** Payout chains where `account` may create campaigns: it owns the registry or is one of its managers. */
export function useRewardCampaignManagerChains(account: Address | undefined) {
  return useQuery({
    queryKey: [REWARD_CAMPAIGNS_QUERY_KEY, "manager", account?.toLowerCase()],
    enabled: Boolean(account) && REGISTRY_CHAINS.length > 0,
    queryFn: async () => {
      const chains = await Promise.all(
        REGISTRY_CHAINS.map(async ({ chainId, address }) => {
          const common = { address, abi: rewardCampaignsAbi, chainId: chainId as ConfigChainId } as const;
          const [owner, isManager] = await Promise.all([
            readContract(config, { ...common, functionName: "owner" }),
            readContract(config, { ...common, functionName: "isManager", args: [account!] }),
          ]);
          return isManager || isAddressEqual(owner, account!) ? [chainId] : [];
        }),
      );
      return chains.flat();
    },
  });
}

export type RewardCampaignWrite =
  | {
      functionName: "createCampaign";
      args: readonly [Hex, Address, bigint, bigint, number];
    }
  | { functionName: "setRate"; args: readonly [bigint, bigint] }
  | { functionName: "settleRefund"; args: readonly [bigint] };

const TOAST_TITLES: Record<RewardCampaignWrite["functionName"], [string, string]> = {
  createCampaign: ["Creating campaign...", "Campaign created!"],
  setRate: ["Updating rate...", "Rate updated!"],
  settleRefund: ["Refunding...", "Refund sent to the funder!"],
};

/**
 * Sends registry transactions from the connected wallet on `payoutChainId`, one per entry of `writes`. A deposit
 * (`createCampaign`) first approves the registry for `deposit.amount`, the sum of every budget, when the allowance
 * is short. With EIP-7702 the approval and every write go in one batch, so several campaigns take one signature.
 */
export function useWriteRewardCampaigns(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const supports7702 = useCheck7702Support();
  return useMutation({
    mutationFn: async ({
      payoutChainId,
      writes,
      deposit,
    }: {
      payoutChainId: number;
      writes: RewardCampaignWrite[];
      deposit?: { token: Address; symbol: string; amount: bigint };
    }) => {
      const address = registryAddress(payoutChainId);
      const chainId = payoutChainId as ConfigChainId;
      const [sent, success] = TOAST_TITLES[writes[0].functionName];

      if (supports7702 && writes.length > 1) {
        const approve = deposit
          ? [
              {
                to: deposit.token,
                value: 0n,
                chainId,
                data: encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [address, deposit.amount] }),
              },
            ]
          : [];
        const calls = writes.map((write) => ({
          to: address,
          value: 0n,
          chainId,
          data: encodeFunctionData({ abi: rewardCampaignsAbi, ...write } as Parameters<typeof encodeFunctionData>[0]),
        }));
        const result = await toastifySendCallsTx([...approve, ...calls], payoutChainId as SupportedChain, config, {
          txSent: { title: sent.replace("campaign", `${writes.length} campaigns`) },
          txSuccess: { title: success.replace("Campaign", `${writes.length} campaigns`) },
        });
        if (!result.status) throw result.error;
        return result.receipt;
      }

      if (deposit) {
        const account = getAccount(config).address;
        if (!account) throw new Error("Connect a wallet first");
        const allowance = await readContract(config, {
          address: deposit.token,
          abi: erc20Abi,
          functionName: "allowance",
          args: [account, address],
          chainId,
        });
        if (allowance < deposit.amount) {
          const approved = await toastifyTx(
            () =>
              writeContract(config, {
                address: deposit.token,
                abi: erc20Abi,
                functionName: "approve",
                args: [address, deposit.amount],
                chainId,
              }),
            {
              txSent: { title: `Approving ${deposit.symbol}...` },
              txSuccess: { title: `${deposit.symbol} approved!` },
            },
          );
          if (!approved.status) throw approved.error;
        }
      }
      let receipt: TransactionReceipt | undefined;
      for (const [i, write] of writes.entries()) {
        const step = writes.length > 1 ? ` ${i + 1}/${writes.length}` : "";
        const result = await toastifyTx(
          () =>
            writeContract(config, {
              address,
              abi: rewardCampaignsAbi,
              chainId,
              ...write,
            } as Parameters<typeof writeContract>[1]),
          { txSent: { title: `${sent.replace("...", "")}${step}...` }, txSuccess: { title: success } },
        );
        if (!result.status) throw result.error;
        receipt = result.receipt;
      }
      return receipt;
    },
    onSuccess: () => onSuccess?.(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [REWARD_CAMPAIGNS_QUERY_KEY] }),
  });
}

/** Balance of `token` the connected `account` holds on `chainId`, to check a deposit before sending it. */
export function useTokenBalance(token: Address | undefined, account: Address | undefined, chainId: number) {
  return useQuery({
    queryKey: [REWARD_CAMPAIGNS_QUERY_KEY, "balance", chainId, token?.toLowerCase(), account?.toLowerCase()],
    enabled: Boolean(token && account),
    queryFn: () =>
      readContract(config, {
        address: token!,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account!],
        chainId: chainId as ConfigChainId,
      }),
  });
}
