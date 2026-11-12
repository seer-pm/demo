import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";
import { SwitchChainButtonWrapper } from "@/components/Form/SwitchChainButtonWrapper";
import {
  type RewardCampaign,
  readTokenMeta,
  useCampaignDeposits,
  useTokenBalance,
  useWriteRewardCampaigns,
} from "@/hooks/admin/useRewardCampaigns";
import {
  WEEK_SECONDS,
  campaignStatus,
  chainName,
  formatWeekly,
  perSecondFromWeekly,
  refundShares,
  refundState,
  toDate,
} from "@/lib/reward-campaigns";
import { shortenAddress } from "@/lib/utils";
import { getOrderBookPoolParams, getV4PoolId, marketSupportsOrderBook } from "@seer-pm/order-book";
import { useMarket } from "@seer-pm/react";
import { PAYOUT_CHAINS } from "@seer-pm/rewards/claims";
import type { SupportedChain } from "@seer-pm/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type Address, type Hex, formatUnits, isAddress, isAddressEqual, parseUnits, zeroAddress } from "viem";
import { useAccount } from "wagmi";

const MAX_UINT32 = 2 ** 32 - 1;

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
 * Creates a campaign for a pool on one of `managerChains`, depositing its whole budget from the connected wallet.
 * Rewards pay out on the pool's chain, so its registry is the one on that chain.
 */
