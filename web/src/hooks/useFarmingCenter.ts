import { SupportedChain } from "@/lib/chains";
import { SWAPR_CONFIG } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { toastifySendCallsTx, toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";
import { Execution } from "./useCheck7702Support";
import { PoolDeposit, PoolIncentive, PoolInfo } from "./useMarketPools";

interface FarmingProps {
  farmingCenter: Address;
  rewardToken: Address;
  bonusRewardToken: Address;
  pool: Address;
  startTime: bigint;
  endTime: bigint;
  tokenId: bigint;
}

interface EnterFarmingProps extends FarmingProps {}

interface ExitFarmingProps extends FarmingProps {
  account: Address;
}

interface DepositNftProps {
  nonFungiblePositionManager: Address;
  farmingCenter: Address;
  account: Address;
  tokenId: bigint;
}

interface WithdrawNftProps {
  farmingCenter: Address;
  account: Address;
  tokenId: bigint;
}

const FARMING_CENTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract IERC20Minimal",
            name: "rewardToken",
            type: "address",
          },
          {
            internalType: "contract IERC20Minimal",
            name: "bonusRewardToken",
            type: "address",
          },
          {
            internalType: "contract IAlgebraPool",
            name: "pool",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
        ],
        internalType: "struct IIncentiveKey.IncentiveKey",
        name: "key",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokensLocked",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isLimit",
        type: "bool",
      },
    ],
    name: "enterFarming",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "contract IERC20Minimal",
            name: "rewardToken",
            type: "address",
          },
          {
            internalType: "contract IERC20Minimal",
            name: "bonusRewardToken",
            type: "address",
          },
          {
            internalType: "contract IAlgebraPool",
            name: "pool",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "startTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "endTime",
            type: "uint256",
          },
        ],
        internalType: "struct IIncentiveKey.IncentiveKey",
        name: "key",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isLimit",
        type: "bool",
      },
    ],
    name: "exitFarming",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "withdrawToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
      },
    ],
    name: "multicall",
    outputs: [
      {
        internalType: "bytes[]",
        name: "results",
        type: "bytes[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Minimal",
        name: "rewardToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountRequestedIncentive",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountRequestedEternal",
        type: "uint256",
      },
    ],
    name: "claimReward",
    outputs: [
      {
        internalType: "uint256",
        name: "reward",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const NON_FUNGIBLE_POSITION_MANAGER_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

function getEnterFarmingParams(props: EnterFarmingProps) {
  const incentiveKey = {
    rewardToken: props.rewardToken,
    bonusRewardToken: props.bonusRewardToken,
    pool: props.pool,
    startTime: props.startTime,
    endTime: props.endTime,
  };

  return {
    to: props.farmingCenter,
    value: 0n,
    data: encodeFunctionData({
      abi: FARMING_CENTER_ABI,
      functionName: "enterFarming",
      args: [incentiveKey, props.tokenId, 0n, false],
    }),
  };
}

async function enterFarming(props: EnterFarmingProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(() => sendTransaction(config, getEnterFarmingParams(props)), {
    txSent: { title: "Enter farming..." },
    txSuccess: { title: "Token entered!" },
  });

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

function getExitFarmingParams(props: ExitFarmingProps) {
  const incentiveKey = {
    rewardToken: props.rewardToken,
    bonusRewardToken: props.bonusRewardToken,
    pool: props.pool,
    startTime: props.startTime,
    endTime: props.endTime,
  };

  const MAX_ETERNAL_AMOUNT = 0xffffffffffffffffffffffffffffffffn;

  const exitFarmingData = encodeFunctionData({
    abi: FARMING_CENTER_ABI,
    functionName: "exitFarming",
    args: [incentiveKey, props.tokenId, false],
  });

  const claimMainRewardData = encodeFunctionData({
    abi: FARMING_CENTER_ABI,
    functionName: "claimReward",
    args: [props.rewardToken, props.account, 0n, MAX_ETERNAL_AMOUNT],
  });

  return {
    to: props.farmingCenter,
    value: 0n,
    data: encodeFunctionData({
      abi: FARMING_CENTER_ABI,
      functionName: "multicall",
      args: [[exitFarmingData, claimMainRewardData]],
    }),
  };
}

async function exitFarming(props: ExitFarmingProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(() => sendTransaction(config, getExitFarmingParams(props)), {
    txSent: { title: "Exit farming and claiming rewards..." },
    txSuccess: { title: "Exited and claimed rewards!" },
  });

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

function getDepositNftParams(props: DepositNftProps) {
  return {
    to: props.nonFungiblePositionManager,
    value: 0n,
    data: encodeFunctionData({
      abi: NON_FUNGIBLE_POSITION_MANAGER_ABI,
      functionName: "safeTransferFrom",
      args: [props.account, props.farmingCenter, props.tokenId],
    }),
  };
}

async function depositNft(props: DepositNftProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(() => sendTransaction(config, getDepositNftParams(props)), {
    txSent: { title: "Depositing token..." },
    txSuccess: { title: "Token deposited!" },
  });

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

function getWithdrawNftParams(props: WithdrawNftProps) {
  return {
    to: props.farmingCenter,
    value: 0n,
    data: encodeFunctionData({
      abi: FARMING_CENTER_ABI,
      functionName: "withdrawToken",
      args: [props.tokenId, props.account, "0x0000000000000000000000000000000000000000000000000000000000000000"],
    }),
  };
}

async function withdrawNft(props: WithdrawNftProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(() => sendTransaction(config, getWithdrawNftParams(props)), {
    txSent: { title: "Withdrawing token..." },
    txSuccess: { title: "Token withdrawn!" },
  });

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

export const useEnterFarming = () => {
  return useMutation({
    mutationFn: enterFarming,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usePoolsDeposits"] });
    },
  });
};

export const useExitFarming = () => {
  return useMutation({
    mutationFn: exitFarming,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usePoolsDeposits"] });
    },
  });
};

export const useDepositNft = () => {
  return useMutation({
    mutationFn: depositNft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usePoolsDeposits"] });
    },
  });
};

export const useWithdrawNft = () => {
  return useMutation({
    mutationFn: withdrawNft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usePoolsDeposits"] });
    },
  });
};

type FarmAction = {
  text: string;
  calls: Execution[];
  sentTitle: string;
  successTitle: string;
};

function getFarmActions(
  chainId: SupportedChain,
  account: Address,
  deposit: PoolDeposit,
  poolInfo: PoolInfo,
  poolIncentive: PoolIncentive,
  tokenId: string,
  isRewardEnded: boolean,
): FarmAction[] {
  const depositNftProps: DepositNftProps = {
    nonFungiblePositionManager: SWAPR_CONFIG[chainId]?.NON_FUNGIBLE_POSITION_MANAGER!,
    farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
    account: account,
    tokenId: BigInt(tokenId),
  };

  const enterFarmingProps: EnterFarmingProps = {
    farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
    rewardToken: poolIncentive.rewardToken,
    bonusRewardToken: poolIncentive.bonusRewardToken,
    pool: poolInfo.id,
    startTime: poolIncentive.startTime,
    endTime: poolIncentive.endTime,
    tokenId: BigInt(tokenId),
  };

  const withdrawNftProps: WithdrawNftProps = {
    farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
    account,
    tokenId: BigInt(tokenId),
  };

  const exitFarmingProps: ExitFarmingProps = {
    account,
    farmingCenter: SWAPR_CONFIG[chainId]?.FARMING_CENTER!,
    rewardToken: poolIncentive.rewardToken,
    bonusRewardToken: poolIncentive.bonusRewardToken,
    pool: poolInfo.id,
    startTime: poolIncentive.startTime,
    endTime: poolIncentive.endTime,
    tokenId: BigInt(tokenId),
  };

  if (!deposit.onFarmingCenter && !isRewardEnded) {
    return [
      {
        text: "Deposit & Enter Farming",
        calls: [getDepositNftParams(depositNftProps), getEnterFarmingParams(enterFarmingProps)],
        sentTitle: "Depositing and entering farming...",
        successTitle: "Successfully deposited and entered farming!",
      },
    ];
  }

  if (deposit.onFarmingCenter && deposit.limitFarming === null && deposit.eternalFarming === null) {
    // withdraw or enter farming
    return [
      {
        text: "Withdraw",
        calls: [getWithdrawNftParams(withdrawNftProps)],
        sentTitle: "Withdrawing NFT...",
        successTitle: "Successfully withdrew NFT!",
      },
      {
        text: "Enter Farming",
        calls: [getEnterFarmingParams(enterFarmingProps)],
        sentTitle: "Entering farming...",
        successTitle: "Successfully entered farming!",
      },
    ];
  }

  return [
    {
      text: "Exit Farming & Withdraw",
      calls: [getExitFarmingParams(exitFarmingProps), getWithdrawNftParams(withdrawNftProps)],
      sentTitle: "Exiting farming and withdrawing...",
      successTitle: "Successfully exited farming and withdrew!",
    },
  ];
}

export const useFarmPosition7702 = (
  chainId: SupportedChain,
  account: Address,
  deposit: PoolDeposit,
  poolInfo: PoolInfo,
  poolIncentive: PoolIncentive,
  tokenId: string,
  isRewardEnded: boolean,
  onSuccess?: () => unknown,
) => {
  const actions = getFarmActions(chainId, account, deposit, poolInfo, poolIncentive, tokenId, isRewardEnded);

  return {
    actions,
    mutation: useMutation({
      mutationFn: async (farmAction: FarmAction) => {
        const result = await toastifySendCallsTx(farmAction.calls, config, {
          txSent: { title: farmAction.sentTitle },
          txSuccess: { title: farmAction.successTitle },
        });

        if (!result.status) {
          throw result.error;
        }

        //delay to update subgraph
        await new Promise((res) => setTimeout(res, 3000));

        return result.receipt;
      },
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ["usePoolsDeposits"] });
        onSuccess?.();
      },
    }),
  };
};
