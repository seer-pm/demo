import { Link } from "@/components/Link";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { NftPosition, PoolInfo, useMarketPools, useNftPositions, usePoolsDeposits } from "@/hooks/useMarketPools";
import { useModal } from "@/hooks/useModal";
import { useSortedOutcomes } from "@/hooks/useSortedOutcomes";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { useWinningOutcomes } from "@/hooks/useWinningOutcomes";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { getFarmingUrl, getLiquidityUrl, getLiquidityUrlByMarket, getPositionUrl } from "@/lib/config";
import { formatDate } from "@/lib/date";
import { CheckCircleIcon, EtherscanIcon, QuestionIcon, RightArrow } from "@/lib/icons";
import { getMarketStatus, isOdd } from "@/lib/market";
import { MarketStatus } from "@/lib/market";
import { Market } from "@/lib/market";
import { MarketTypes, getMarketType, getMultiScalarEstimate, isInvalidOutcome } from "@/lib/market";
import { paths } from "@/lib/paths";
import { displayScalarBound } from "@/lib/reality";
import { displayBalance, isUndefined } from "@/lib/utils";
import clsx from "clsx";
import { differenceInSeconds, startOfDay } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import { Spinner } from "../Spinner";
import { DisplayOdds } from "./DisplayOdds";
import { FarmingActions } from "./FarmingActions";
import { OutcomeImage } from "./OutcomeImage";
import PoolDetails from "./PoolDetails/PoolDetails";

