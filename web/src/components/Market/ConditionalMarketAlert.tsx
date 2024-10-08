import { useMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { Link } from "react-router-dom";
import { Address } from "viem";
import { Alert } from "../Alert";

export function ConditionalMarketAlert({
  parentMarket: parentMarketAddress,
  parentOutcome,
  chainId,
}: {
  parentMarket: Address;
  parentOutcome: bigint;
  chainId: SupportedChain;
}) {
  const { data: parentMarket } = useMarket(parentMarketAddress, chainId);

  if (!parentMarket) {
    return null;
  }

  return (
    <Alert type="info" title="Conditional Market">
      This market is conditional on the resolution of{" "}
      <Link to={paths.market(parentMarket.id, chainId)} target="_blank" className="text-purple-primary font-medium">
        "{parentMarket.marketName}"
      </Link>{" "}
      being{" "}
      <Link
        to={`${paths.market(parentMarket.id, chainId)}?outcome=${parentOutcome}`}
        target="_blank"
        className="text-purple-primary font-medium"
      >
        "{parentMarket.outcomes[Number(parentOutcome)]}"
      </Link>
      . <br />
      If the main market resolves to a different outcome, the tokens of this market will be worthless.
    </Alert>
  );
}
