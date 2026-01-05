import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { Drawer } from "@/components/Drawer";
import { ConditionalMarketAlert } from "@/components/Market/ConditionalMarketAlert";
import { ConditionalTokenActions } from "@/components/Market/ConditionalTokenActions";
import { MarketHeader } from "@/components/Market/Header/MarketHeader";
import MarketCategories from "@/components/Market/MarketCategories";
import MarketChart from "@/components/Market/MarketChart/MarketChart";
import MarketTabs from "@/components/Market/MarketTabs/MarketTabs";
import { MobileMarketActions } from "@/components/Market/MobileMarketActions";
import { Outcomes } from "@/components/Market/Outcomes";
import { SwapTokens } from "@/components/Market/SwapTokens/SwapTokens";
import { marketFactoryAddress } from "@/hooks/contracts/generated-market-factory";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { getUseGraphMarketKey, useMarket, useMarketQuestions } from "@/hooks/useMarket";
import useMarketHasLiquidity from "@/hooks/useMarketHasLiquidity";
import { useTokenInfo, useTokensInfo } from "@/hooks/useTokenInfo";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { getLiquidityPairForToken, getMarketStatus } from "@/lib/market";
import { MarketStatus } from "@/lib/market";
import { Market } from "@/lib/market";
import { isMarketReliable } from "@/lib/market";
import { queryClient } from "@/lib/query-client";
import { isTwoStringsEqual } from "@/lib/utils";
import { config } from "@/wagmi";
import { switchChain } from "@wagmi/core";
import React, { useEffect, useState } from "react";
import { Address, zeroAddress } from "viem";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount } from "wagmi";

function SwapWidget({
  market,
  outcomeIndex,
  images,
  onOutcomeChange,
}: {
  market: Market;
  outcomeIndex: number;
  images?: string[];
  onOutcomeChange: (i: number, isClick: boolean) => void;
}) {
  // Preload all outcome tokens to populate cache and avoid flicker while loading
  useTokensInfo(market.wrappedTokens, market.chainId);
  const { data: outcomeToken } = useTokenInfo(market.wrappedTokens[outcomeIndex], market.chainId);

  const hasLiquidity = useMarketHasLiquidity(market, outcomeIndex);

  // on Futarchy markets we want to buy/sell using the associated outcome token,
  // on child markets we want to buy/sell using parent outcomes.
  const { data: fixedCollateral } = useTokenInfo(
    market.type === "Futarchy"
      ? getLiquidityPairForToken(market, outcomeIndex)
      : market.parentMarket.id !== zeroAddress
        ? market.collateralToken
        : undefined,
    market.chainId,
  );
  const marketStatus = getMarketStatus(market);

  if (marketStatus === MarketStatus.CLOSED) {
    return (
      <Alert type="info">
        The trade widget is hidden for closed markets. But you can still interact with your ERC20 outcome tokens onchain
        as well as mint, merge, redeem.
      </Alert>
    );
  }

  if (!outcomeToken) {
    return null;
  }

  return (
    <SwapTokens
      market={market}
      outcomeIndex={outcomeIndex}
      outcomeToken={outcomeToken}
      fixedCollateral={fixedCollateral}
      outcomeImage={images?.[outcomeIndex]}
      hasEnoughLiquidity={hasLiquidity}
      onOutcomeChange={onOutcomeChange}
    />
  );
}

