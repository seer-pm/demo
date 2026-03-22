import * as React from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { formatUnits, isAddressEqual, zeroAddress } from "viem";
import type { Market, Token } from "@seer-pm/sdk";
import {
  COLLATERAL_TOKENS,
  TradeType,
  isSeerCredits,
  getMaximumAmountIn,
  WRAPPED_OUTCOME_TOKEN_DECIMALS,
} from "@seer-pm/sdk";
import {
  useMarket,
  useMarketHasLiquidity,
  useMissingTradeApproval,
  useQuoteTrade,
  useTokenBalance,
  useTokenInfo,
  useTrade,
  useApproveTokens,
} from "@seer-pm/react";
import { toastify, toastifyTx } from "./toastify";
import { TokensDropdown } from "./TokensDropdown";

export interface SwapWidgetProps {
  readonly market: Market;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function buildOutcomeTokens(market: Market): Token[] {
  const tokens: Token[] = [];
  const wrapped = market.wrappedTokens ?? [];
  const rawOutcomes = market.outcomes ?? [];

  for (let i = 0; i < wrapped.length; i += 1) {
    const address = wrapped[i];
    if (!address) continue;

    const raw = rawOutcomes[i];
    const symbol = typeof raw === "string" ? raw : `OUTCOME_${i + 1}`;

    tokens.push({
      address: address as `0x${string}`,
      chainId: market.chainId,
      symbol,
      decimals: WRAPPED_OUTCOME_TOKEN_DECIMALS,
    });
  }

  return tokens;
}

function getSelectedCollateral(market: Market, outcomeToken: Token, parentCollateral?: Token): Token {
  const parentId = market.parentMarket.id;
  const hasParent = typeof parentId === "string" && !isAddressEqual(parentId, zeroAddress) && parentCollateral;

  if (hasParent && parentCollateral) {
    return parentCollateral;
  }

  return COLLATERAL_TOKENS[market.chainId]?.primary ?? outcomeToken;
}

export function SwapWidget({ market }: SwapWidgetProps): React.ReactElement {
  const { address: account } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const isWrongChain = chainId !== undefined && chainId !== market.chainId;

  const [mode, setMode] = React.useState<"buy" | "sell">("buy");
  const [outcomeIndex, setOutcomeIndex] = React.useState(0);
  const [amount, setAmount] = React.useState("");

  const outcomeTokens = React.useMemo(() => buildOutcomeTokens(market), [market]);

  const parentId = market.parentMarket.id;
  const isChildMarket = typeof parentId === "string" && !isAddressEqual(parentId, zeroAddress);

  const parentOutcomeIndex = isChildMarket ? Number(market.parentOutcome) : undefined;

  const { data: parentMarket } = useMarket(market.parentMarket.id, market.chainId);

  const parentCollateralAddress =
    isChildMarket && parentMarket && parentOutcomeIndex !== undefined
      ? parentMarket.wrappedTokens?.[parentOutcomeIndex]
      : undefined;

  const { data: parentCollateral } = useTokenInfo(parentCollateralAddress, market.chainId);

  const debouncedAmount = useDebounce(amount, 500);

  const safeOutcomeIndex =
    outcomeTokens.length === 0 ? 0 : Math.min(Math.max(outcomeIndex, 0), outcomeTokens.length - 1);

  const outcomeToken = outcomeTokens[safeOutcomeIndex] ?? outcomeTokens[0];

  const hasLiquidity = useMarketHasLiquidity(market, safeOutcomeIndex);

  const selectedCollateral = getSelectedCollateral(market, outcomeToken, parentCollateral);

  const amountForQuote = isAddressEqual(selectedCollateral.address, outcomeToken.address) ? "" : debouncedAmount;

  const sellToken = mode === "buy" ? selectedCollateral : outcomeToken;

  const { data: balance = 0n } = useTokenBalance(account, sellToken?.address, market.chainId);

  const {
    data: quoteData,
    isLoading: quoteIsLoading,
    error: quoteError,
  } = useQuoteTrade(
    market.chainId,
    account,
    amountForQuote,
    outcomeToken,
    selectedCollateral,
    mode,
    TradeType.EXACT_INPUT,
    "1",
    false,
  );

  const requiredAmount = quoteData?.trade ? getMaximumAmountIn(quoteData.trade) : 0n;

  const insufficientBalance = !!quoteData?.trade && requiredAmount > 0n && balance < requiredAmount;

  const isSeerCreditsCollateral = selectedCollateral ? isSeerCredits(market.chainId, selectedCollateral.address) : false;

  const {
    data: missingApprovals = [],
    isLoading: isApprovalLoading,
  } = useMissingTradeApproval(account, quoteData?.trade);

  const needsTokenApproval = !isSeerCreditsCollateral && missingApprovals.length > 0;

  const approveTokensMutation = useApproveTokens(toastifyTx);

  const { tradeTokens } = useTrade(
    account,
    quoteData?.trade,
    isSeerCreditsCollateral,
    () => {
      setAmount("");
    },
    false,
    toastify,
    toastifyTx,
  );

  const executeTrade = tradeTokens.mutateAsync;
  const isTradePending = tradeTokens.isPending;

  const receivedAmount = quoteData ? Number(formatUnits(quoteData.value, quoteData.decimals)) : 0;

  const isDisabled = hasLiquidity === false;

  const outcomeOptions: readonly Token[] = React.useMemo(() => outcomeTokens, [outcomeTokens]);

  const selectedOutcomeToken = outcomeToken;

  const payToken = mode === "buy" ? selectedCollateral : selectedOutcomeToken;

  const receiveToken = mode === "buy" ? selectedOutcomeToken : selectedCollateral;

  const { data: outcomeShares = 0n } = useTokenBalance(account, outcomeToken?.address, market.chainId);

  const payBalanceRaw = mode === "buy" ? balance : outcomeShares;

  const payDecimals = mode === "buy" ? selectedCollateral?.decimals ?? 18 : WRAPPED_OUTCOME_TOKEN_DECIMALS;

  const payBalanceHuman = Number(formatUnits(payBalanceRaw, payDecimals));

  const setAmountToPercent = React.useCallback(
    (pct: number) => {
      const value = (payBalanceHuman * pct) / 100;
      setAmount(value <= 0 ? "0" : value.toFixed(4).replace(/\.?0+$/, ""));
    },
    [payBalanceHuman],
  );

  const payBalance =
    mode === "buy"
      ? account
        ? Number(formatUnits(balance, selectedCollateral?.decimals ?? 18)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0.00"
      : account
        ? Number(formatUnits(outcomeShares, WRAPPED_OUTCOME_TOKEN_DECIMALS)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })
        : "0.00";

  const receiveBalance =
    mode === "buy"
      ? account
        ? Number(formatUnits(outcomeShares, WRAPPED_OUTCOME_TOKEN_DECIMALS)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })
        : "0.00"
      : account
        ? Number(formatUnits(balance, selectedCollateral?.decimals ?? 18)).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0.00";

