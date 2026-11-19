import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import {
  type RewardCampaign,
  readTokenMeta,
  useTokenBalance,
  useWriteRewardCampaigns,
} from "@/hooks/admin/useRewardCampaigns";
import { WEEK_SECONDS, campaignStatus, chainName, formatWeekly, perSecondFromWeekly } from "@/lib/reward-campaigns";
import { shortenAddress } from "@/lib/utils";
import { V4_TICK_SPACING, getOrderBookPoolParams, getV4PoolId, marketSupportsOrderBook } from "@seer-pm/order-book";
import { useMarket } from "@seer-pm/react";
import { PAYOUT_CHAINS } from "@seer-pm/rewards/claims";
import type { SupportedChain } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type Address, type Hex, formatUnits, isAddress, maxUint128, parseUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";

/** `MAX_WIDTH_TICKS` of the registry: the full Uniswap V4 tick range, which no position exceeds. */
const MAX_WIDTH_TICKS = 1_774_544;

/** A decimal token amount in base units, or undefined when it is not a plain non-negative number. */
const parseAmount = (value: string, decimals: number) =>
  /^\d+(\.\d+)?$/.test(value.trim()) ? parseUnits(value.trim(), decimals) : undefined;

const formatAmount = (amount: bigint, token: { symbol: string; decimals: number }) =>
  `${Number(formatUnits(amount, token.decimals)).toLocaleString("en-US", { maximumFractionDigits: 4 })} ${token.symbol}`;

function useTokenMeta(token: string, chainId: number) {
  return useQuery({
    queryKey: ["rewardToken", chainId, token.toLowerCase()],
    enabled: isAddress(token),
    queryFn: async () => (await readTokenMeta(token as Address, chainId)) ?? null,
  });
}

/** An error when the connected wallet holds less than `amount` of `token`, which the deposit would revert on. */
function useBalanceError(
  token: { address: Address; symbol: string; decimals: number } | undefined,
  amount: bigint | undefined,
  chainId: number,
) {
  const { address: account } = useAccount();
  const { data: balance } = useTokenBalance(token?.address, account, chainId);
  if (!token || amount === undefined || balance === undefined || balance >= amount) return undefined;
  return `Your wallet holds ${formatAmount(balance, token)} on ${chainName(chainId)}.`;
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: { id: string; label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold mb-1 block">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-[12px] text-error-primary mt-1">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-[12px] text-base-content/70 mt-1">{hint}</p>}
    </div>
  );
}

function SubmitRow({
  chainId,
  onClose,
  isPending,
  text,
  onSubmit,
}: { chainId: number; onClose: () => void; isPending: boolean; text: string; onSubmit: () => void }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button text="Cancel" type="button" variant="secondary" onClick={onClose} disabled={isPending} />
      <div>
        <SwitchChainButtonWrapper chainId={chainId as SupportedChain}>
          <Button text={text} type="button" isLoading={isPending} onClick={onSubmit} />
        </SwitchChainButtonWrapper>
      </div>
    </div>
  );
}

/**
 * Creates one campaign per selected outcome pool of a market on one of `managerChains`, each with the same rate and
 * budget, depositing every budget from the connected wallet. Rewards pay out on the pool's chain, so its registry
 * is the one on that chain.
 */