export function CreateRewardCampaignForm({ managerChains, onClose }: { managerChains: number[]; onClose: () => void }) {
  const [form, setForm] = useState({
    chainId: String(managerChains[0]),
    market: "",
    outcome: "0",
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

  const errors: Partial<Record<keyof typeof form, string>> = {};
  let poolId: Hex | undefined;
  if (marketId === zeroAddress) errors.market = "Enter the market address.";
  else if (!isMarketLoading && !market) errors.market = `No market at this address on ${chainName(chainId)}.`;
  else if (market && !marketSupportsOrderBook(market)) errors.market = "This market has no V4 order book pools.";
  // The outcome resets with the market and chain, but the market query may still hold the previous one.
  else if (market && Number(form.outcome) < market.wrappedTokens.length) {
    poolId = getV4PoolId(getOrderBookPoolParams(market, Number(form.outcome)).poolKey);
  }

  if (!isAddress(rewardToken)) errors.rewardToken = "Enter the token address.";
  else if (token.data === null) errors.rewardToken = `Not an ERC20 token on ${chainName(chainId)}.`;
  const decimals = token.data?.decimals;

  const weekly = decimals === undefined ? undefined : parseAmount(form.weekly, decimals);
  const perSecond = weekly === undefined ? undefined : perSecondFromWeekly(weekly);
  if (decimals !== undefined && weekly === undefined) errors.weekly = "Enter an amount.";
  else if (perSecond === 0n) errors.weekly = "Too small: it rounds to 0 per second.";

  const budget = decimals === undefined ? undefined : parseAmount(form.budget, decimals);
  if (decimals !== undefined && !budget) errors.budget = "Enter the amount to deposit.";
  const balanceError = useBalanceError(
    token.data ? { address: rewardToken as Address, ...token.data } : undefined,
    budget,
    chainId,
  );
  if (balanceError && !errors.budget) errors.budget = balanceError;

  const minWidthTicks = Number(form.minWidthTicks);
  if (!Number.isInteger(minWidthTicks) || minWidthTicks < 0 || minWidthTicks > MAX_UINT32) {
    errors.minWidthTicks = "A whole number of ticks, 0 for any width.";
  }

  const isValid =
    Object.keys(errors).length === 0 && poolId !== undefined && perSecond !== undefined && budget !== undefined;
  const visible = (field: keyof typeof form) => (submitted || form[field] ? errors[field] : undefined);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!isValid || !token.data) return;
    write.mutate({
      payoutChainId: chainId,
      write: {
        functionName: "createCampaign",
        args: [poolId!, rewardToken as Address, perSecond!, budget!, minWidthTicks, []],
      },
      deposit: { token: rewardToken as Address, symbol: token.data.symbol, amount: budget! },
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
          onChange={(e) => setForm((prev) => ({ ...prev, chainId: e.target.value, outcome: "0" }))}
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
          onChange={(e) => setForm((prev) => ({ ...prev, market: e.target.value, outcome: "0" }))}
        />
      </Field>

      {market && poolId && (
        <Field id="reward-outcome" label="Outcome pool" hint={<span className="break-all">Pool id {poolId}</span>}>
          <Select
            id="reward-outcome"
            className="w-full"
            options={market.wrappedTokens.map((_, i) => ({ value: String(i), text: market.outcomes[i] }))}
            value={form.outcome}
            onChange={set("outcome")}
          />
        </Field>
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
          label={`Per week${token.data ? ` (${token.data.symbol})` : ""}`}
          error={visible("weekly")}
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
          label={`Budget${token.data ? ` (${token.data.symbol})` : ""}`}
          error={visible("budget")}
          hint="Deposited from your wallet now."
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
        hint="Narrower positions neither earn nor dilute. 0 accepts any range."
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
          The budget lasts about <strong>{weeks.toLocaleString("en-US", { maximumFractionDigits: 1 })} weeks</strong> of
          rewards at this rate. Liquidity out of range consumes none of it.
        </p>
      )}
      <p className="text-[12px] text-base-content/70">
        Creating it approves and deposits the budget, and the campaign starts paying when the transaction is mined. The
        pool and token cannot change once created.
      </p>

      <SubmitRow
        chainId={chainId}
        onClose={onClose}
        isPending={write.isPending}
        text="Create and deposit"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/** Sets a new weekly rate (`mode` "rate") or ends the campaign, from the moment the transaction is mined. */
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
      write: { functionName: "setRate", args: [campaign.id, perSecond] },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Now: <strong>{status.ended ? `ended ${toDate(status.end!)}` : formatWeekly(status.current, token)}</strong> ·{" "}
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
          The campaign stops paying when the transaction is mined. What was earned until then is kept. Once the bot
          releases that week (after the next Monday 00:00 UTC), the rest of the budget can be refunded to the wallets
          that deposited it.
        </p>
      )}
      <SubmitRow
        chainId={campaign.payoutChainId}
        onClose={onClose}
        isPending={write.isPending}
        text={mode === "end" ? "End campaign" : status.ended ? "Restart" : "Change rate"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/** Deposits more of the reward token from the connected wallet and adds it to the budget. */
export function RewardFundsForm({ campaign, onClose }: { campaign: RewardCampaign; onClose: () => void }) {
  const [amountInput, setAmountInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const write = useWriteRewardCampaigns(onClose);
  const token = campaign.token;
  const amount = token ? parseAmount(amountInput, token.decimals) : undefined;
  const balanceError = useBalanceError(
    token ? { address: campaign.rewardToken, ...token } : undefined,
    amount,
    campaign.payoutChainId,
  );

  if (!token) {
    return <Alert type="error">The reward token cannot be read on {chainName(campaign.payoutChainId)}.</Alert>;
  }
  const error = !amount ? "Enter an amount." : balanceError;

  const handleSubmit = () => {
    setSubmitted(true);
    if (error) return;
    write.mutate({
      payoutChainId: campaign.payoutChainId,
      write: { functionName: "increaseBudget", args: [campaign.id, amount!] },
      deposit: { token: campaign.rewardToken, symbol: token.symbol, amount: amount! },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Budget <strong>{formatAmount(campaign.budget, token)}</strong>, of which{" "}
        {formatAmount(campaign.released, token)} was released to the distributor.
      </p>
      <Field
        id="reward-funds-amount"
        label={`Amount to add (${token.symbol})`}
        error={submitted || amountInput ? error : undefined}
        hint="Deposited from your wallet now."
      >
        <Input
          id="reward-funds-amount"
          className="w-full"
          inputMode="decimal"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
        />
      </Field>
      <SubmitRow
        chainId={campaign.payoutChainId}
        onClose={onClose}
        isPending={write.isPending}
        text="Add funds"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/**
 * Credits what an ended campaign did not emit to the wallets that deposited it. Each of them then withdraws its
 * own credit, so a wallet the token refuses to pay holds back nobody else.
 */
export function RewardRefundForm({ campaign, onClose }: { campaign: RewardCampaign; onClose: () => void }) {
  const { address } = useAccount();
  const write = useWriteRewardCampaigns(onClose);
  const { data: deposits, isLoading } = useCampaignDeposits(campaign);
  const state = refundState(campaign);
  const token = campaign.token;
  const show = (amount: bigint) => (token ? formatAmount(amount, token) : amount.toString());
  if (state.kind !== "ready") {
    return <Alert type="info">Nothing to refund yet.</Alert>;
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Credits <strong>{show(state.amount)}</strong>, what the campaign did not emit, to the wallets that deposited it,
        in proportion to their deposits:
      </p>
      {isLoading ? (
        <div className="shimmer-container h-10 rounded" />
      ) : (
        <ul className="text-sm space-y-1">
          {refundShares(state.amount, deposits ?? []).map((d) => (
            <li key={d.depositor} className="flex justify-between gap-4">
              <span>
                {shortenAddress(d.depositor)}
                {address && isAddressEqual(d.depositor, address) && " (you)"}
              </span>
              <span>
                {show(d.share)} <span className="text-base-content/60">of {show(d.amount)} deposited</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[12px] text-base-content/70">
        No funds move yet: each wallet then withdraws its own credit from this page. Any wallet can settle it, since the
        credits only go to the depositors. The budget then equals what was released, so restarting the campaign needs
        new funds.
      </p>
      <SubmitRow
        chainId={campaign.payoutChainId}
        onClose={onClose}
        isPending={write.isPending}
        text="Settle refund"
        onSubmit={() =>
          write.mutate({
            payoutChainId: campaign.payoutChainId,
            write: { functionName: "settleRefund", args: [campaign.id] },
          })
        }
      />
    </div>
  );
}

/** Minimum range width and excluded positions, which apply to the whole week in progress. */
export function RewardSettingsForm({ campaign, onClose }: { campaign: RewardCampaign; onClose: () => void }) {
  const [form, setForm] = useState({
    minWidthTicks: String(campaign.minWidthTicks),
    excluded: campaign.excludedTokenIds.join(", "),
  });
  const [submitted, setSubmitted] = useState(false);
  const write = useWriteRewardCampaigns(onClose);

  const errors: Partial<Record<keyof typeof form, string>> = {};
  const minWidthTicks = Number(form.minWidthTicks);
  if (!Number.isInteger(minWidthTicks) || minWidthTicks < 0 || minWidthTicks > MAX_UINT32) {
    errors.minWidthTicks = "A whole number of ticks, 0 for any width.";
  }
  const excludedParts = form.excluded.split(/[\s,]+/).filter(Boolean);
  if (excludedParts.some((part) => !/^\d+$/.test(part))) errors.excluded = "Position ids separated by commas.";

  const handleSubmit = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    write.mutate({
      payoutChainId: campaign.payoutChainId,
      write: { functionName: "updateSettings", args: [campaign.id, minWidthTicks, excludedParts.map(BigInt)] },
    });
  };
  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const visible = (field: keyof typeof form) => (submitted || form[field] ? errors[field] : undefined);

  return (
    <div className="space-y-4">
      <Field id="reward-settings-min-width" label="Minimum range width (ticks)" error={visible("minWidthTicks")}>
        <Input
          id="reward-settings-min-width"
          className="w-full"
          type="number"
          min={0}
          step={1}
          value={form.minWidthTicks}
          onChange={set("minWidthTicks")}
        />
      </Field>
      <Field
        id="reward-settings-excluded"
        label="Excluded positions"
        error={visible("excluded")}
        hint="PositionManager token ids that neither earn nor dilute, such as the team's own liquidity."
      >
        <Input id="reward-settings-excluded" className="w-full" value={form.excluded} onChange={set("excluded")} />
      </Field>
      <p className="text-[12px] text-base-content/70">
        These apply to the whole week in progress: the bot reads them when the week closes on Monday 00:00 UTC.
      </p>
      <SubmitRow
        chainId={campaign.payoutChainId}
        onClose={onClose}
        isPending={write.isPending}
        text="Save"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
