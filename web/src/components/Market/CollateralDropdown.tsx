import { ArrowDropDown } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { isTwoStringsEqual } from "@/lib/utils";
import type { GetTokenResult } from "@seer-pm/react";
import { useTokensInfo } from "@seer-pm/react";
import { Market } from "@seer-pm/sdk";
import type { Token } from "@seer-pm/sdk";
import { WRAPPED_OUTCOME_TOKEN_DECIMALS, getActiveCollateralProfile } from "@seer-pm/sdk";
import { seerCreditsAddress } from "@seer-pm/sdk/contracts/trading-credits";
import clsx from "clsx";
import { useState } from "react";
import { Address, zeroAddress } from "viem";
import DropdownWrapper from "../Form/DropdownWrapper";

type CollateralDropdownProps = {
  selectedCollateral: Token;
  setSelectedCollateral: (selectedCollateral: Token) => void;
  collateralTokens: GetTokenResult[] | undefined;
  showChainLogo?: boolean;
  // Compact seerbeta `.io-token` chip used in the market purchase panel.
  compact?: boolean;
};

type MarketCollateralDropdownProps = {
  market: Market;
  selectedCollateral: Token;
  setSelectedCollateral: (selectedCollateral: Token) => void;
  type: "buy" | "sell";
};

function getCollateralOptions(market: Market, type: "buy" | "sell"): Address[] {
  if (market.type === "Futarchy") {
    return [market.collateralToken1, market.collateralToken2];
  }

  const profile = getActiveCollateralProfile(market.chainId);
  const options = [profile.primary.address];

  if (profile.secondary) {
    options.push(profile.secondary.address);
  }

  if (profile.secondary?.wrapped) {
    options.push(profile.secondary.wrapped.address);
  }

  if (type === "sell" && market.chainId in seerCreditsAddress) {
    options.push(seerCreditsAddress[market.chainId as keyof typeof seerCreditsAddress]);
  }

  // TODO: allow to swap using multple alternative tokens
  if (getActiveCollateralProfile(market.chainId).swap) {
    options.push(...getActiveCollateralProfile(market.chainId).swap!.map((t) => t.address));
  }

  return options;
}

export function CollateralDropdown(props: CollateralDropdownProps) {
  const { collateralTokens, selectedCollateral, setSelectedCollateral, showChainLogo = false, compact = false } = props;

  const [isOpen, setIsOpen] = useState(false);

  if (!collateralTokens || collateralTokens.length === 0) {
    return null;
  }

  return (
    <DropdownWrapper
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      // `auto` keeps the menu inside the viewport — when there's not enough
      // room on the right (e.g. the sDAI selector sits near the right edge
      // of the purchase panel), the menu flips left instead of overflowing.
      direction="auto"
      className="rounded-[var(--r-md)] !border-[var(--border)] bg-[var(--surface)] !shadow-[var(--shadow-md)] p-[6px] min-w-[200px]"
      content={
        <div>
          {collateralTokens.map((collateralToken) => (
            <li
              key={collateralToken.address}
              onClick={() => {
                setSelectedCollateral(collateralToken);
                setIsOpen(false);
              }}
              className={clsx(
                // Match seerbeta submenu styling: tighter padding, 6px radius,
                // soft bg-2 hover, no left-border accent. Smaller logo (20px)
                // and text (13.5px / medium) to match surrounding chip scale.
                "flex items-center gap-2 px-[12px] py-[9px] rounded-[6px] cursor-pointer hover:bg-bg-2 transition-colors",
                isTwoStringsEqual(collateralToken.address, selectedCollateral.address) &&
                  "bg-bg-2 text-ink",
              )}
            >
              <div className="w-5 h-5 overflow-hidden flex-shrink-0 relative">
                <img
                  className="w-full h-full rounded-full"
                  alt={collateralToken.symbol}
                  src={paths.tokenImage(collateralToken.address, collateralToken.chainId)}
                />
                {showChainLogo && (
                  <img
                    className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-base-100 rounded-full"
                    alt={String(collateralToken.chainId)}
                    src={paths.chainImage(collateralToken.chainId)}
                  />
                )}
              </div>
              <p className="font-medium text-[13.5px] text-ink-2">{collateralToken.symbol}</p>
            </li>
          ))}
        </div>
      }
    >
      <div
        className={clsx(
          compact
            ? "io-token cursor-pointer"
            : "flex items-center gap-1 rounded-full border border-[#f2f2f2] dark:border-neutral px-3 py-1 shadow-[0_0_10px_rgba(34,34,34,0.04)] hover:bg-base-300/60 dark:hover:bg-base-200 cursor-pointer",
        )}
      >
        <div className={clsx("overflow-hidden flex-shrink-0 relative", compact ? "token-img w-4 h-4" : "w-6 h-6")}>
          <img
            className="w-full h-full rounded-full"
            alt={selectedCollateral.symbol}
            src={paths.tokenImage(selectedCollateral.address, selectedCollateral.chainId)}
          />
          {showChainLogo && (
            <img
              className="absolute w-[10px] h-[10px] bottom-0 right-0 bg-base-100 rounded-full"
              alt={String(selectedCollateral.chainId)}
              src={paths.chainImage(selectedCollateral.chainId)}
            />
          )}
        </div>
        <p className={clsx(!compact && "font-semibold text-[16px]")}>{selectedCollateral.symbol}</p>
        {/* Smaller chev in compact (in-row) mode so it matches the
            surrounding sDAI logo size. Was rendering at 24px which made
            the caret dwarf the token icon and inflate the chip. */}
        <ArrowDropDown fill="var(--ink-5)" size={compact ? "10px" : "24px"} />
      </div>
    </DropdownWrapper>
  );
}


function buildFallbackCollateralTokens(market: Market, _type: "buy" | "sell"): Token[] {
  if (market.type === "Futarchy") {
    return [];
  }
  const profile = getActiveCollateralProfile(market.chainId);
  const tokens: Token[] = [profile.primary];
  if (profile.secondary) {
    tokens.push(profile.secondary);
  }
  if (profile.secondary?.wrapped) {
    tokens.push(profile.secondary.wrapped);
  }
  if (profile.swap) {
    tokens.push(...profile.swap);
  }
  return tokens;
}

export function MarketCollateralDropdown(props: MarketCollateralDropdownProps) {
  const { data: liveCollateralTokens } = useTokensInfo(
    getCollateralOptions(props.market, props.type),
    props.market.chainId,
  );

  if (props.market.parentMarket.id !== zeroAddress) {
    return null;
  }

  const hasLive = !!liveCollateralTokens && liveCollateralTokens.length > 0;
  const collateralTokens = (
    hasLive ? liveCollateralTokens : (buildFallbackCollateralTokens(props.market, props.type) as unknown as GetTokenResult[])
  ) as GetTokenResult[];

  if (!hasLive && collateralTokens.length > 0 && typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.warn(
      `[MarketCollateralDropdown] live token multicall returned empty for chainId=${props.market.chainId} ` +
        `— using profile-derived fallback (${collateralTokens.map((t) => t.symbol).join(", ")}).`,
    );
  }

  return <CollateralDropdown {...props} collateralTokens={collateralTokens} compact />;
}

// Silence unused-import warnings when the chain has no native wrapped-token decimals lookup.
void WRAPPED_OUTCOME_TOKEN_DECIMALS;
