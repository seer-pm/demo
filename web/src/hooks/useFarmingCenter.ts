import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt } from "viem";

interface FarmingProps {
  farmingCenter: Address;
  rewardToken: Address;
  bonusRewardToken: Address;
  pool: Address;
  startTime: bigint;
  endTime: bigint;
  tokenId: bigint;
}

interface ApproveFarmingProps {
  nonFungiblePositionManager: Address;
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

async function enterFarming(props: FarmingProps): Promise<TransactionReceipt> {
  const incentiveKey = {
    rewardToken: props.rewardToken,
    bonusRewardToken: props.bonusRewardToken,
    pool: props.pool,
    startTime: props.startTime,
    endTime: props.endTime,
  };

  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.farmingCenter,
        abi: FARMING_CENTER_ABI,
        functionName: "enterFarming",
        args: [incentiveKey, props.tokenId, 0n, false],
      }),
    { txSent: { title: "Depositing tokens..." }, txSuccess: { title: "Tokens deposited!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

async function exitFarming(props: FarmingProps): Promise<TransactionReceipt> {
  const incentiveKey = {
    rewardToken: props.rewardToken,
    bonusRewardToken: props.bonusRewardToken,
    pool: props.pool,
    startTime: props.startTime,
    endTime: props.endTime,
  };

  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.farmingCenter,
        abi: FARMING_CENTER_ABI,
        functionName: "exitFarming",
        args: [incentiveKey, props.tokenId, false],
      }),
    { txSent: { title: "Withdrawing token..." }, txSuccess: { title: "Token withdrawn!" } },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

async function approveFarming(props: ApproveFarmingProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.nonFungiblePositionManager,
        abi: NON_FUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "safeTransferFrom",
        args: [props.account, props.farmingCenter, props.tokenId],
      }),
    { txSent: { title: "Approving token..." }, txSuccess: { title: "Token approved!" } },
  );

  if (!result.status) {
    throw result.error;
  }

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

export const useApproveFarming = () => {
  return useMutation({
    mutationFn: approveFarming,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usePoolsDeposits"] });
    },
  });
};
