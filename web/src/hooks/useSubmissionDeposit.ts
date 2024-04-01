import { ArbitratorAbi } from "@/abi/ArbitratorAbi";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import {
  readLightGeneralizedTcrArbitrator,
  readLightGeneralizedTcrArbitratorExtraData,
  readLightGeneralizedTcrSubmissionBaseDeposit,
} from "./contracts/generated";

export async function getSubmissionDeposit(): Promise<bigint> {
  const [arbitrator, arbitratorExtraData, submissionBaseDeposit] = await Promise.all([
    await readLightGeneralizedTcrArbitrator(config, {}),
    await readLightGeneralizedTcrArbitratorExtraData(config, {}),
    await readLightGeneralizedTcrSubmissionBaseDeposit(config, {}),
  ]);

  const arbitrationCost = await readContract(config, {
    address: arbitrator,
    abi: ArbitratorAbi,
    functionName: "arbitrationCost",
    args: [arbitratorExtraData],
  });

  return submissionBaseDeposit + arbitrationCost;
}

export const useSubmissionDeposit = () => {
  return useQuery<bigint, Error>({
    queryKey: ["useSubmissionDeposit"],
    queryFn: async () => {
      return getSubmissionDeposit();
    },
  });
};
