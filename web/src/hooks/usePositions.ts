import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, stringToHex } from "viem";
import { ConditionalTokensAbi } from "../abi/ConditionalTokensAbi";
import { generateBasicPartition, getPositionId } from "../lib/conditional-tokens";
import { config } from "../wagmi";

export type Position = { positionId: bigint; balance: bigint };

export const usePositions = (
  address?: Address,
  conditionId?: `0x${string}`,
  conditionalTokens?: Address,
  collateralToken?: Address,
  outcomeSlotCount?: number,
) => {
  return useQuery<Position[] | undefined, Error>({
    enabled: !!address && !!conditionId && !!conditionalTokens && !!collateralToken && !!outcomeSlotCount,
    queryKey: ["usePositions", address, conditionId, conditionalTokens, collateralToken, outcomeSlotCount],
    queryFn: async () => {
      const conditionalTokensContract = {
        abi: ConditionalTokensAbi,
        address: conditionalTokens!,
      } as const;

      const partitions = generateBasicPartition(outcomeSlotCount!);

      const results = await readContracts(config, {
        contracts: partitions.map(
          (indexSet) =>
            ({
              ...conditionalTokensContract,
              functionName: "getCollectionId",
              args: [stringToHex("", { size: 32 }), conditionId, BigInt(indexSet)],
            }) as const,
        ),
        allowFailure: false,
      });

      const positionIds = results.map((result) => getPositionId(collateralToken!, result));

      const balances = await readContracts(config, {
        contracts: positionIds.map((positionId) => ({
          ...conditionalTokensContract,
          functionName: "balanceOf",
          args: [address, positionId],
        })),
        allowFailure: false,
      });

      return positionIds.map((positionId, i) => ({
        positionId,
        balance: balances[i],
      }));
    },
  });
};
