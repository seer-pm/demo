import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useAccount } from "wagmi";
import { Market } from "./useMarket";
import { defaultStatus, useVerificationStatusList } from "./useVerificationStatus";

const statusPriority = {
  verified: 0,
  verifying: 1,
  challenged: 2,
  not_verified: 3,
};

function useDefaultSortMarket(markets: Market[]) {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: verificationStatusResultList } = useVerificationStatusList(chainId as SupportedChain);

  return structuredClone(markets).sort((a, b) => {
    //by verification status
    const verificationStatusA = verificationStatusResultList?.[a.id.toLowerCase()] ?? defaultStatus;
    const verificationStatusB = verificationStatusResultList?.[b.id.toLowerCase()] ?? defaultStatus;
    const statusDiff = statusPriority[verificationStatusA.status] - statusPriority[verificationStatusB.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }

    // by open interest (outcomesSupply)
    return a.outcomesSupply === b.outcomesSupply ? 0 : (b.outcomesSupply ?? 0n) > (a.outcomesSupply ?? 0n) ? 1 : -1;
  });
}

export default useDefaultSortMarket;