export function CreateRewardCampaignForm({ managerChains, onClose }: { managerChains: number[]; onClose: () => void }) {
  const [outcomes, setOutcomes] = useState<number[]>([0]);
  const [form, setForm] = useState({
    chainId: String(managerChains[0]),
    market: "",
    rewardToken: "",
    weekly: "",
    budget: "",
    minWidthTicks: "0",
  });
  const [submitted, setSubmitted] = useState(false);
  const write = useWriteRewardCampaigns(onClose);
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const chainId = Number(form.chainId);
  const marketId = isAddress(form.market.trim()) ? (form.market.trim() as Address) : zeroAddress;
  const { data: market, isLoading: isMarketLoading } = useMarket(marketId, chainId as SupportedChain);
  const rewardToken = form.rewardToken.trim();
  const token = useTokenMeta(rewardToken, chainId);

  const errors: Partial<Record<keyof typeof form | "outcomes", string>> = {};
  let poolIds: Hex[] | undefined;
  if (marketId === zeroAddress) errors.market = "Enter the market address.";
  else if (!isMarketLoading && !market) errors.market = `No market at this address on ${chainName(chainId)}.`;
  else if (market && !marketSupportsOrderBook(market)) errors.market = "This market has no V4 order book pools.";
  // The selection resets with the market and chain, but the market query may still hold the previous one.
  else if (market && outcomes.every((i) => i < market.wrappedTokens.length)) {
    poolIds = outcomes.map((i) => getV4PoolId(getOrderBookPoolParams(market, i).poolKey));
    if (poolIds.length === 0) errors.outcomes = "Select at least one outcome pool.";
  }
  const pools = poolIds?.length ?? 0;
  const toggleOutcome = (i: number, checked: boolean) =>
    setOutcomes((prev) => (checked ? [...prev, i].sort((a, b) => a - b) : prev.filter((o) => o !== i)));
  const selectMarket = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setOutcomes([0]);
  };

  if (!isAddress(rewardToken)) errors.rewardToken = "Enter the token address.";
  else if (token.data === null) errors.rewardToken = `Not an ERC20 token on ${chainName(chainId)}.`;
  const decimals = token.data?.decimals;

  const weekly = decimals === undefined ? undefined : parseAmount(form.weekly, decimals);
  const perSecond = weekly === undefined ? undefined : perSecondFromWeekly(weekly);
  if (decimals !== undefined && weekly === undefined) errors.weekly = "Enter an amount.";
  else if (perSecond === 0n) errors.weekly = "Too small: it rounds to 0 per second.";

  const budget = decimals === undefined ? undefined : parseAmount(form.budget, decimals);
  if (decimals !== undefined && !budget) errors.budget = "Enter the amount to deposit.";
  // The registry caps a budget at 128 bits, so a larger one would revert after the approval.
  else if (budget !== undefined && budget > maxUint128) errors.budget = "Too large for the campaign registry.";
  // Every selected pool gets its own campaign with this budget, so the deposit is the budget times the pools.
  const deposit = budget === undefined ? undefined : budget * BigInt(Math.max(pools, 1));
  const balanceError = useBalanceError(
    token.data ? { address: rewardToken as Address, ...token.data } : undefined,
    deposit,
    chainId,
  );
  if (balanceError && !errors.budget) errors.budget = balanceError;

  const minWidthTicks = Number(form.minWidthTicks);
  if (!Number.isInteger(minWidthTicks) || minWidthTicks < 0 || minWidthTicks > MAX_WIDTH_TICKS) {
    errors.minWidthTicks = "A whole number of ticks, 0 for any width.";
  }

  const isValid =
    Object.keys(errors).length === 0 &&
    pools > 0 &&
    perSecond !== undefined &&
    budget !== undefined &&
    deposit !== undefined;
  const visible = (field: keyof typeof form) => (submitted || form[field] ? errors[field] : undefined);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!isValid || !token.data) return;
    write.mutate({
      payoutChainId: chainId,
      writes: poolIds!.map((poolId) => ({
        functionName: "createCampaign" as const,
        args: [poolId, rewardToken as Address, perSecond!, budget!, minWidthTicks] as const,
      })),
      deposit: { token: rewardToken as Address, symbol: token.data.symbol, amount: deposit! },
    });
  };

  const weeks = isValid ? Number(budget!) / Number(perSecond! * BigInt(WEEK_SECONDS)) : undefined;

  return (
    <div className="space-y-4">
      <Field
        id="reward-chain"
        label="Chain"
        hint="The pool's chain. Rewards pay out here, and its registry holds the deposit."
      >
        <Select
          id="reward-chain"
          className="w-full"
          options={managerChains.map((id) => ({ value: String(id), text: chainName(id) }))}
          value={form.chainId}
          onChange={(e) => selectMarket({ chainId: e.target.value })}
        />
      </Field>

      <Field
        id="reward-market"
        label="Market"
        error={visible("market")}
        hint={market ? market.marketName : "Address of the market whose outcome pool earns the rewards."}
      >
        <Input
          id="reward-market"
          className="w-full"
          placeholder="0x…"
          value={form.market}
          onChange={(e) => selectMarket({ market: e.target.value })}
        />
      </Field>

      {market && poolIds && (
        <fieldset>
          <legend className="text-sm font-semibold mb-1">Outcome pools</legend>
          {/* About five outcomes tall: markets with many outcomes scroll instead of pushing the form off screen. */}
          <div className="space-y-1 max-h-[7.5rem] overflow-y-auto pr-2">
            {market.wrappedTokens.map((_, i) => (
              <label
                key={market.outcomes[i]}
                htmlFor={`reward-outcome-${i}`}
                className="cursor-pointer flex items-center gap-2 text-sm"
              >
                <input
                  id={`reward-outcome-${i}`}
                  type="checkbox"
                  className="cursor-pointer checkbox checkbox-sm"
                  checked={outcomes.includes(i)}
                  onChange={(e) => toggleOutcome(i, e.target.checked)}
                />
                {market.outcomes[i]}
              </label>
            ))}
          </div>
          {errors.outcomes ? (
            <p className="text-[12px] text-error-primary mt-1">{errors.outcomes}</p>
          ) : (
            <p className="text-[12px] text-base-content/70 mt-1">
              Each selected pool gets its own campaign with the rate and budget below.
            </p>
          )}
        </fieldset>
      )}

      <Field
        id="reward-token"
        label="Reward token"
        error={visible("rewardToken")}
        hint={token.data ? `${token.data.symbol}, ${token.data.decimals} decimals` : `Token on ${chainName(chainId)}.`}
      >
        <Input
          id="reward-token"
          className="w-full"
          placeholder="0x…"
          value={form.rewardToken}
          onChange={set("rewardToken")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="reward-weekly"
          label={`Per week, each pool${token.data ? ` (${token.data.symbol})` : ""}`}
          error={visible("weekly")}
          hint="In token units, split among in-range positions by liquidity. Stored per second, rounded down. The rate can change later, and 0 ends the campaign."
        >
          <Input
            id="reward-weekly"
            className="w-full"
            inputMode="decimal"
            value={form.weekly}
            onChange={set("weekly")}
          />
        </Field>
        <Field
          id="reward-budget"
          label={`Budget, each pool${token.data ? ` (${token.data.symbol})` : ""}`}
          error={visible("budget")}
          hint="Deposited from your wallet now. It caps the total payout and lasts (budget ÷ per week) weeks, longer while no eligible liquidity is in range. It cannot be topped up later."
        >
          <Input
            id="reward-budget"
            className="w-full"
            inputMode="decimal"
            value={form.budget}
            onChange={set("budget")}
          />
        </Field>
      </div>

      <Field
        id="reward-min-width"
        label="Minimum range width (ticks)"
        error={visible("minWidthTicks")}
        hint={`Positions whose tickUpper - tickLower is below this neither earn nor dilute. 0 accepts any range. Pools use a tick spacing of ${V4_TICK_SPACING}, so use a multiple of it: 600 ticks is about a 6% price range. It cannot change later.`}
      >
        <Input
          id="reward-min-width"
          className="w-full"
          type="number"
          min={0}
          step={1}
          value={form.minWidthTicks}
          onChange={set("minWidthTicks")}
        />
      </Field>

      {!PAYOUT_CHAINS[chainId]?.distributor && (
        <Alert type="warning">
          {chainName(chainId)} has no rewards distributor yet. The campaign accrues from its start, and claims open once
          a distributor is deployed there.
        </Alert>
      )}
      {weeks !== undefined && (
        <p className="text-sm">
          Each budget lasts about <strong>{weeks.toLocaleString("en-US", { maximumFractionDigits: 1 })} weeks</strong>{" "}
          of rewards at this rate. Liquidity out of range consumes none of it.
          {pools > 1 && token.data && (
            <>
              {" "}
              You deposit <strong>{formatAmount(deposit!, token.data)}</strong> in total for {pools} campaigns.
            </>
          )}
        </p>
      )}
      <p className="text-[12px] text-base-content/70">
        Creating it approves and deposits the budget, and the campaign starts paying when the transaction is mined. The
        pool, token, budget and minimum width cannot change once created: to add rewards later, create another campaign
        on the same pool.
      </p>

      <SubmitRow
        chainId={chainId}
        onClose={onClose}
        isPending={write.isPending}
        text={pools > 1 ? `Create ${pools} campaigns and deposit` : "Create and deposit"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/** Sets a new weekly rate (`mode` "rate") or ends the campaign for good, from the moment the transaction is mined. */
export function RewardRatesForm({
  campaign,
  mode,
  onClose,
}: { campaign: RewardCampaign; mode: "rate" | "end"; onClose: () => void }) {
  const status = campaignStatus(campaign.rates);
  const [weeklyInput, setWeeklyInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const write = useWriteRewardCampaigns(onClose);
  const token = campaign.token;

  if (!token) {
    return <Alert type="error">The reward token cannot be read on {chainName(campaign.payoutChainId)}.</Alert>;
  }

  const weekly = parseAmount(weeklyInput, token.decimals);
  const perSecond = mode === "end" ? 0n : weekly === undefined ? undefined : perSecondFromWeekly(weekly);
  let error: string | undefined;
  if (mode === "rate" && weekly === undefined) error = "Enter an amount.";
  else if (mode === "rate" && perSecond === 0n) error = "Too small: it rounds to 0 per second. Use End instead.";

  const handleSubmit = () => {
    setSubmitted(true);
    if (error || perSecond === undefined) return;
    write.mutate({
      payoutChainId: campaign.payoutChainId,
      writes: [{ functionName: "setRate", args: [campaign.id, perSecond] }],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Now: <strong>{formatWeekly(status.current, token)}</strong> ·{" "}
        {formatAmount(campaign.budget - campaign.released, token)} left in escrow
      </p>
      {mode === "rate" ? (
        <Field
          id="reward-rate-weekly"
          label={`New rate per week (${token.symbol})`}
          error={submitted || weeklyInput ? error : undefined}
          hint="Applies from the moment the transaction is mined. What was earned until then is kept."
        >
          <Input
            id="reward-rate-weekly"
            className="w-full"
            inputMode="decimal"
            value={weeklyInput}
            onChange={(e) => setWeeklyInput(e.target.value)}
          />
        </Field>
      ) : (
        <p className="text-sm">
          Closing stops rewards at the block where this transaction is mined. Any budget above the maximum the campaign
          could have emitted goes straight back to {shortenAddress(campaign.funder)}. LPs keep what they earned through
          closure. Any remaining surplus is returned after the distributor accepts the final total.
        </p>
      )}
      <SubmitRow
        chainId={campaign.payoutChainId}
        onClose={onClose}
        isPending={write.isPending}
        text={mode === "end" ? "End campaign" : "Change rate"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