interface OutcomesProps {
  market: Market;
  images?: string[];
  activeOutcome: number;
  onOutcomeChange: (i: number, isClick: boolean) => void;
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
      {pool.incentives.length > 0 ? (
        <div className="flex items-center gap-2">
          <p>
            {isRewardEnded ? "Rewards ended on" : "Rewards end"}:{" "}
            <span className={isRewardEnded ? "text-[#6E6E6E]" : "text-purple-primary"}>{realEndTime}</span>
          </p>
        </div>
      ) : (
        "This pool currently has no active incentives or rewards"
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

  const { data: nftPositionMapping } = useNftPositions(
    chainId,
    Object.values(deposits ?? {})
      .flat()
      .map((x) => x.id),
  );

  return (
    <div>
      <Alert type="info" title="Farming Rewards">
        Earn farming rewards (SEER) by providing liquidity to existing markets.
      </Alert>

      <div className="mt-[32px] mb-[24px] font-semibold">Available Pools:</div>

      <div className="space-y-[12px]">
        {pools.map((pool) => {
          const hasIncentives = pool.incentives.length > 0;
          const isRewardEnded = hasIncentives
            ? Number(pool.incentives[0].realEndTime) * 1000 < new Date().getTime()
            : true;
          return (
            <div className="border border-separator-100 p-[24px] text-[14px]" key={pool.id}>
              <div className="flex justify-between items-center">
                <div>{poolRewardsInfo(pool)}</div>
                <div>
                  <a
                    href={getLiquidityUrl(chainId, pool.token0, pool.token1)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-primary flex items-center space-x-2"
                  >
                    <span>Add liquidity</span> <RightArrow />
                  </a>
                </div>
              </div>

              {deposits?.[pool.id] && (
                <div className="space-y-[16px] mt-[16px]">
                  {deposits[pool.id].map((deposit) => {
                    const isFarming =
                      deposit.onFarmingCenter && (deposit.limitFarming !== null || deposit.eternalFarming !== null);
                    return (
                      <div key={deposit.id}>
                        <div className="flex items-center justify-between items-center">
                          <div>
                            <a
                              href={getPositionUrl(chainId, deposit.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-primary hover:underline block"
                            >
                              Position #{deposit.id}
                            </a>
                            {deposit.onFarmingCenter && (
                              <>
                                {" "}
                                <a
                                  href={getFarmingUrl(chainId, deposit.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-primary hover:underline text-[13px]"
                                >
                                  {deposit.limitFarming === null && deposit.eternalFarming === null
                                    ? "(On Farming Center)"
                                    : "(In Farming)"}
                                </a>
                              </>
                            )}
                          </div>
                          <div>
                            {address && (
                              <FarmingActions
                                account={address}
                                chainId={chainId}
                                deposit={deposit}
                                pool={pool}
                                isRewardEnded={isRewardEnded}
                              />
                            )}
                          </div>
                        </div>
                        {nftPositionMapping?.[deposit.id] && !isRewardEnded && isFarming && (
                          <RewardsDisplay
                            position={nftPositionMapping[deposit.id]}
                            totalRewardPerDay={Number(formatUnits(pool.incentives[0].rewardRate * 86400n, 18))}
                          />
                        )}
                      </div>
                    );
                  })}
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
      {openLiquidityModal && !isUndefined(pools[outcomeIndex]) ? (
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

function RewardsDisplay({
  position,
  totalRewardPerDay,
}: {
  position: NftPosition;
  totalRewardPerDay: number;
}) {
  const {
    pool: { tick },
    tickLower: { tickIdx: tickLowerIdx },
    tickUpper: { tickIdx: tickUpperIdx },
  } = position;
  const [currentReward, setCurrentReward] = useState(0);
  const rewardPerDay = (Number(position.liquidity) / Number(position.pool.liquidity)) * totalRewardPerDay;
  const rewardPerSecond = rewardPerDay / (24 * 60 * 60);
  useEffect(() => {
    const now = new Date();
    const currentReward = differenceInSeconds(now, startOfDay(now)) * rewardPerSecond;
    setCurrentReward(currentReward);
    const interval = setInterval(() => {
      setCurrentReward((curr) => curr + rewardPerSecond);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  if (Number(tick) <= Number(tickLowerIdx) || Number(tick) >= Number(tickUpperIdx)) {
    return <p className="text-[12px] text-warning-primary">Position out of range.</p>;
  }
  return (
    <p className="text-[12px]">
      Today's reward: <span className="text-purple-primary font-semibold">{currentReward.toFixed(0)}</span> /{" "}
      <span className="text-purple-primary font-semibold">{rewardPerDay.toFixed(0)}</span> SEER
    </p>
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

  const blockExplorerUrl = SUPPORTED_CHAINS?.[market.chainId]?.blockExplorers?.default?.url;

  const getTooltipContent = (market: Market, outcomeIndex: number) => {
    const [lowerBound, upperBound] = [displayScalarBound(market.lowerBound), displayScalarBound(market.upperBound)];
    if (outcomeIndex === 1) {
      return `Redeem for (sDAI per token):\nAnswer ≥ ${upperBound}: 1\nAnswer within [${lowerBound}-${upperBound}]: (answer-${lowerBound})/(${upperBound}-${lowerBound})\nAnswer ≤ ${lowerBound}: 0`;
    }
    if (outcomeIndex === 0) {
      return `Redeem for (sDAI per token):\nAnswer ≥ ${upperBound}: 0\nAnswer within [${lowerBound}-${upperBound}]: (${upperBound}-answer)/(${upperBound}-${lowerBound})\nAnswer ≤ ${lowerBound}: 1`;
    }
    return "";
  };

  const _isInvalidOutcome = isInvalidOutcome(market, outcomeIndex);

  return (
    <div className="flex items-center space-x-[12px]">
      <div className="flex-shrink-0 max-lg:hidden">
        <OutcomeImage
          image={images?.[outcomeIndex]}
          isInvalidOutcome={_isInvalidOutcome}
          title={market.outcomes[outcomeIndex]}
        />
      </div>
      <div className="space-y-1">
        <div className="text-[16px] flex items-center gap-1">
          <p>
            {market.type === "Generic" && <>#{loopIndex + 1}</>} {market.outcomes[outcomeIndex]}{" "}
            {outcomeIndex <= 1 &&
              getMarketType(market) === MarketTypes.SCALAR &&
              `[${displayScalarBound(market.lowerBound)},${displayScalarBound(market.upperBound)}]`}{" "}
          </p>
          {getMarketType(market) === MarketTypes.SCALAR && outcomeIndex !== market.wrappedTokens.length - 1 && (
            <span className="tooltip">
              <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] !text-left">
                {getTooltipContent(market, outcomeIndex)}
              </p>
              <QuestionIcon fill="#9747FF" />
            </span>
          )}
          {_isInvalidOutcome && (
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
        <div className="text-[12px] flex items-center gap-x-4 gap-y-2 flex-wrap flex-row justify-start">
          <a
            href={blockExplorerUrl && `${blockExplorerUrl}/token/${wrappedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-primary tooltip"
          >
            <p className="tooltiptext">
              View {tokensInfo?.[outcomeIndex]?.symbol} on {SUPPORTED_CHAINS?.[market.chainId]?.name}
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
              to={`/create-market?parentMarket=${market.id}&parentOutcome=${encodeURIComponent(
                market.outcomes[outcomeIndex],
              )}`}
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

function MultiScalarEstimate({
  market,
  odds,
}: {
  market: Market;
  odds: number | null | undefined;
}) {
  if (getMarketType(market) !== MarketTypes.MULTI_SCALAR || !isOdd(odds)) {
    return null;
  }

  const estimate = getMultiScalarEstimate(market, odds!);

  if (estimate === null) {
    return null;
  }

  return (
    <div className="text-[13px] font-normal">
      ~ {estimate.value} {estimate.unit}
    </div>
  );
}

export function Outcomes({ market, images, activeOutcome, onOutcomeChange }: OutcomesProps) {
  const { data: odds = [], isLoading } = useMarketOdds(market, true);
  const { data: pools = [] } = useMarketPools(market);
  const { Modal, openModal, closeModal } = useModal("liquidity-modal");
  const marketStatus = getMarketStatus(market);
  const { data: indexesOrderedByOdds } = useSortedOutcomes(odds, market, marketStatus);
  const {
    Modal: PoolDetailsModal,
    openModal: openPoolDetailsModal,
    closeModal: closePoolDetailsModal,
  } = useModal("pool-details-modal", true);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (indexesOrderedByOdds && !hasInitializedRef.current) {
      const i = indexesOrderedByOdds[0];
      onOutcomeChange(i, false);
      hasInitializedRef.current = true;
    }
  }, [indexesOrderedByOdds, onOutcomeChange]);

  return (
    <div>
      <PoolDetailsModal
        title="Pool details"
        titleClassName="text-[24px] font-semibold text-center"
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
              onClick={(e) => {
                const isClickOnLinkOrButton = (e.target as HTMLElement).closest?.("a, button");
                onOutcomeChange(i, !isClickOnLinkOrButton);
              }}
              className={clsx(
                "card flex-row justify-between p-[12px] lg:p-[24px] shadow-sm cursor-pointer",
                activeOutcome === i || (market.type === "Futarchy" && activeOutcome === i + 2) ? "card-active" : "",
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
                {market.type === "Generic" && (
                  <div className="text-[20px] min-[400px]:text-[24px] font-semibold text-right">
                    {isLoading ? (
                      <Spinner />
                    ) : (
                      <>
                        <DisplayOdds odd={odds[i]} marketType={getMarketType(market)} />
                        {!isInvalidOutcome(market, i) && <MultiScalarEstimate market={market} odds={odds[i]} />}
                      </>
                    )}
                  </div>
                )}

                <input
                  type="radio"
                  name="outcome"
                  className="radio max-lg:hidden"
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
