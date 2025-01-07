import FileViewer from "@/components/FileViewer";
import { useMarketRulesPolicy } from "@/hooks/useMarketRulesPolicy";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { useAccount } from "wagmi";

export default function RulesPolicyPage() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: marketRulesPolicy } = useMarketRulesPolicy(chainId as SupportedChain);

  if (!marketRulesPolicy) return null;
  return <FileViewer url={marketRulesPolicy} />;
}
