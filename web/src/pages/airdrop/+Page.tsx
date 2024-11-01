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
          <p className="text-left leading-6">
            This wallet is not eligible for the US Election airdrop. Only addresses of{" "}
            <a className="font-semibold text-purple-primary" href="https://kleros.io/">
              Kleros
            </a>{" "}
            jurors (as of 2024-10-31) and of people who previously registered in{" "}
            <a className="font-semibold text-purple-primary" href="https://proofofhumanity.id/">
              Proof Of Humanity
            </a>{" "}
            are eligible.
            <br />
            To be eligible for further airdrop, you can look at this{" "}
            <a
              className="font-semibold text-purple-primary"
              href="https://seer-pm.medium.com/announcing-the-seer-initial-airdrop-distribution-58d38e1ec8f9"
            >
              article
            </a>
            .
          </p>
        </Alert>
      </div>
    );
  }
  return (
    <div className="container-fluid py-[24px] lg:py-[65px] space-y-[24px] lg:space-y-[48px]">
      <Breadcrumb links={[{ title: "Airdrop" }]} />
      <Alert type="info" title="Outcome Tokens Airdrop">
        <div className="space-y-2 mt-2">
          <p className="text-left leading-6">
            {isClaimed ? "You've received" : "You'll receive"} tokens representing outcomes in the following markets
            (check the table below).
            <br />
            You should keep tokens of outcomes you believe are underpriced and sell the tokens of outcomes you believe
            are currently overpriced.
            <br />
            In order to be fully eligible for further airdrops, each of the eight markets should have:
            <br />- One token that you completely sold (balance of 0).
            <br />- One token that you completely kept (balance of 1 or greater) until the market resolves.
            <br />
            After the result of those markets become known, you can redeem tokens of correct outcomes for sDAI.
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
