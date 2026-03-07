import FileViewer from "@/components/FileViewer";
import { useMarketRulesPolicy } from "@/hooks/useMarketRulesPolicy";
import { DEFAULT_CHAIN } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { useAccount } from "wagmi";

export default function RulesPolicyPage() {
  const { chainId = DEFAULT_CHAIN } = useAccount();
  const { data: marketRulesPolicy } = useMarketRulesPolicy(chainId as SupportedChain);

  if (!marketRulesPolicy) return null;
  return <FileViewer url={marketRulesPolicy} />;
}
