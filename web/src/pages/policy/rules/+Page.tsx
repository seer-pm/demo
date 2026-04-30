import { Alert } from "@/components/Alert";
import FileViewer from "@/components/FileViewer";
import { useMarketRulesPolicy } from "@/hooks/useMarketRulesPolicy";
import { DEFAULT_CHAIN } from "@/lib/chains";
import type { SupportedChain } from "@seer-pm/sdk";
import { useAccount } from "wagmi";

export default function RulesPolicyPage() {
  const { chainId = DEFAULT_CHAIN, chain } = useAccount();
  const { data: marketRulesPolicy } = useMarketRulesPolicy(chainId as SupportedChain);

  if (!marketRulesPolicy)
    return (
      <Alert className="m-4" type="warning">
        Market Rules Policy not found for {chain?.name ?? `chain ${chainId}`}.
      </Alert>
    );
  return <FileViewer url={marketRulesPolicy} />;
}
