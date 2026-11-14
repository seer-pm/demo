import type { RewardRate } from "@/lib/reward-campaigns";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { PAYOUT_CHAINS, rewardCampaignsAbi } from "@seer-pm/rewards/claims";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccount, readContract, writeContract } from "@wagmi/core";
import { type Address, type Hex, erc20Abi, isAddressEqual } from "viem";

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
};

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
    })),
  );
}

/** Every campaign of every deployed registry, newest first within each payout chain. */
export function useRewardCampaigns() {
  return useQuery({
    queryKey: [REWARD_CAMPAIGNS_QUERY_KEY, "list"],
    enabled: REGISTRY_CHAINS.length > 0,
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
 * Sends one registry transaction from the connected wallet on `payoutChainId`. A deposit (`createCampaign`) first
 * approves the registry for `deposit.amount` of `deposit.token` when the allowance is short.
 */
export function useWriteRewardCampaigns(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      payoutChainId,
      write,
      deposit,
    }: {
      payoutChainId: number;
      write: RewardCampaignWrite;
      deposit?: { token: Address; symbol: string; amount: bigint };
    }) => {
      const address = registryAddress(payoutChainId);
      const chainId = payoutChainId as ConfigChainId;
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
      const [sent, success] = TOAST_TITLES[write.functionName];
      const result = await toastifyTx(
        () =>
          writeContract(config, {
            address,
            abi: rewardCampaignsAbi,
            chainId,
            ...write,
          } as Parameters<typeof writeContract>[1]),
        { txSent: { title: sent }, txSuccess: { title: success } },
      );
      if (!result.status) throw result.error;
      return result.receipt;
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
