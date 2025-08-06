import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import { OutcomesFormValues, getImagesForVerification } from "@/components/MarketForm";
import { ModalContentSucessMessage } from "@/components/MarketForm/PreviewForm";
import { VerificationForm } from "@/components/MarketForm/VerificationForm";
import { Spinner } from "@/components/Spinner";
import { useMarket } from "@/hooks/useMarket";
import { useModal } from "@/hooks/useModal";
import { useSubmissionDeposit } from "@/hooks/useSubmissionDeposit";
import { useVerifyMarket } from "@/hooks/useVerifyMarket";
import { SupportedChain } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { queryClient } from "@/lib/query-client";
import { displayBalance, isUndefined } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Address } from "viem";
import { gnosis } from "viem/chains";
import { usePageContext } from "vike-react/usePageContext";
import { navigate } from "vike/client/router";
import { useAccount } from "wagmi";

function MarkeVerifyPage() {
  const { routeParams } = usePageContext();
  const id = routeParams.id as Address;
  const chainId = Number(routeParams.chainId) as SupportedChain;
  const { chain, address: currentUserAddress } = useAccount();
  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);
  const { data: submissionDeposit } = useSubmissionDeposit();
  const { Modal, openModal } = useModal("verification-modal");
  const [hideForm, setHideForm] = useState(false);
  const verifyMarket = useVerifyMarket(() => {
    setHideForm(true);
    openModal();
  });

  const useOutcomesFormReturn = useForm<OutcomesFormValues>({
    mode: "all",
    defaultValues: {
      outcomes: [],
      lowerBound: { value: 0, token: "" },
      upperBound: { value: 0, token: "" },
      unit: "",
    },
  });

  const { remove: removeOutcomes, append: appendOutcome } = useFieldArray({
    control: useOutcomesFormReturn.control,
    name: "outcomes",
  });

  useEffect(() => {
    removeOutcomes();

    if (market) {
      for (let i = 0; i < market.outcomes.length; i++) {
        const outcome = market.outcomes[i];
        // skip INVALID_RESULT
        if (market.type === "Generic" && i === market.outcomes.length - 1) {
          break;
        }
        appendOutcome({ value: outcome, token: "", image: "" });
      }
    }
  }, [market]);

  if (import.meta.env.VITE_VERIFICATION_DISABLED === "true") {
    return (
      <div className="py-10 px-10">
        <Alert type="error" className="mb-5">
          Market verifications are temporarily disabled. Please try again later.
        </Alert>
      </div>
    );
  }

  if (isMarketError) {
    return (
      <div className="py-10 px-10">
        <Alert type="error" className="mb-5">
          Market not found
        </Alert>
      </div>
    );
  }

  if (isMarketPending || !market) {
    return (
      <div className="py-10 px-10">
        <Spinner />
      </div>
    );
  }

  const outcomesValues = useOutcomesFormReturn.watch();

  const images = getImagesForVerification(outcomesValues);
  const marketReadyToVerify = images !== false;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    images !== false &&
      (await verifyMarket.mutateAsync({
        marketId: market.id,
        marketImage: images.file.market,
        outcomesImages: images.file.outcomes,
        submissionDeposit: submissionDeposit!,
      }));
  };

  return (
    <div className="container-fluid w-[924px] py-[65px] text-center">
      {!chain && <Alert type="warning">Connect your wallet to a supported network.</Alert>}

      {(market.verification?.status === "verifying" || market.verification?.status === "verified") && (
        <Alert type="success" title="This market has already been submitted for verification" className="mb-[24px]">
          You can check the submission on the{" "}
          <a
            href={paths.curateVerifiedList(chainId, market.verification.itemID)}
            className="text-purple-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Curate List of Verified Markets
          </a>
        </Alert>
      )}

      <Modal
        title="Submitted for verification!"
        content={
          <div className="text-black-secondary text-center">
            <ModalContentSucessMessage isVerified={true} chainId={chainId} />

            <div className="space-x-[12px]">
              <Button
                type="button"
                text="Go to Market"
                onClick={() => {
                  navigate(paths.market(id, chainId));
                  queryClient.invalidateQueries({ queryKey: ["useMarketImages", id, chainId, currentUserAddress] });
                }}
              />
            </div>
          </div>
        }
      />

      {!hideForm && chain && (
        <form onSubmit={onSubmit}>
          <div className="text-[16px] text-purple-primary mb-[24px]">
            Verify Market: <span className="font-semibold">{market.marketName}</span>
          </div>

          <div className="text-[14px] text-left text-black-secondary">
            Verification requires the question and outcome images. Please upload a 1:1 aspect ratio PNG or JPEG image
            for each field below. If there is a background, it should be transparent.
          </div>

          <VerificationForm useOutcomesFormReturn={useOutcomesFormReturn} showOnlyMissingImages={false} />

          {marketReadyToVerify && !isUndefined(submissionDeposit) && (
            <div className="text-purple-primary flex items-center justify-center space-x-2 my-[24px]">
              <span>Verification deposit:</span>{" "}
              <span className="text-[24px] font-semibold">
                {displayBalance(submissionDeposit, 18)} {chainId === gnosis.id ? "xDAI" : "DAI"}
              </span>
            </div>
          )}

          <div className="space-x-[24px]">
            <Button
              type="submit"
              text="Verify Market"
              className="whitespace-nowrap"
              disabled={!marketReadyToVerify || verifyMarket.isPending}
              isLoading={verifyMarket.isPending}
            />
          </div>
        </form>
      )}
    </div>
  );
}

export default MarkeVerifyPage;
