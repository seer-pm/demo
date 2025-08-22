import { useCheck7702Support } from "@/hooks/useCheck7702Support";
import {
  useDepositNft,
  useEnterFarming,
  useExitFarming,
  useFarmPosition7702,
  useWithdrawNft,
} from "@/hooks/useFarmingCenter";
import { PoolDeposit, PoolIncentive, PoolInfo } from "@/hooks/useMarketPools";
import { SupportedChain } from "@/lib/chains";
import { SWAPR_CONFIG } from "@/lib/config";
import { Address } from "viem";
import Button from "../Form/Button";

interface FarmingActionsProps {
  account: Address;
  chainId: SupportedChain;
  deposit: PoolDeposit;
  pool: PoolInfo;
  isRewardEnded: boolean;
}

export function FarmingActions(props: FarmingActionsProps) {
  const supports7702 = useCheck7702Support();
  // don't show the farming component if no incentives
  if (props.pool.incentives.length === 0) {
    return null;
  }
  const FarmingComponent = supports7702 ? FarmingActions7702 : FarmingActionsLegacy;
  return <FarmingComponent {...props} />;
}

export function FarmingActions7702({ account, chainId, deposit, pool, isRewardEnded }: FarmingActionsProps) {
  const { actions, mutation } = useFarmPosition7702(
    chainId,
    account,
    deposit,
    pool,
    pool.incentives[0],
    deposit.id,
    isRewardEnded,
  );
  if (!actions.length && isRewardEnded) {
    return <p>Incentive program has ended</p>;
  }
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      {actions.map((action) => {
        if (action.text === "Enter Farming") {
          return (
            <div className="tooltip">
              <Button
                text={action.text}
                key={action.text}
                size="small"
                variant="secondary"
                onClick={() => {
                  mutation.mutateAsync(action);
                }}
                disabled={mutation.isPending || isRewardEnded}
              />
              {isRewardEnded && <p className="tooltiptext min-w-[220px]">Incentive program has ended</p>}
            </div>
          );
        }
        return (
          <Button
            text={action.text}
            key={action.text}
            size="small"
            variant="secondary"
            onClick={() => {
              mutation.mutateAsync(action);
            }}
            disabled={mutation.isPending}
          />
        );
      })}
    </div>
  );
}

export function FarmingActionsLegacy({ account, chainId, deposit, pool, isRewardEnded }: FarmingActionsProps) {
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
        account: account!,
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
        account: account!,
        tokenId: BigInt(tokenId),
      });
    };
  };

  const withdrawHandler = (tokenId: string) => {
    return async () => {
      await withdrawNft.mutateAsync({
        farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
        account: account!,
        tokenId: BigInt(tokenId),
      });
    };
  };
  const isLoading = enterFarming.isPending || exitFarming.isPending || depositNft.isPending || withdrawNft.isPending;
  if (!deposit.onFarmingCenter && !isRewardEnded) {
    return (
      <Button
        text="Deposit NFT"
        size="small"
        variant="secondary"
        onClick={depositHandler(deposit.id)}
        disabled={isLoading}
      />
    );
  }

  if (deposit.onFarmingCenter) {
    if (deposit.limitFarming === null && deposit.eternalFarming === null) {
      return (
        <div className="flex items-center gap-2 flex-wrap justify-end">
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
            {isRewardEnded && <p className="tooltiptext min-w-[220px]">Incentive program has ended</p>}
          </div>
        </div>
      );
    }
    return (
      <Button
        text="Exit Farming"
        size="small"
        variant="secondary"
        onClick={exitFarmingHandler(pool, pool.incentives[0], deposit.id)}
        disabled={isLoading}
      />
    );
  }
  return <>{isRewardEnded && <p>Incentive program has ended</p>}</>;
}