function MarketPage() {
  const { routeParams } = usePageContext();
  const { address: account, chainId: connectedChainId } = useAccount();
  const [outcomeIndex, setOutcomeIndex] = useState(0);
  const idOrSlug = routeParams.id as Address;
  const chainId = Number(routeParams.chainId) as SupportedChain;
  const isMobile = useIsSmallScreen(1200);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTabs, setDrawerTabs] = useState<React.ReactNode>(null);

  let {
    data: market,
    isError: isMarketError,
    isLoading: isMarketLoading,
    isPlaceholderData,
  } = useMarket(idOrSlug, chainId);

  market = useMarketQuestions(market, chainId);

  useEffect(() => {
    //update latest data since onBeforeRender cached
    queryClient.invalidateQueries({ queryKey: getUseGraphMarketKey(idOrSlug, chainId) });
  }, []);

  // Effect for closing drawer when switching to desktop
  useEffect(() => {
    if (!isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  if (isMarketError) {
    return (
      <div className="container py-10">
        <Alert type="error" className="mb-5">
          Market not found
        </Alert>
      </div>
    );
  }

  if ((isMarketLoading && !isPlaceholderData) || !market) {
    return (
      <div className="container-fluid py-10 space-y-5">
        <Breadcrumb links={[{ title: "Market" }]} />
        <div className="shimmer-container w-full h-[200px]"></div>
        <div className="grid grid-cols-1 [@media(min-width:1200px)]:grid-cols-12 gap-10">
          <div className="col-span-1 [@media(min-width:1200px)]:col-span-8">
            <div className="font-[16px] font-semibold mb-[24px]">Outcomes</div>
            <div className="shimmer-container h-[390px]"></div>
          </div>

          <div className="col-span-1 [@media(min-width:1200px)]:col-span-4 space-y-5">
            <div className="shimmer-container w-full h-[330px]"></div>
            <div className="shimmer-container w-full h-[390px]"></div>
          </div>
        </div>
      </div>
    );
  }

  const marketStatus = getMarketStatus(market);
  const reliableMarket = isMarketReliable(market);

  const onOutcomeChange = (i: number, isClick: boolean) => {
    setOutcomeIndex(i);
    if (isClick && isMobile) {
      setDrawerOpen(true);
    }
  };

  return (
    <div className="container-fluid py-10">
      <div className="space-y-5">
        <Breadcrumb links={[{ title: "Market" }]} />
        {marketStatus !== MarketStatus.CLOSED &&
          !isTwoStringsEqual(market.factory, marketFactoryAddress[market.chainId]) && (
            <Alert type="warning" title="This market was not created through an official Seer factory.">
              It could be malicious or contain misleading information. Proceed with extreme caution.
            </Alert>
          )}
        {chainId && connectedChainId && chainId !== connectedChainId && (
          <Alert type="warning">
            This market does not exist on the selected network. Switch to{" "}
            <span
              className="font-semibold cursor-pointer text-purple-primary"
              onClick={() => switchChain(config, { chainId })}
            >
              {SUPPORTED_CHAINS?.[chainId]?.name}
            </span>
            .
          </Alert>
        )}
        {market.verification?.status === "not_verified" && (
          <Alert type="warning" title="This market is unverified (it didn't go through the curation process)">
            It may be invalid, tricky and have misleading token names. Exercise caution while interacting with it.
          </Alert>
        )}

        <ConditionalMarketAlert
          parentMarket={market.parentMarket.id}
          parentOutcome={market.parentOutcome}
          chainId={chainId}
        />

        <MarketHeader market={market} images={market.images} />
        {market.categories?.length > 0 && <MarketCategories market={market} />}
        {!reliableMarket && (
          <Alert
            type="error"
            title="There is a discrepancy between the market information and the Reality.eth questions"
          >
            It could lead to the market being resolved to an invalid or unexpected outcome. Proceed with caution.
          </Alert>
        )}
        <MarketChart market={market} />
        <div className="grid grid-cols-1 [@media(min-width:1200px)]:grid-cols-12 gap-x-4 gap-y-10">
          <div className="col-span-1 [@media(min-width:1200px)]:col-span-8 h-fit space-y-16">
            <Outcomes
              market={market}
              images={market?.images?.outcomes}
              activeOutcome={outcomeIndex}
              onOutcomeChange={onOutcomeChange}
            />
          </div>
          {/* Desktop: Show sidebar, Mobile: Hidden (shown in drawer) */}
          <div className="hidden [@media(min-width:1200px)]:block col-span-1 [@media(min-width:1200px)]:col-span-4 space-y-5 [@media(min-width:1200px)]:row-span-2 h-fit [@media(min-width:1200px)]:sticky [@media(min-width:1200px)]:top-2">
            <SwapWidget
              market={market}
              outcomeIndex={outcomeIndex}
              images={market?.images?.outcomes}
              onOutcomeChange={onOutcomeChange}
            />
            <ConditionalTokenActions market={market} account={account} outcomeIndex={outcomeIndex} />
          </div>
          <div className="col-span-1 [@media(min-width:1200px)]:col-span-8 space-y-16 [@media(min-width:1200px)]:row-span-2">
            <MarketTabs market={market} />
          </div>
        </div>
        {/* Mobile Drawer */}
        {isMobile && (
          <>
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} tabs={drawerTabs}>
              <MobileMarketActions
                account={account}
                market={market}
                swapWidget={
                  <SwapWidget
                    market={market}
                    outcomeIndex={outcomeIndex}
                    images={market?.images?.outcomes}
                    onOutcomeChange={onOutcomeChange}
                  />
                }
                onTabsChange={setDrawerTabs}
              />
            </Drawer>
            {/* Floating Action Button to open drawer - only show when drawer is closed */}
            {!drawerOpen && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="fixed bottom-6 right-6 z-[99] bg-purple-primary text-white rounded-full p-4 shadow-lg hover:bg-purple-secondary transition-colors flex items-center justify-center w-14 h-14"
                aria-label="Open trade drawer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M280-160 80-360l200-200 56 57-103 103h287v80H233l103 103-56 57Zm400-240-56-57 103-103H440v-80h287L624-743l56-57 200 200-200 200Z" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MarketPage;