  const displayReceiveAmount =
    quoteData && Number(debouncedAmount) > 0 && !quoteIsLoading
      ? receivedAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })
      : "0.0";

  const amountIn = Number(debouncedAmount) || 0;
  const amountOut = receivedAmount;

  const avgPrice =
    quoteData && amountIn > 0 && amountOut > 0 && !quoteIsLoading
      ? mode === "buy"
        ? amountIn / amountOut
        : amountOut / amountIn
      : null;

  const avgPriceDisplay =
    avgPrice != null ? `${avgPrice.toFixed(4)} ${selectedCollateral?.symbol ?? ""}` : "—";

  const mapTokenToIndex = React.useCallback(
    (token: Token): number => {
      const addr = token.address.toLowerCase();
      const idx = outcomeTokens.findIndex((t) => t.address.toLowerCase() === addr);
      return idx >= 0 ? idx : 0;
    },
    [outcomeTokens],
  );

  const payTokenOptions = mode === "buy" ? [payToken].filter((t): t is Token => Boolean(t)) : outcomeOptions;

  const receiveTokenOptions =
    mode === "buy" ? outcomeOptions : [receiveToken].filter((t): t is Token => Boolean(t));

  const handleSelectPayToken = React.useCallback(
    (token: Token) => {
      if (mode === "buy") return;
      setOutcomeIndex(mapTokenToIndex(token));
    },
    [mode, mapTokenToIndex],
  );

  const handleSelectReceiveToken = React.useCallback(
    (token: Token) => {
      if (mode === "buy") {
        setOutcomeIndex(mapTokenToIndex(token));
      }
    },
    [mode, mapTokenToIndex],
  );

  const handleToggleDirection = React.useCallback(() => setMode(mode === "buy" ? "sell" : "buy"), [mode]);

  const handleApprove = React.useCallback(async () => {
    if (!missingApprovals[0]) return;
    const a = missingApprovals[0];
    await approveTokensMutation.mutateAsync({
      tokenAddress: a.address,
      spender: a.spender,
      amount: a.amount,
      chainId: market.chainId,
    });
  }, [approveTokensMutation, missingApprovals, market.chainId]);

  const canSubmit =
    !isDisabled &&
    !insufficientBalance &&
    !isTradePending &&
    !!account &&
    !!quoteData?.trade &&
    !isApprovalLoading;

  const handleSwitchNetwork = React.useCallback(
    () => switchChain({ chainId: market.chainId }),
    [switchChain, market.chainId],
  );

  const sellTokenSymbol = sellToken?.symbol ?? undefined;

  const onFormSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!account || !quoteData?.trade || insufficientBalance || isTradePending) return;
      try {
        await executeTrade({
          trade: quoteData.trade,
          account,
          isBuyExactOutputNative: false,
          isSellToNative: false,
          isSeerCredits: isSeerCreditsCollateral,
        });
      } catch (err) {
        console.error("Trade failed:", err);
      }
    },
    [account, quoteData?.trade, insufficientBalance, isTradePending, executeTrade, isSeerCreditsCollateral],
  );

  return (
    <div className={`bg-card-bg border border-border-green rounded-2xl p-6 sticky top-24 ${isDisabled ? "opacity-90" : ""}`}>
      {isDisabled && (
        <p className="mb-4 text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/30 rounded-custom px-4 py-3">
          This outcome lacks sufficient liquidity for trading. You can mint tokens or provide liquidity.
        </p>
      )}
      {insufficientBalance && !isDisabled && (
        <p className="mb-4 text-sm text-red-400/90 bg-red-500/10 border border-red-500/30 rounded-custom px-4 py-3">
          Insufficient balance. You need more {sellTokenSymbol ?? "tokens"} to complete this trade.
        </p>
      )}
      <form className="space-y-0" onSubmit={onFormSubmit}>
        <div className="space-y-1 relative">
          <div className="bg-background-dark/50 border border-border-green rounded-xl p-4 pb-6 group">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-2">
              <span>Sell</span>
              <span>Balance: {payBalance}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                id="pay-amount"
                type="number"
                placeholder="0.0"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isDisabled}
                className="bg-transparent border-none p-0 text-2xl font-black w-1/2 placeholder:text-slate-700 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
              />
              {payToken && (
                <TokensDropdown options={payTokenOptions} value={payToken} onSelect={handleSelectPayToken} />
              )}
            </div>
            <div className="flex gap-2 mt-3">
              {([25, 50, 75, 100] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmountToPercent(pct)}
                  disabled={isDisabled || payBalanceHuman <= 0}
                  className="flex-1 bg-border-green/30 hover:bg-border-green/60 py-1.5 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-[20px] z-10">
            <button
              type="button"
              onClick={handleToggleDirection}
              className="bg-card-bg border border-border-green p-2 rounded-xl text-accent-green hover:rotate-180 transition-transform duration-300 cursor-pointer shadow-xl"
              aria-label="Swap direction"
            >
              <span className="material-symbols-outlined block">swap_vert</span>
            </button>
          </div>
          <div className="bg-background-dark/50 border border-border-green rounded-xl p-4 pt-8">
            <div className="flex justify-between text-xs font-bold uppercase text-slate-500 mb-2">
              <span>Buy</span>
              <span>Balance: {receiveBalance}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <input
                readOnly
                type="text"
                placeholder="0.0"
                value={quoteIsLoading && Number(amount) > 0 ? "…" : displayReceiveAmount}
                className="bg-transparent border-none p-0 text-2xl font-black w-1/2 placeholder:text-slate-700 focus:ring-0 cursor-default"
              />
              {receiveToken && (
                <TokensDropdown options={receiveTokenOptions} value={receiveToken} onSelect={handleSelectReceiveToken} />
              )}
            </div>
          </div>
        </div>
        {quoteError && Number(amount) > 0 && (
          <p className="mt-4 text-xs text-red-400 pt-2">
            {quoteError.message === "No route found"
              ? "Not enough liquidity. Try a smaller amount."
              : quoteError.message}
          </p>
        )}
        <div className="mt-6 pt-4 pb-4 space-y-2 text-xs font-medium text-slate-400">
          <div className="flex justify-between">
            <span>Avg Price</span>
            <span className="text-accent-green">{avgPriceDisplay}</span>
          </div>
          <div className="flex justify-between">
            <span>Slippage Tolerance</span>
            <span>0.5%</span>
          </div>
        </div>
        {isWrongChain ? (
          <button
            type="button"
            onClick={handleSwitchNetwork}
            disabled={isSwitchPending}
            className="w-full mt-6 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-sm rounded-custom hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSwitchPending ? "Switching…" : "Change network"}
          </button>
        ) : !insufficientBalance && needsTokenApproval ? (
          <button
            type="button"
            onClick={() => {
              void handleApprove();
            }}
            disabled={approveTokensMutation.isPending || isApprovalLoading}
            className="w-full mt-6 py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-sm rounded-custom hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {approveTokensMutation.isPending || isApprovalLoading ? "Approving…" : "Approve"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full mt-6 py-4 bg-brand rounded-custom text-black font-black uppercase tracking-widest text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(6,249,6,0.2)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            {isTradePending ? "Executing…" : "Place Trade"}
          </button>
        )}
      </form>
    </div>
  );
}

export default SwapWidget;

