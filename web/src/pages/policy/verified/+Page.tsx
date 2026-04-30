import { Alert } from "@/components/Alert";
import FileViewer from "@/components/FileViewer";
import { useVerifiedMarketPolicy } from "@/hooks/useVerifiedMarketPolicy";
import { DEFAULT_CHAIN } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { useAccount } from "wagmi";

export default function Page() {
  const { chainId = DEFAULT_CHAIN, chain } = useAccount();
  const { data: verifiedMarketPolicy } = useVerifiedMarketPolicy(chainId as SupportedChain);

  if (!verifiedMarketPolicy) {
    return (
      <Alert className="m-4" type="warning">
        Verified Market Policy not found for {chain?.name ?? `chain ${chainId}`}.
      </Alert>
    );
  }

  return <FileViewer url={verifiedMarketPolicy} />;
}
