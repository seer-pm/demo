import { Alert } from "@/components/Alert";
import Button from "@/components/Form/Button";
import { OutcomesFormValues, QuestionFormValues } from "@/components/MarketForm";
import { ModalContentSucessMessage, getImagesForVerification } from "@/components/MarketForm/PreviewForm";
import { VerificationForm } from "@/components/MarketForm/VerificationForm";
import { useModal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { useMarket } from "@/hooks/useMarket";
import { useSubmissionDeposit } from "@/hooks/useSubmissionDeposit";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { useVerifyMarket } from "@/hooks/useVerifyMarket";
import { SupportedChain } from "@/lib/chains";
import { getMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { displayBalance, isUndefined } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Address } from "viem";
import { useAccount } from "wagmi";

function MarkeVerifyPage() {
  const params = useParams();
  const id = params.id as Address;
  const chainId = Number(params.chainId) as SupportedChain;
  const navigate = useNavigate();
  const { chain } = useAccount();
  const { data: market, isError: isMarketError, isPending: isMarketPending } = useMarket(id as Address, chainId);
  const { data: verificationStatusResult } = useVerificationStatus(id as Address, chainId);
  const { data: submissionDeposit } = useSubmissionDeposit();
  const { Modal, openModal } = useModal("verification-modal");
  const [hideForm, setHideForm] = useState(false);
  const verifyMarket = useVerifyMarket(() => {
    setHideForm(true);
    openModal();
  });

  const useQuestionFormReturn = useForm<QuestionFormValues>({
    mode: "all",
    defaultValues: {
      market: "",
      category: "",
    },
  });

  const useOutcomesFormReturn = useForm<OutcomesFormValues>({
    mode: "all",
    defaultValues: {
      outcomes: [],
      outcomesQuestion: "",
      lowerBound: 0,
      upperBound: 0,
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
      for (const outcome of market.outcomes) {
        appendOutcome({ value: outcome, token: "", image: "" });
      }
    }
  }, [market]);

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

  const questionValues = useQuestionFormReturn.watch();
  const outcomesValues = useOutcomesFormReturn.watch();

  const images = getImagesForVerification(getMarketType(market), questionValues, outcomesValues);
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

      {(verificationStatusResult?.status === "verifying" || verificationStatusResult?.status === "verified") && (
        <Alert type="success" title="This market has already been submitted for verification" className="mb-[24px]">
          You can check the submission on the{" "}
          <a
            href={paths.curateVerifiedList(chainId, verificationStatusResult.itemID)}
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
              <Button type="button" text="Go to Market" onClick={() => navigate(paths.market(id, chainId))} />
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
            Verification requires the question and outcome images. Please, upload an 1:1 aspect ratio image with
            transparent background, in SVG, or PNG for each field below.
          </div>

          <VerificationForm
            useQuestionFormReturn={useQuestionFormReturn}
            useOutcomesFormReturn={useOutcomesFormReturn}
            showOnlyMissingImages={false}
          />

          {marketReadyToVerify && !isUndefined(submissionDeposit) && (
            <div className="text-purple-primary flex items-center justify-center space-x-2 my-[24px]">
              <span>Verification deposit:</span>{" "}
              <span className="text-[24px] font-semibold">{displayBalance(submissionDeposit, 18)} DAI</span>
            </div>
          )}

          <div className="space-x-[24px]">
            <Button
              type="submit"
              text="Verify Market"
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
