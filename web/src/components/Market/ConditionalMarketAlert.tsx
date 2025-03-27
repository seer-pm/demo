import { Link } from "@/components/Link";
import { useMarket } from "@/hooks/useMarket";
import { SupportedChain } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { Address, zeroAddress } from "viem";
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

  if (!parentMarket || parentMarketAddress === zeroAddress) {
    return null;
  }
  const parentOutcomeText = parentMarket.outcomes[Number(parentOutcome)];
  return (
    <Alert type="info" title="Conditional Market">
      This market is conditional on the resolution of{" "}
      <Link to={paths.market(parentMarket.id, chainId)} target="_blank" className="text-purple-primary font-medium">
        "{parentMarket.marketName}"
      </Link>{" "}
      being{" "}
      <Link
        to={`${paths.market(parentMarket.id, chainId)}?outcome=${encodeURIComponent(parentOutcomeText)}`}
        target="_blank"
        className="text-purple-primary font-medium"
      >
        "{parentOutcomeText}"
      </Link>
      . <br />
      If the main market resolves to a different outcome, the tokens of this market will be worthless.
    </Alert>
  );
}
