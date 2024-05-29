import { useApproveFarming, useEnterFarming, useExitFarming } from "@/hooks/useFarmingCenter";
import { Market } from "@/hooks/useMarket";
import { useMarketOdds } from "@/hooks/useMarketOdds";
import { PoolIncentive, PoolInfo, useMarketPools, usePoolsDeposits } from "@/hooks/useMarketPools";
import { useTokenBalances } from "@/hooks/useTokenBalance";
import { useTokensInfo } from "@/hooks/useTokenInfo";
import { useWrappedAddresses } from "@/hooks/useWrappedAddresses";
import { SUPPORTED_CHAINS, SupportedChain } from "@/lib/chains";
import { SWAPR_CONFIG } from "@/lib/config";
import { EtherscanIcon, RightArrow } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, isUndefined } from "@/lib/utils";
import { config } from "@/wagmi";
import { getConnectorClient } from "@wagmi/core";
import clsx from "clsx";
import { useState } from "react";
import { Address } from "viem";
import { watchAsset } from "viem/actions";
import { useAccount } from "wagmi";
import { Alert } from "../Alert";
import Button from "../Form/Button";
import { useModal } from "../Modal";

interface PositionsProps {
  chainId: SupportedChain;
  router: Address;
  market: Market;
  images?: string[];
  tradeCallback: (poolIndex: number) => void;
}

function poolRewardsInfo(poolIncentive: PoolIncentive) {
  if (poolIncentive.apr === 0) {
    return `${displayBalance(poolIncentive.reward, 17)} SEER / day`;
  }

  return `${poolIncentive.apr.toFixed(2)}% APR`;
}

function AddLiquidityInfo({
  chainId,
  pools,
  closeModal,
}: { chainId: SupportedChain; pools: PoolInfo[]; closeModal: () => void }) {
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
                <span className="font-semibold">Swapr</span> ~{" "}
                {pool.incentives.length > 0 ? poolRewardsInfo(pool.incentives[0]) : "0 SEER / day"}
              </div>
              <div>
                <a
                  href={`https://v3.swapr.eth.limo/#/add/${pool.token0}/${pool.token1}/enter-amounts`}
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
                        href={`https://v3.swapr.eth.limo/#/farming/farms#${deposit.id}`}
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
        <a href={paths.farmingProgram()} className="text-purple-primary text-[12px]">
          Learn more about the farming program
        </a>
      </div>

      <div className="text-center">
        <Button text="Return" variant="secondary" type="button" onClick={closeModal} />
      </div>
    </div>
  );
}

export function Outcomes({ chainId, router, market, images, tradeCallback }: PositionsProps) {
  const { address } = useAccount();
  const [activeOutcome, setActiveOutcome] = useState(0);
  const { data: wrappedAddresses = [] } = useWrappedAddresses(
    chainId,
    router,
    market.conditionId,
    market.outcomes.length,
  );
  const { data: tokensInfo = [] } = useTokensInfo(wrappedAddresses);
  const { data: balances } = useTokenBalances(address, wrappedAddresses);
  const { data: odds = [] } = useMarketOdds(chainId, router, market.conditionId, market.outcomes.length);
  const { data: pools = [] } = useMarketPools(chainId, wrappedAddresses);
  const [activePool, setActivePool] = useState(0);

  const { Modal, openModal, closeModal } = useModal("liquidity-modal");

  if (wrappedAddresses.length === 0) {
    return null;
  }

  const blockExplorerUrl = SUPPORTED_CHAINS[chainId].blockExplorers?.default?.url;

  const outcomeClick = (i: number) => {
    return () => {
      setActiveOutcome(i);
      tradeCallback(i);
    };
  };

  const addToWallet = (i: number) => {
    return async () => {
      const walletClient = await getConnectorClient(config);
      await watchAsset(walletClient, {
        type: "ERC20",
        options: {
          address: wrappedAddresses[i],
          decimals: 18,
          symbol: market.outcomes[i],
        },
      });
    };
  };

  return (
    <div>
      <div className="font-[16px] font-semibold mb-[24px]">Outcomes</div>
      <div className="space-y-3">
        {wrappedAddresses.map((wrappedAddress, i) => (
          <div
            key={wrappedAddress}
            onClick={outcomeClick(i)}
            className={clsx(
              "bg-white flex justify-between p-[24px] border rounded-[3px] drop-shadow-sm cursor-pointer",
              activeOutcome === i ? "border-[#9747FF]" : "border-[#E5E5E5]",
            )}
          >
            <div className="flex items-center space-x-[12px]">
              <div>
                {images?.[i] ? (
                  <img src={images?.[i]} alt={market.outcomes[i]} className="w-[48px] h-[48px] rounded-full mx-auto" />
                ) : (
                  <div className="w-[48px] h-[48px] rounded-full bg-purple-primary"></div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[16px]">
                  #{i + 1} {market.outcomes[i]}
                </div>
                <div className="text-[12px] text-[#999999] flex items-center space-x-[16px]">
                  {balances && balances[i] > 0n && (
                    <>
                      <div>
                        {displayBalance(balances[i], 18, true)} {tokensInfo?.[i]?.symbol}
                      </div>
                      <button className="text-purple-primary" type="button" onClick={addToWallet(i)}>
                        Add token to wallet
                      </button>
                    </>
                  )}

                  <a
                    href={blockExplorerUrl && `${blockExplorerUrl}/address/${wrappedAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-primary"
                  >
                    <EtherscanIcon width="12" height="12" />
                  </a>

                  {!isUndefined(pools[i]) && pools[i].length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePool(i);
                        openModal();
                      }}
                      className="text-purple-primary"
                    >
                      Add Liquidity
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-10 items-center">
              <div className="text-[24px] font-semibold">{odds?.[i] || 0}%</div>

              <input
                type="radio"
                name="outcome"
                className="radio"
                onChange={outcomeClick(i)}
                checked={activeOutcome === i}
              />
            </div>
          </div>
        ))}
        <Modal
          title="Add Liquidity"
          content={<AddLiquidityInfo chainId={chainId} pools={pools[activePool] || []} closeModal={closeModal} />}
        />
      </div>
    </div>
  );
}
