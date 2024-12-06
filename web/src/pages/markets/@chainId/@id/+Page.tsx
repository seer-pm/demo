import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import { ConditionalMarketAlert } from "@/components/Market/ConditionalMarketAlert";
import { ConditionalTokenActions } from "@/components/Market/ConditionalTokenActions";
import { MarketHeader } from "@/components/Market/Header/MarketHeader";
import MarketChart from "@/components/Market/MarketChart";
import MarketTabs from "@/components/Market/MarketTabs/MarketTabs";
import { Outcomes } from "@/components/Market/Outcomes";
import { SwapTokens } from "@/components/Market/SwapTokens/SwapTokens";
import { Market, useMarket } from "@/hooks/useMarket";
import { useMarketImages } from "@/hooks/useMarketImages";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { getRouterAddress } from "@/lib/config";
import { getLiquidityPairForToken, isMarketReliable } from "@/lib/market";
import { config } from "@/wagmi";
import { switchChain } from "@wagmi/core";
import { Address, zeroAddress } from "viem";
import { usePageContext } from "vike-react/usePageContext";
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
  const { data: outcomeToken } = useTokenInfo(market.wrappedTokens[outcomeIndex], market.chainId);

  const { data: odds = [], isLoading } = useMarketOdds(market, true);

  // on Futarchy markets we want to buy/sell using the associated outcome token,
  // on child markets we want to buy/sell using parent outcomes.
  const { data: fixedCollateral } = useTokenInfo(
    market.type === "Futarchy"
      ? getLiquidityPairForToken(market, outcomeIndex)
      : market.parentMarket !== zeroAddress
        ? market.collateralToken
        : undefined,
    market.chainId,
  );
  const marketStatus = getMarketStatus(market);

  if (marketStatus === MarketStatus.CLOSED || !outcomeToken) {
    return null;
  }

  return (
    <SwapTokens
      account={account}
      market={market}
      outcomeIndex={outcomeIndex}
      outcomeToken={outcomeToken}
      fixedCollateral={fixedCollateral}
      outcomeImage={images?.[outcomeIndex]}
      hasEnoughLiquidity={isLoading ? undefined : odds[outcomeIndex] > 0 || market.type === "Futarchy"}
    />
  );
}

// function PoolDetails({ market, outcomeIndex }: { market: Market; outcomeIndex: number }) {
//   const { data = [] } = useMarketPools(market);
//   const poolDataPerToken = data[outcomeIndex];
//   const { data: poolTokensBalances = [], isLoading } = useQuery<
//     | {
//         balance0: string;
//         balance1: string;
//       }[]
//     | undefined,
//     Error
//   >({
//     enabled: poolDataPerToken?.length > 0,
//     queryKey: ["usePoolTokensBalances", poolDataPerToken?.map((x) => x.id)],
//     queryFn: async () => {
//       return await Promise.all(
//         poolDataPerToken.map(async ({ id, token0, token1 }) => {
//           const balance0BigInt = await fetchTokenBalance(token0, id, market.chainId);
//           const balance1BigInt = await fetchTokenBalance(token1, id, market.chainId);
//           return {
//             balance0: displayBalance(balance0BigInt, 18, true),
//             balance1: displayBalance(balance1BigInt, 18, true),
//           };
//         }),
//       );
//     },
//     refetchOnWindowFocus: true,
//   });

//   if (!poolDataPerToken?.length) return null;
//   return (
//     <div className="space-y-3 bg-white p-[24px] drop-shadow">
//       {poolDataPerToken.map((dataPerPool, poolIndex) => {
//         const { id: poolId, token0Symbol, token1Symbol } = dataPerPool;
//         return (
//           <div key={poolId}>
//             <div>
//               <p className="font-semibold">Pool Id</p>
//               <div className="flex items-center gap-2">
//                 <Link
//                   to={getPoolUrl(market.chainId, poolId)}
//                   title={poolId}
//                   className="hover:underline text-purple-primary"
//                   target="_blank"
//                   rel="noopener noreferrer"
//                 >
//                   {poolId.slice(0, 6)}...{poolId.slice(-4)}
//                 </Link>
//                 <CopyButton textToCopy={poolId} size={18} />
//               </div>
//             </div>
//             <div>
//               <p className="font-semibold">Pool Balances</p>
//               {isLoading ? (
//                 <div className="shimmer-container w-20 h-4"></div>
//               ) : (
//                 <>
//                   <p className="text-[14px]">
//                     {poolTokensBalances[poolIndex]?.balance0 ?? 0} {token0Symbol}
//                   </p>
//                   <p className="text-[14px]">
//                     {poolTokensBalances[poolIndex]?.balance1 ?? 0} {token1Symbol}
//                   </p>
//                 </>
//               )}
//             </div>
//             {poolIndex !== poolDataPerToken.length - 1 && <div className="w-full h-[1px] bg-black-medium mt-2"></div>}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

function MarketPage() {
  const { routeParams } = usePageContext();
  const { address: account, chainId: connectedChainId } = useAccount();
  const [searchParams] = useSearchParams();

  const id = routeParams.id as Address;
  const chainId = Number(routeParams.chainId) as SupportedChain;

  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);
  const { data: images } = useMarketImages(id as Address, chainId);

  const router = getRouterAddress(market);

  const outcomeIndexFromSearch =
    market?.outcomes?.findIndex((outcome) => outcome === searchParams.get("outcome")) ?? -1;
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
        {market.verification?.status === "not_verified" && (
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
        <MarketChart market={market} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="col-span-1 lg:col-span-8 h-fit space-y-16">
            <Outcomes market={market} images={images?.outcomes} />
          </div>
          <div className="col-span-1 lg:col-span-4 space-y-5 lg:row-span-2">
            {/* <PoolDetails market={market} outcomeIndex={outcomeIndex} /> */}
            <SwapWidget
              router={router}
              market={market}
              account={account}
              outcomeIndex={outcomeIndex}
              images={images?.outcomes}
            />

            <ConditionalTokenActions router={router} market={market} account={account} />
          </div>
          <div className="col-span-1 lg:col-span-8 space-y-16 lg:row-span-2">
            <MarketTabs market={market} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketPage;
