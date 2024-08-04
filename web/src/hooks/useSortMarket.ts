import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { bigIntMax } from "@/lib/utils";
import { useAccount } from "wagmi";
import { Market } from "./useMarket";
import { useAllOutcomePools } from "./useMarketPools";
import { defaultStatus, useVerificationStatusList } from "./useVerificationStatus";

const statusPriority = {
  verified: 0,
  verifying: 1,
  not_verified: 2,
};

function useSortMarket(markets: Market[]) {
  const { address: currentUserAddress, chainId = DEFAULT_CHAIN } = useAccount();
  const { data: pools = [] } = useAllOutcomePools(chainId as SupportedChain);
  const { data: verificationStatusResultList } = useVerificationStatusList(chainId as SupportedChain);
  const outcomeLiquidityMapping = pools.reduce(
    (obj, item) => {
      const outcomeTokenId = item.token0.symbol === "sDAI" ? item.token1.id : item.token0.id;
      obj[outcomeTokenId.toLowerCase()] = BigInt(item.liquidity);
      return obj;
    },
    {} as { [key: string]: bigint },
  );
  return markets.sort(
    (
      a: Market & {
        creator?: string | null;
        outcomeAddresses?: `0x${string}`[];
      },
      b: Market & {
        creator?: string | null;
        outcomeAddresses?: `0x${string}`[];
      },
    ) => {
      // markets created by current user will show first
      const isACurrentUser = a.creator?.toLowerCase() === currentUserAddress?.toLowerCase();
      const isBCurrentUser = b.creator?.toLowerCase() === currentUserAddress?.toLowerCase();

      // If one is created by current user and the other isn't, prioritize the current user's item
      if (isACurrentUser && !isBCurrentUser) return -1;
      if (!isACurrentUser && isBCurrentUser) return 1;

      //by verification status
      const verificationStatusA = verificationStatusResultList?.[a.id.toLowerCase()] ?? defaultStatus;
      const verificationStatusB = verificationStatusResultList?.[b.id.toLowerCase()] ?? defaultStatus;
      const statusDiff = statusPriority[verificationStatusA.status] - statusPriority[verificationStatusB.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      // by liquidity
      const marketALiquidity = bigIntMax(
        ...(a.outcomeAddresses?.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? []),
      );
      const marketBLiquidity = bigIntMax(
        ...(b.outcomeAddresses?.map((address) => outcomeLiquidityMapping[address.toLowerCase()]) ?? []),
      );
      return marketALiquidity === marketBLiquidity ? 0 : marketBLiquidity > marketALiquidity ? 1 : -1;
    },
  );
}

export default useSortMarket;
