import { Link } from "@/components/Link";
import { useDepositNft, useEnterFarming, useExitFarming, useWithdrawNft } from "@/hooks/useFarmingCenter";
import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { PoolIncentive, PoolInfo, useMarketPools, usePoolsDeposits } from "@/hooks/useMarketPools";
import { MarketStatus, getMarketStatus } from "@/hooks/useMarketStatus";
import { useModal } from "@/hooks/useModal";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { SWAPR_CONFIG, getFarmingUrl, getLiquidityUrl, getLiquidityUrlByMarket } from "@/lib/config";
import { CheckCircleIcon, EtherscanIcon, QuestionIcon, RightArrow } from "@/lib/icons";
import { MarketTypes, getMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { toastError } from "@/lib/toastify";
import { displayBalance, formatDate, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { getConnectorClient } from "@wagmi/core";
import clsx from "clsx";
import { useEffect } from "react";
import { Address, RpcError } from "viem";
import { watchAsset } from "viem/actions";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import { Spinner } from "../Spinner";
import { DisplayOdds } from "./DisplayOdds";
import { OutcomeImage } from "./OutcomeImage";
import PoolDetails from "./PoolDetails/PoolDetails";

interface PositionsProps {
  market: Market;
  images?: string[];
}

function poolRewardsInfo(pool: PoolInfo) {
  const { poolIncentive, realEndTime, isRewardEnded } =
    pool.incentives.length > 0
      ? {
          poolIncentive:
            pool.incentives[0].apr === 0
              ? `${displayBalance(pool.incentives[0].rewardRate * 86400n, 18, true)} SEER / day`
              : `${pool.incentives[0].apr.toFixed(2)}% APR`,
          realEndTime: formatDate(Number(pool.incentives[0].realEndTime)),
          isRewardEnded: Number(pool.incentives[0].realEndTime) * 1000 < new Date().getTime(),
        }
      : { poolIncentive: "0 SEER / day", realEndTime: "", isRewardEnded: true };
  return (
    <div>
      {!isRewardEnded && (
        <div>
          <span className="font-semibold">{pool.dex}</span> ~ {poolIncentive}
        </div>
      )}
      {pool.incentives.length > 0 && (
        <div className="flex items-center gap-2">
          <p>
            {isRewardEnded ? "Rewards ended on" : "Rewards end"}:{" "}
            <span className={isRewardEnded ? "text-[#6E6E6E]" : "text-purple-primary"}>{realEndTime}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function AddLiquidityInfo({
  chainId,
  pools,
  closeModal,
}: {
  chainId: SupportedChain;
  pools: PoolInfo[];
  closeModal: () => void;
}) {
  const { address } = useAccount();
  const { data: deposits } = usePoolsDeposits(
    chainId,
    pools.map((p) => p.id),
    address,
  );

  const enterFarming = useEnterFarming();
  const exitFarming = useExitFarming();
  const depositNft = useDepositNft();
  const withdrawNft = useWithdrawNft();

  const enterFarmingHandler = (poolInfo: PoolInfo, poolIncentive: PoolIncentive, tokenId: string) => {
    return async () => {
      await enterFarming.mutateAsync({
        farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
        rewardToken: poolIncentive.rewardToken,
        bonusRewardToken: poolIncentive.bonusRewardToken,
        pool: poolInfo.id,
        startTime: poolIncentive.startTime,
        endTime: poolIncentive.endTime,
        tokenId: BigInt(tokenId),
      });
    };
  };

  const exitFarmingHandler = (poolInfo: PoolInfo, poolIncentive: PoolIncentive, tokenId: string) => {
    return async () => {
      await exitFarming.mutateAsync({
        account: address!,
        farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
        rewardToken: poolIncentive.rewardToken,
        bonusRewardToken: poolIncentive.bonusRewardToken,
        pool: poolInfo.id,
        startTime: poolIncentive.startTime,
        endTime: poolIncentive.endTime,
        tokenId: BigInt(tokenId),
      });
    };
  };

  const depositHandler = (tokenId: string) => {
    return async () => {
      await depositNft.mutateAsync({
        nonFungiblePositionManager: SWAPR_CONFIG[chainId]?.NON_FUNGIBLE_POSITION_MANAGER!,
        farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
        account: address!,
        tokenId: BigInt(tokenId),
      });
    };
  };

  const withdrawHandler = (tokenId: string) => {
    return async () => {
      await withdrawNft.mutateAsync({
        farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
        account: address!,
        tokenId: BigInt(tokenId),
      });
    };
  };
  const isLoading = enterFarming.isPending || exitFarming.isPending || depositNft.isPending || withdrawNft.isPending;
  return (
    <div>
      <Alert type="info" title="Farming Rewards">
        Earn farming rewards (SEER) by providing liquidity to existing markets.
      </Alert>

      <div className="mt-[32px] mb-[24px] font-semibold">Available Pools:</div>

      <div className="space-y-[12px]">
        {pools.map((pool) => {
          const isRewardEnded =
            pool.incentives.length > 0 ? Number(pool.incentives[0].endTime) * 1000 < new Date().getTime() : true;
          return (
            <div className="border border-black-medium p-[24px] text-[14px]" key={pool.id}>
              <div className="flex justify-between items-center">
                <div>{poolRewardsInfo(pool)}</div>
                <div>
                  <a
                    href={getLiquidityUrl(chainId, pool.token0, pool.token1)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-primary flex items-center space-x-2"
                  >
                    <span>Open</span> <RightArrow />
                  </a>
                </div>
              </div>

              {deposits?.[pool.id] && (
                <div className="space-y-[16px] mt-[16px]">
                  {deposits[pool.id].map((deposit) => (
                    <div className="flex items-center justify-between items-center" key={deposit.id}>
                      <div>
                        <a
                          href={getFarmingUrl(chainId, deposit.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-primary hover:underline"
                        >
                          Position #{deposit.id}
                        </a>
                      </div>
                      <div>
                        {!deposit.onFarmingCenter && (
                          <Button
                            text="Deposit NFT"
                            size="small"
                            variant="secondary"
                            onClick={depositHandler(deposit.id)}
                            disabled={isLoading}
                          />
                        )}
                        {deposit.onFarmingCenter &&
                          (deposit.limitFarming === null && deposit.eternalFarming === null ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                text="Withdraw NFT"
                                size="small"
                                variant="secondary"
                                onClick={withdrawHandler(deposit.id)}
                                disabled={isLoading}
                              />
                              <div className="tooltip">
                                <Button
                                  text="Enter Farming"
                                  size="small"
                                  variant="secondary"
                                  onClick={enterFarmingHandler(pool, pool.incentives[0], deposit.id)}
                                  disabled={isLoading || isRewardEnded}
                                />
                                {isRewardEnded && (
                                  <p className="tooltiptext min-w-[220px]">Incentive program has ended</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Button
                              text="Exit Farming"
                              size="small"
                              variant="secondary"
                              onClick={exitFarmingHandler(pool, pool.incentives[0], deposit.id)}
                              disabled={isLoading}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center my-[32px]">
        <a
          href={paths.farmingProgram()}
          className="text-purple-primary text-[12px]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about the farming program
        </a>
      </div>

      <div className="text-center">
        <Button text="Return" variant="secondary" type="button" onClick={closeModal} />
      </div>
    </div>
  );
}

function AddLiquidityLinks({
  market,
  outcomeIndex,
  pools,
  openLiquidityModal,
  openPoolDetailsModal,
}: {
  market: Market;
  outcomeIndex: number;
  pools: PoolInfo[][];
  openLiquidityModal?: () => void;
  openPoolDetailsModal: () => void;
}) {
  return (
    <>
      {openLiquidityModal &&
      !isUndefined(pools[outcomeIndex]) &&
      pools[outcomeIndex].some((pool) => pool.incentives.length > 0 && pool.incentives[0].rewardRate > 0n) ? (
        <button
          type="button"
          onClick={() => {
            openLiquidityModal();
          }}
          className="text-purple-primary hover:underline text-left"
        >
          Add Liquidity
        </button>
      ) : (
        <a
          href={getLiquidityUrlByMarket(market, outcomeIndex)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-primary flex items-center space-x-2 hover:underline text-left"
        >
          Add Liquidity
        </a>
      )}
      {!isUndefined(pools[outcomeIndex]) && pools[outcomeIndex].length > 0 && (
        <button className="text-purple-primary hover:underline text-left" type="button" onClick={openPoolDetailsModal}>
          View pool details
        </button>
      )}
    </>
  );
}

interface OutcomeDetailProps {
  market: Market;
  marketStatus?: MarketStatus;
  wrappedAddress: Address;
  openModal?: () => void;
  openPoolDetailsModal: () => void;
  outcomeIndex: number;
  pools: PoolInfo[][];
  loopIndex: number;
  images?: string[];
}

function OutcomeDetails({
  market,
  marketStatus,
  wrappedAddress,
  openModal,
  openPoolDetailsModal,
  outcomeIndex,
  pools,
  loopIndex,
  images,
}: OutcomeDetailProps) {
  const { address } = useAccount();
  const { data: balances } = useTokenBalances(address, market.wrappedTokens, market.chainId);
  const { data: winningOutcomes } = useWinningOutcomes(market, marketStatus);
  const { data: tokensInfo = [] } = useTokensInfo(market.wrappedTokens, market.chainId);
  const [, setSearchParams] = useSearchParams();

  const blockExplorerUrl = SUPPORTED_CHAINS[market.chainId].blockExplorers?.default?.url;

  const addToWallet = (i: number) => {
    return async () => {
      const walletClient = await getConnectorClient(config);
      try {
        await watchAsset(walletClient, {
          type: "ERC20",
          options: {
            address: market.wrappedTokens[i],
            decimals: 18,
            symbol: tokensInfo[i].symbol,
          },
        });
      } catch (e) {
        const error = e as RpcError;
        toastError({ title: error.details || error.message });
      }
    };
  };

  const getTooltipContent = (market: Market, outcomeIndex: number) => {
    const [lowerBound, upperBound] = [market.lowerBound, market.upperBound];
    if (outcomeIndex === 1) {
      return `Redeem for (sDAI per token):\nAnswer ≥ ${upperBound}: 1\nAnswer within [${lowerBound}-${upperBound}]: (answer-${lowerBound})/(${upperBound}-${lowerBound})\nAnswer ≤ ${lowerBound}: 0`;
    }
    if (outcomeIndex === 0) {
      return `Redeem for (sDAI per token):\nAnswer ≥ ${upperBound}: 0\nAnswer within [${lowerBound}-${upperBound}]: (${upperBound}-answer)/(${upperBound}-${lowerBound})\nAnswer ≤ ${lowerBound}: 1`;
    }
    return "";
  };

  const hasInvalidOutcome = market.type === "Generic";
  const isInvalidOutcome = hasInvalidOutcome && outcomeIndex === market.wrappedTokens.length - 1;

  return (
    <div className="flex items-center space-x-[12px]">
      <div className="flex-shrink-0">
        <OutcomeImage
          image={images?.[outcomeIndex]}
          isInvalidOutcome={isInvalidOutcome}
          title={market.outcomes[outcomeIndex]}
        />
      </div>
      <div className="space-y-1">
        <div className="text-[16px] flex items-center gap-1">
          <p>
            {market.type === "Generic" && <>#{loopIndex + 1}</>} {market.outcomes[outcomeIndex]}{" "}
            {outcomeIndex <= 1 &&
              getMarketType(market) === MarketTypes.SCALAR &&
              `[${Number(market.lowerBound)},${Number(market.upperBound)}]`}{" "}
          </p>
          {getMarketType(market) === MarketTypes.SCALAR && outcomeIndex !== market.wrappedTokens.length - 1 && (
            <span className="tooltip">
              <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] !text-left">
                {getTooltipContent(market, outcomeIndex)}
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
          )}
          {isInvalidOutcome && (
            <span className="tooltip">
              <p className="tooltiptext !whitespace-pre-wrap w-[300px]">
                Invalid outcome tokens can be redeemed for the underlying tokens when the question is resolved to
                invalid.
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
          )}

          {winningOutcomes?.[outcomeIndex] === true && <CheckCircleIcon className="text-success-primary" />}
        </div>
        <div className="text-[12px] text-black-secondary">
          {balances && balances[outcomeIndex] > 0n && (
            <div className="w-full">
              {displayBalance(balances[outcomeIndex], 18, true)} {tokensInfo?.[outcomeIndex]?.symbol}
            </div>
          )}
        </div>
        <div className="text-[12px] flex items-center gap-x-4 gap-y-2 flex-wrap flex-col justify-start min-[400px]:flex-row min-[400px]:items-center">
          {balances && balances[outcomeIndex] > 0n && (
            <button className="text-purple-primary hover:underline" type="button" onClick={addToWallet(outcomeIndex)}>
              Add token to wallet
            </button>
          )}
          <a
            href={blockExplorerUrl && `${blockExplorerUrl}/token/${wrappedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-primary tooltip"
          >
            <p className="tooltiptext">
              View {tokensInfo?.[outcomeIndex]?.symbol} on {SUPPORTED_CHAINS[market.chainId].name}
            </p>
            <EtherscanIcon width="12" height="12" />
          </a>

          {market.type === "Generic" && (
            <AddLiquidityLinks
              market={market}
              outcomeIndex={outcomeIndex}
              pools={pools}
              openLiquidityModal={openModal}
              openPoolDetailsModal={openPoolDetailsModal}
            />
          )}

          {market.type === "Generic" && (
            <Link
              to={`/create-market?parentMarket=${market.id}&parentOutcome=${encodeURIComponent(market.outcomes[outcomeIndex])}`}
              onClick={(e) => {
                e.stopPropagation();
                setSearchParams(
                  {
                    outcome: market.outcomes[outcomeIndex],
                  },
                  { overwriteLastHistoryEntry: true },
                );
              }}
              className="text-purple-primary hover:underline"
            >
              New conditional market
            </Link>
          )}
        </div>
        <div className="text-[12px] flex items-center gap-4 flex-wrap"></div>
      </div>
    </div>
  );
}

export function Outcomes({ market, images }: PositionsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const outcomeIndexFromSearch = market.outcomes.findIndex((outcome) => outcome === searchParams.get("outcome"));
  const activeOutcome = Math.max(outcomeIndexFromSearch, 0);
  const { data: odds = [] } = useMarketOdds(market, true);
  const { data: pools = [] } = useMarketPools(market);
  const { Modal, openModal, closeModal } = useModal("liquidity-modal");
  const marketStatus = getMarketStatus(market);
  const { data: indexesOrderedByOdds } = useSortedOutcomes(market, marketStatus);
  const {
    Modal: PoolDetailsModal,
    openModal: openPoolDetailsModal,
    closeModal: closePoolDetailsModal,
  } = useModal("pool-details-modal", true);

  useEffect(() => {
    if (!searchParams.get("outcome") && indexesOrderedByOdds) {
      const i = indexesOrderedByOdds[0];
      setSearchParams({ outcome: market.outcomes[i] }, { overwriteLastHistoryEntry: true });
    }
  }, [indexesOrderedByOdds]);
  const outcomeClick = (i: number) => {
    return () => {
      setSearchParams({ outcome: market.outcomes[i] }, { overwriteLastHistoryEntry: true, keepScrollPosition: true });
    };
  };

  return (
    <div>
      <PoolDetailsModal
        title="Pool details"
        className="!max-w-[99vw] min-[400px]:!max-w-[80vw]"
        content={<PoolDetails market={market} outcomeIndex={activeOutcome} closeModal={closePoolDetailsModal} />}
      />
      <div className="text-[16px] font-semibold mb-[24px]">Outcomes</div>
      <div className="space-y-3">
        {(market.type === "Generic" ? market.wrappedTokens : ["_", "_"]).map((_, j) => {
          const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
          const openModalCallback =
            !isUndefined(pools[i]) && pools[i].length > 0 && market.type !== "Futarchy" ? openModal : undefined;
          return (
            <div
              key={market.wrappedTokens[i]}
              onClick={outcomeClick(i)}
              className={clsx(
                "bg-white flex justify-between p-[24px] border rounded-[3px] drop-shadow-sm cursor-pointer flex-wrap",
                activeOutcome === i || (market.type === "Futarchy" && activeOutcome === i + 2)
                  ? "border-purple-primary"
                  : "border-black-medium",
                market.type === "Futarchy" && "max-md:space-y-[12px]",
              )}
            >
              {market.type === "Generic" ? (
                <OutcomeDetails
                  market={market}
                  wrappedAddress={market.wrappedTokens[i]}
                  marketStatus={marketStatus}
                  openModal={openModalCallback}
                  openPoolDetailsModal={openPoolDetailsModal}
                  outcomeIndex={i}
                  pools={pools}
                  loopIndex={j}
                  images={images}
                />
              ) : (
                <>
                  <OutcomeDetails
                    market={market}
                    wrappedAddress={market.wrappedTokens[i]}
                    marketStatus={marketStatus}
                    openModal={openModalCallback}
                    openPoolDetailsModal={openPoolDetailsModal}
                    outcomeIndex={i}
                    pools={pools}
                    loopIndex={j}
                    images={images}
                  />
                  <OutcomeDetails
                    market={market}
                    wrappedAddress={market.wrappedTokens[i + 2]}
                    marketStatus={marketStatus}
                    openModal={openModalCallback}
                    openPoolDetailsModal={openPoolDetailsModal}
                    outcomeIndex={i + 2}
                    pools={pools}
                    loopIndex={j}
                    images={images}
                  />
                </>
              )}
              <div className="flex space-x-2 min-[400px]:space-x-10 items-center">
                <div className="text-[20px] min-[400px]:text-[24px] font-semibold">
                  {odds.length === 0 ? <Spinner /> : <DisplayOdds odd={odds[i]} marketType={getMarketType(market)} />}
                </div>

                <input
                  type="radio"
                  name="outcome"
                  className="radio"
                  onChange={outcomeClick(i)}
                  checked={activeOutcome === i || (market.type === "Futarchy" && activeOutcome === i + 2)}
                />
              </div>
              {market.type === "Futarchy" && (
                <div className="flex justify-center gap-x-4 w-full text-[12px] pt-[12px] pr-[64px]">
                  <AddLiquidityLinks
                    market={market}
                    outcomeIndex={i}
                    pools={pools}
                    openLiquidityModal={openModal}
                    openPoolDetailsModal={openPoolDetailsModal}
                  />
                </div>
              )}
            </div>
          );
        })}
        <Modal
          title="Add Liquidity"
          content={
            <AddLiquidityInfo chainId={market.chainId} pools={pools[activeOutcome] || []} closeModal={closeModal} />
          }
        />
      </div>
    </div>
  );
}
