import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { ConditionalMarketAlert } from "@/components/Market/ConditionalMarketAlert";
import { ConditionalTokenActions } from "@/components/Market/ConditionalTokenActions";
import { MarketHeader } from "@/components/Market/Header/MarketHeader";
import MarketChart from "@/components/Market/MarketChart";
import { Outcomes } from "@/components/Market/Outcomes";
import { RelatedMarkets } from "@/components/Market/RelatedMarkets";
import { SwapTokens } from "@/components/Market/SwapTokens";
import { Market, useMarket } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { isMarketReliable } from "@/lib/market";
import { toSnakeCase } from "@/lib/utils";
import { config } from "@/wagmi";
import { switchChain } from "@wagmi/core";
import { useParams, useSearchParams } from "react-router-dom";
import { Address } from "viem";
import { useAccount } from "wagmi";

function SwapWidget({
  market,
  account,
  outcomeIndex,
  images,
}: {
  router: Address;
  market: Market;
  account?: Address;
  outcomeIndex: number;
  images?: string[];
}) {
  const { data: parentMarket } = useMarket(market.parentMarket, market.chainId);
  const { data: outcomeToken } = useTokenInfo(market.wrappedTokens[outcomeIndex], market.chainId);
  // on child markets we want to buy/sell using parent outcomes
  const { data: parentCollateral } = useTokenInfo(
    parentMarket?.wrappedTokens?.[Number(market.parentOutcome)],
    market.chainId,
  );

  const { data: odds = [], isLoading } = useMarketOdds(market, true);

  if (!outcomeToken) {
    return null;
  }

  return (
    <SwapTokens
      account={account}
      chainId={market.chainId}
      outcomeText={market.outcomes[outcomeIndex]}
      outcomeToken={outcomeToken}
      outcomeImage={images?.[outcomeIndex]}
      isInvalidResult={outcomeIndex === market.wrappedTokens.length - 1}
      hasEnoughLiquidity={isLoading ? undefined : odds[outcomeIndex] > 0}
      parentCollateral={parentCollateral}
    />
  );
}

function MarketPage() {
  const { address: account, chainId: connectedChainId } = useAccount();
  const [searchParams] = useSearchParams();

  const params = useParams();
  const id = params.id as Address;
  const chainId = Number(params.chainId) as SupportedChain;

  const router = getRouterAddress(chainId);

  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);
  const { data: images } = useMarketImages(id as Address, chainId);

  const outcomeIndexFromSearch =
    market?.outcomes?.findIndex((outcome) => toSnakeCase(outcome) === searchParams.get("outcome")) ?? -1;
  const outcomeIndex = Math.max(outcomeIndexFromSearch, 0);
  if (isMarketError) {
    return (
      <div className="container py-10">
        <Alert type="error" className="mb-5">
          Market not found
        </Alert>
      </div>
    );
  }

  if (isMarketPending || !router || !market) {
    return (
      <div className="container-fluid py-10 space-y-5">
        <Breadcrumb links={[{ title: "Market" }]} />
        <div className="shimmer-container w-full h-[200px]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="col-span-1 lg:col-span-8">
            <div className="font-[16px] font-semibold mb-[24px]">Outcomes</div>
            <div className="shimmer-container h-[390px]"></div>
          </div>

          <div className="col-span-1 lg:col-span-4 space-y-5">
            <div className="shimmer-container w-full h-[330px]"></div>
            <div className="shimmer-container w-full h-[390px]"></div>
          </div>
        </div>
      </div>
    );
  }

  const reliableMarket = isMarketReliable(market);

  return (
    <div className="container-fluid py-10">
      <div className="space-y-5">
        <Breadcrumb links={[{ title: "Market" }]} />
        {chainId && connectedChainId && chainId !== connectedChainId && (
          <Alert type="warning">
            This market does not exist on the selected network. Switch to{" "}
            <span
              className="font-semibold cursor-pointer text-purple-primary"
              onClick={() => switchChain(config, { chainId })}
            >
              {SUPPORTED_CHAINS[chainId].name}
            </span>
            .
          </Alert>
        )}
        {market.verification.status === "not_verified" && (
          <Alert type="warning" title="This market is unverified (it didn't go through the curation process)">
            It may be invalid, tricky and have misleading token names. Exercise caution while interacting with it.
          </Alert>
        )}

        <ConditionalMarketAlert
          parentMarket={market.parentMarket}
          parentOutcome={market.parentOutcome}
          chainId={chainId}
        />

        <MarketHeader market={market} images={images} />

        {!reliableMarket && (
          <Alert
            type="error"
            title="There is a discrepancy between the market information and the Reality.eth questions"
          >
            It could lead to the market being resolved to an invalid or unexpected outcome. Proceed with caution.
          </Alert>
        )}
        {market && <MarketChart market={market} />}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="col-span-1 lg:col-span-8 space-y-16">
            {market && (
              <>
                <Outcomes market={market} images={images?.outcomes} />
                <RelatedMarkets market={market} />
              </>
            )}
          </div>
          <div className="col-span-1 lg:col-span-4 space-y-5">
            <SwapWidget
              router={router}
              market={market}
              account={account}
              outcomeIndex={outcomeIndex}
              images={images?.outcomes}
            />

            <ConditionalTokenActions router={router} market={market} account={account} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketPage;
