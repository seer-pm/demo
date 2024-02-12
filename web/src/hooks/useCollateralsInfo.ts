import { getConfigAddress } from "@/lib/config";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { readContracts } from "@wagmi/core";
import { Address, erc20Abi, zeroAddress } from "viem";
import { useMarketFactory } from "./useMarketFactory";

interface CollateralData {
  address: Address;
  symbol: string;
  decimals: number;
}

export async function fetchERC20Info(token: Address) {
  const result = await readContracts(config, {
    contracts: [
      {
        abi: erc20Abi,
        address: token!,
        functionName: "symbol",
      },
      {
        abi: erc20Abi,
        address: token!,
        functionName: "decimals",
      },
    ],
    allowFailure: false,
  });

  return {
    address: token,
    symbol: result[0],
    decimals: result[1],
  };
}

export const useCollateralsInfo = (chainId: number | undefined) => {
  const { data: marketFactory } = useMarketFactory(chainId);
  return useQuery<CollateralData[] | undefined, Error>({
    enabled: !!marketFactory,
    queryKey: ["useCollateralsInfo", chainId],
    queryFn: async () => {
      const collaterals: CollateralData[] = [await fetchERC20Info(marketFactory!.collateralToken)];

      const altCollateralAddress = getConfigAddress("ALT_COLLATERAL", chainId);
      const altCollateralEnabled = altCollateralAddress !== zeroAddress;

      if (altCollateralEnabled) {
        collaterals.push(await fetchERC20Info(altCollateralAddress));
      }

      return collaterals;
    },
  });
};
