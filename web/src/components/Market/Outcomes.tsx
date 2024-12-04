import { Link } from "@/components/Link";
import { useApproveFarming, useEnterFarming, useExitFarming } from "@/hooks/useFarmingCenter";
import { Market, useMarket } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { PoolIncentive, PoolInfo, useMarketPools, usePoolsDeposits } from "@/hooks/useMarketPools";
import { useModal } from "@/hooks/useModal";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS, SWAPR_CONFIG, getFarmingUrl, getLiquidityUrl } from "@/lib/config";
import { EtherscanIcon, QuestionIcon, RightArrow } from "@/lib/icons";
import { MarketTypes, formatOdds, getMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { toastError } from "@/lib/toastify";
import { displayBalance, isUndefined, toSnakeCase } from "@/lib/utils";
import { config } from "@/wagmi";
import { getConnectorClient } from "@wagmi/core";
import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { RpcError, zeroAddress } from "viem";
import { watchAsset } from "viem/actions";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import { Spinner } from "../Spinner";
import { OutcomeImage } from "./OutcomeImage";

interface PositionsProps {
  market: Market;
  images?: string[];
}

function poolRewardsInfo(poolIncentive: PoolIncentive) {
  if (poolIncentive.apr === 0) {
    return `${displayBalance(poolIncentive.rewardRate * 86400n, 18, true)} SEER / day`;
  }

  return `${poolIncentive.apr.toFixed(2)}% APR`;
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
  const approveFarming = useApproveFarming();

  const depositHandler = (poolInfo: PoolInfo, poolIncentive: PoolIncentive, tokenId: string) => {
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

  const withdrawHandler = (poolInfo: PoolInfo, poolIncentive: PoolIncentive, tokenId: string) => {
    return async () => {
      await exitFarming.mutateAsync({
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

  const approveHandler = (tokenId: string) => {
    return async () => {
      await approveFarming.mutateAsync({
        nonFungiblePositionManager: SWAPR_CONFIG[chainId]?.NON_FUNGIBLE_POSITION_MANAGER!,
        farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
        account: address!,
        tokenId: BigInt(tokenId),
      });
    };
  };

  return (
    <div>
      <Alert type="info" title="Farming Rewards">
        Earn farming rewards (SEER) by providing liquidity to existing markets.
      </Alert>

      <div className="mt-[32px] mb-[24px] font-semibold">Available Pools:</div>

      <div className="space-y-[12px]">
        {pools.map((pool) => (
          <div className="border border-black-medium p-[24px] text-[14px]" key={pool.id}>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold">{pool.dex}</span> ~{" "}
                {pool.incentives.length > 0 ? poolRewardsInfo(pool.incentives[0]) : "0 SEER / day"}
              </div>
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
                        <Button text="Approve" size="small" variant="secondary" onClick={approveHandler(deposit.id)} />
                      )}
                      {deposit.onFarmingCenter &&
                        (deposit.limitFarming === null && deposit.eternalFarming === null ? (
                          <Button
                            text="Deposit"
                            size="small"
                            variant="secondary"
                            onClick={depositHandler(pool, pool.incentives[0], deposit.id)}
                          />
                        ) : (
                          <Button
                            text="Withdraw"
                            size="small"
                            variant="secondary"
                            onClick={withdrawHandler(pool, pool.incentives[0], deposit.id)}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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

export function Outcomes({ market, images }: PositionsProps) {
  const { address } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const outcomeIndexFromSearch = market.outcomes.findIndex(
    (outcome) => toSnakeCase(outcome) === searchParams.get("outcome"),
  );
  const activeOutcome = Math.max(outcomeIndexFromSearch, 0);
  const { data: parentMarket } = useMarket(market.parentMarket, market.chainId);
  const { data: tokensInfo = [] } = useTokensInfo(market.wrappedTokens, market.chainId);
  const { data: balances } = useTokenBalances(address, market.wrappedTokens, market.chainId);
  const { data: odds = [], isLoading: oddsPending } = useMarketOdds(market, true);
  const { data: pools = [] } = useMarketPools(market);
  const { Modal, openModal, closeModal } = useModal("liquidity-modal");
  const blockExplorerUrl = SUPPORTED_CHAINS[market.chainId].blockExplorers?.default?.url;

  const indexesOrderedByOdds = useMemo(() => {
    if (oddsPending || odds.length === 0) {
      return null;
    }
    const oddsAndIndexes = odds.map((odd, i) => ({ odd, i })).sort((a, b) => b.odd - a.odd);
    return oddsAndIndexes.map((obj) => obj.i);
  }, [odds]);

  useEffect(() => {
    if (!searchParams.get("outcome") && indexesOrderedByOdds) {
      const i = indexesOrderedByOdds[0];
      setSearchParams({ outcome: toSnakeCase(market.outcomes[i]) }, { overwriteLastHistoryEntry: true });
    }
  }, [indexesOrderedByOdds]);
  const outcomeClick = (i: number) => {
    return () => {
      setSearchParams(
        { outcome: toSnakeCase(market.outcomes[i]) },
        { overwriteLastHistoryEntry: true, keepScrollPosition: true },
      );
    };
  };

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

  return (
    <div>
      <div className="font-[16px] font-semibold mb-[24px]">Outcomes</div>
      <div className="space-y-3">
        {market.wrappedTokens.map((_, j) => {
          const i = indexesOrderedByOdds ? indexesOrderedByOdds[j] : j;
          const wrappedAddress = market.wrappedTokens[i];
          const isInvalidOutcome = hasInvalidOutcome && i === market.wrappedTokens.length - 1;
          return (
            <div
              key={wrappedAddress}
              onClick={outcomeClick(i)}
              className={clsx(
                "bg-white flex justify-between p-[24px] border rounded-[3px] drop-shadow-sm cursor-pointer",
                activeOutcome === i ? "border-purple-primary" : "border-black-medium",
              )}
            >
              <div className="flex items-center space-x-[12px]">
                <div className="flex-shrink-0">
                  <OutcomeImage image={images?.[i]} isInvalidOutcome={isInvalidOutcome} title={market.outcomes[i]} />
                </div>
                <div className="space-y-1">
                  <div className="text-[16px] flex items-center gap-1">
                    <p>
                      #{j + 1} {market.outcomes[i]}{" "}
                      {i <= 1 &&
                        getMarketType(market) === MarketTypes.SCALAR &&
                        `[${Number(market.lowerBound)},${Number(market.upperBound)}]`}{" "}
                    </p>
                    {getMarketType(market) === MarketTypes.SCALAR && i !== market.wrappedTokens.length - 1 && (
                      <span className="tooltip">
                        <p className="tooltiptext !whitespace-pre-wrap w-[250px] md:w-[400px] !text-left">
                          {getTooltipContent(market, i)}
                        </p>
                        <QuestionIcon fill="#9747FF" />
                      </span>
                    )}
                    {isInvalidOutcome && (
                      <span className="tooltip">
                        <p className="tooltiptext !whitespace-pre-wrap w-[300px]">
                          Invalid outcome tokens can be redeemed for the underlying tokens when the question is resolved
                          to invalid.
                        </p>
                        <QuestionIcon fill="#9747FF" />
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-black-secondary">
                    {balances && balances[i] > 0n && (
                      <div className="w-full">
                        {displayBalance(balances[i], 18, true)} {tokensInfo?.[i]?.symbol}
                      </div>
                    )}
                  </div>
                  <div className="text-[12px] flex items-center gap-x-4 gap-y-2 flex-wrap">
                    {balances && balances[i] > 0n && (
                      <button className="text-purple-primary hover:underline" type="button" onClick={addToWallet(i)}>
                        Add token to wallet
                      </button>
                    )}
                    <a
                      href={blockExplorerUrl && `${blockExplorerUrl}/address/${wrappedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-primary tooltip"
                    >
                      <p className="tooltiptext">
                        View {tokensInfo?.[i]?.symbol} on {SUPPORTED_CHAINS[market.chainId].name}
                      </p>
                      <EtherscanIcon width="12" height="12" />
                    </a>

                    {!isUndefined(pools[i]) && pools[i].length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          openModal();
                        }}
                        className="text-purple-primary hover:underline"
                      >
                        Add Liquidity
                      </button>
                    ) : (
                      <a
                        href={getLiquidityUrl(
                          market.chainId,
                          wrappedAddress,
                          market.parentMarket === zeroAddress
                            ? COLLATERAL_TOKENS[market.chainId].primary.address
                            : (parentMarket?.wrappedTokens[Number(market.parentOutcome)] as string),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-primary flex items-center space-x-2 hover:underline"
                      >
                        <span>Add Liquidity</span>
                      </a>
                    )}

                    {market.type === "Generic" && (
                      <Link
                        to={`/create-market?parentMarket=${market.id}&parentOutcome=${toSnakeCase(market.outcomes[i])}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchParams(
                            (params) => {
                              params.set("outcome", toSnakeCase(market.outcomes[i]));
                              return params;
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
              <div className="flex space-x-10 items-center">
                <div className="text-[24px] font-semibold">
                  {oddsPending ? <Spinner /> : formatOdds(odds?.[i], getMarketType(market))}
                </div>

                <input
                  type="radio"
                  name="outcome"
                  className="radio"
                  onChange={outcomeClick(i)}
                  checked={activeOutcome === i}
                />
              </div>
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
