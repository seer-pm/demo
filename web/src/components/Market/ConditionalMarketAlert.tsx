import { useMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { Link } from "react-router-dom";
import { Address } from "viem";
import { Alert } from "../Alert";

export function ConditionalMarketAlert({
  parentMarket,
  parentOutcome,
  chainId,
}: { parentMarket: Address; parentOutcome: bigint; chainId: SupportedChain }) {
  const { data: conditionalMarket } = useMarket(parentMarket, chainId);

  if (!conditionalMarket) {
    return null;
  }

  return (
    <Alert type="info" title="Conditional Market">
      This market is conditional on the resolution of{" "}
      <Link
        to={paths.market(conditionalMarket.id, chainId)}
        target="_blank"
        className="text-purple-primary font-medium"
      >
        "{conditionalMarket.marketName}"
      </Link>{" "}
      being <span className="font-medium">"{conditionalMarket.outcomes[Number(parentOutcome)]}"</span>. <br />
      If the main market resolves to a different outcome, the tokens of this market will be worthless.
    </Alert>
  );
}
