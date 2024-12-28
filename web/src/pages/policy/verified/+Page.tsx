import { useVerifiedMarketPolicy } from "@/hooks/useVerifiedMarketPolicy";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useAccount } from "wagmi";
import FileViewer from "@/components/FileViewer";

export default function Page() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: verifiedMarketPolicy } = useVerifiedMarketPolicy(chainId as SupportedChain);

  if (!verifiedMarketPolicy) {
    return null;
  }

  return <FileViewer url={verifiedMarketPolicy} />;
}
