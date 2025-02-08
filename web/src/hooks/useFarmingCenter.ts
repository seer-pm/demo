import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { Address, TransactionReceipt, encodeFunctionData } from "viem";

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

async function enterFarming(props: EnterFarmingProps): Promise<TransactionReceipt> {
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
    { txSent: { title: "Enter farming..." }, txSuccess: { title: "Token entered!" } },
  );

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

async function exitFarming(props: ExitFarmingProps): Promise<TransactionReceipt> {
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

  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.farmingCenter,
        abi: FARMING_CENTER_ABI,
        functionName: "multicall",
        args: [[exitFarmingData, claimMainRewardData]],
      }),
    { txSent: { title: "Exit farming and claiming rewards..." }, txSuccess: { title: "Exited and claimed rewards!" } },
  );

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

async function depositNft(props: DepositNftProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.nonFungiblePositionManager,
        abi: NON_FUNGIBLE_POSITION_MANAGER_ABI,
        functionName: "safeTransferFrom",
        args: [props.account, props.farmingCenter, props.tokenId],
      }),
    { txSent: { title: "Depositing token..." }, txSuccess: { title: "Token deposited!" } },
  );

  if (!result.status) {
    throw result.error;
  }
  //delay to update subgraph
  await new Promise((res) => setTimeout(res, 3000));
  return result.receipt;
}

async function withdrawNft(props: WithdrawNftProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeContract(config, {
        address: props.farmingCenter,
        abi: FARMING_CENTER_ABI,
        functionName: "withdrawToken",
        args: [props.tokenId, props.account, "0x0000000000000000000000000000000000000000000000000000000000000000"],
      }),
    { txSent: { title: "Withdrawing token..." }, txSuccess: { title: "Token withdrawn!" } },
  );

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
