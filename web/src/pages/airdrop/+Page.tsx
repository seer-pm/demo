import AirdropTable from "@/components/Airdrop/AirdropTable";
import { Alert } from "@/components/Alert";
import Breadcrumb from "@/components/Breadcrumb";
import Button from "@/components/Form/Button";
import { Spinner } from "@/components/Spinner";
import { useClaimAirdrop } from "@/hooks/airdrop/useClaimAirdrop";
import { useEligibleAddressForAirdrop } from "@/hooks/airdrop/useEligibleAddressForAirdrop";
import { useGetClaimStatus } from "@/hooks/airdrop/useGetClaimStatus";
import { useGetListAirdropTokens } from "@/hooks/airdrop/useGetListAirdropTokens";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { queryClient } from "@/lib/query-client";
import { config } from "@/wagmi";
import { switchChain } from "@wagmi/core";
import { gnosis } from "viem/chains";
import { useAccount } from "wagmi";

function AirdropPage() {
  const { address, chainId = DEFAULT_CHAIN } = useAccount();
  const { data: isEligible, isLoading: isLoadingEligible } = useEligibleAddressForAirdrop(
    address,
    chainId as SupportedChain,
  );
  const { data: isClaimed, isLoading: isLoadingClaimStatus } = useGetClaimStatus(address, chainId as SupportedChain);
  const { mutate: claimAirdrop, isPending: isClaiming } = useClaimAirdrop(() => {
    queryClient.invalidateQueries({ queryKey: ["useTokenBalances"] });
    queryClient.invalidateQueries({ queryKey: ["useGetClaimStatus"] });
  });
  const { data: tokens = [], isLoading: isLoadingTokens } = useGetListAirdropTokens(address, chainId as SupportedChain);

  if (chainId !== gnosis.id) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Alert type="warning" title="Not available">
          The current airdrop program is only available on Gnosis.{" "}
          <span
            className="cursor-pointer font-semibold text-purple-primary"
            onClick={() => switchChain(config, { chainId: gnosis.id })}
          >
            Switch to Gnosis
          </span>{" "}
          to check your eligibility.
        </Alert>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Alert type="warning" title="Account not found">
          Connect your wallet to check your airdrop status.
        </Alert>
      </div>
    );
  }
  if (isLoadingEligible) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Spinner />
      </div>
    );
  }
  if (!isEligible) {
    return (
      <div className="container-fluid py-[24px] lg:py-[65px]">
        <Alert type="warning" title="Not eligible">
          This wallet is not eligible for airdrop.
        </Alert>
      </div>
    );
  }
  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <Breadcrumb links={[{ title: "Airdrop" }]} />
      <Alert type="info" title="Outcome Tokens Airdrop">
        <div className="space-y-2 mt-2">
          <p>
            You'll receive tokens representing all outcomes in the incentivized markets (check the table below). We
            recommend keeping only the tokens for your preferred outcome and selling the rest. This way, you'll remain
            eligible for future airdrops.
          </p>
          <div>
            <Button
              type="button"
              isLoading={isLoadingClaimStatus || isClaiming}
              disabled={isClaimed}
              text={isClaimed ? "You've already claimed." : "Claim outcome tokens"}
              onClick={() => claimAirdrop(chainId as SupportedChain)}
            />
          </div>
        </div>
      </Alert>

      <div>
        <p className="font-semibold mb-2">Current airdrop tokens</p>
        {isLoadingTokens && <div className="shimmer-container w-full h-[200px]" />}
        {!isLoadingTokens && <AirdropTable data={tokens} chainId={chainId as SupportedChain} />}
      </div>
    </div>
  );
}

export default AirdropPage;
