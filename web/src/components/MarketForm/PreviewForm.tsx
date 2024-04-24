import { marketFactoryAbi } from "@/hooks/contracts/generated";
import { getOutcomes, useCreateMarket } from "@/hooks/useCreateMarket";
import { Market } from "@/hooks/useMarket";
import { useSubmissionDeposit } from "@/hooks/useSubmissionDeposit";
import { useVerifyMarket } from "@/hooks/useVerifyMarket";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { CheckCircleIcon } from "@/lib/icons";
import { MarketTypes, getTemplateByMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { displayBalance, isUndefined, localTimeToUtc } from "@/lib/utils";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { TransactionReceipt } from "viem";
import { parseEventLogs } from "viem/utils";
import {
  ButtonsWrapper,
  DateFormValues,
  FormWithPrevStep,
  MarketTypeFormValues,
  OutcomesFormValues,
  QuestionFormValues,
} from ".";
import { Alert } from "../Alert";
import { DashedBox } from "../DashedBox";
import Button from "../Form/Button";
import Toggle from "../Form/Toggle";
import { MarketHeader } from "../Market/MarketHeader";
import { useModal } from "../Modal";
import { VerificationForm } from "./VerificationForm";

type FormStepPreview = {
  marketTypeValues: MarketTypeFormValues;
  questionValues: QuestionFormValues;
  outcomesValues: OutcomesFormValues;
  dateValues: DateFormValues;
  chainId: SupportedChain;
};

interface GetImagesReturn {
  url: {
    market: string;
    outcomes: string[];
  };
  file: {
    market: File;
    outcomes: File[];
  };
}

export function getImagesForVerification(
  marketType: MarketTypes,
  questionValues: QuestionFormValues,
  outcomesValues: OutcomesFormValues,
): GetImagesReturn | false {
  if (!questionValues.image) {
    return false;
  }

  let outcomesFiles: File[] = [];

  if (marketType === MarketTypes.SCALAR) {
    // there are no images for outcomes in scalar markets
  } else {
    // CATEGORICAL & MULTI_SCALAR
    const allOutcomesWithImages = outcomesValues.outcomes.every((o) => o.image instanceof File);

    if (!allOutcomesWithImages) {
      return false;
    }

    outcomesFiles = outcomesValues.outcomes.map((i) => i.image as File);
  }

  return {
    url: {
      market: URL.createObjectURL(questionValues.image),
      outcomes: outcomesFiles.map((f) => URL.createObjectURL(f)),
    },
    file: {
      market: questionValues.image,
      outcomes: outcomesFiles,
    },
  };
}

export function PreviewForm({
  marketTypeValues,
  questionValues,
  outcomesValues,
  dateValues,
  goToPrevStep,
  chainId,
  useQuestionFormReturn,
  useOutcomesFormReturn,
}: FormStepPreview &
  FormWithPrevStep & {
    useQuestionFormReturn: UseFormReturn<QuestionFormValues>;
    useOutcomesFormReturn: UseFormReturn<OutcomesFormValues>;
  }) {
  const [verifyNow, setVerifyNow] = useState(false);
  const [newMarketId, setNewMarketId] = useState<`0x${string}` | "">("");
  const navigate = useNavigate();

  const images = getImagesForVerification(marketTypeValues.marketType, questionValues, outcomesValues);
  const marketReadyToVerify = images !== false;

  const verifyMarket = useVerifyMarket();

  const { data: submissionDeposit } = useSubmissionDeposit();

  const { Modal, openModal } = useModal("answer-modal");

  const createMarket = useCreateMarket(async (receipt: TransactionReceipt) => {
    const marketId = parseEventLogs({
      abi: marketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    })?.[0]?.args?.market;

    if (marketId) {
      setNewMarketId(marketId);
      if (marketReadyToVerify && verifyNow) {
        // nothing to do here
      } else {
        navigate(paths.market(marketId, chainId));
      }
    }
  });

  const outcomes = outcomesValues.outcomes.map((o) => o.value);

  const openingTime = Math.round(localTimeToUtc(dateValues.openingTime).getTime() / 1000);

  const createMarketHandler = async () => {
    await createMarket.mutateAsync({
      marketType: marketTypeValues.marketType,
      marketName: questionValues.market,
      outcomes: outcomes,
      tokenNames: outcomesValues.outcomes.map((o) => o.token),
      outcomesQuestion: outcomesValues.outcomesQuestion,
      lowerBound: outcomesValues.lowerBound,
      upperBound: outcomesValues.upperBound,
      unit: outcomesValues.unit,
      category: questionValues.category,
      openingTime,
      chainId,
    });
  };

  const verifyMarketHandler = async () => {
    if (marketReadyToVerify && verifyNow && newMarketId !== "") {
      await verifyMarket.mutateAsync({
        marketId: newMarketId,
        marketImage: images.file.market,
        outcomesImages: images.file.outcomes,
        submissionDeposit: submissionDeposit!,
      });
      navigate(paths.market(newMarketId, chainId));
    }
  };

  const dummyMarket: Market = {
    id: "0x000",
    marketName: questionValues.market,
    outcomes: getOutcomes(
      outcomes,
      outcomesValues.lowerBound,
      outcomesValues.upperBound,
      outcomesValues.unit,
      marketTypeValues.marketType,
    ),
    outcomesSupply: 0n,
    conditionId: "0x000",
    questionId: "0x000",
    templateId: BigInt(getTemplateByMarketType(marketTypeValues.marketType)),
    lowerBound: BigInt(outcomesValues.lowerBound),
    upperBound: BigInt(outcomesValues.upperBound),
    payoutReported: true,
    questions: [...Array(marketTypeValues.marketType === MarketTypes.MULTI_SCALAR ? outcomes.length : 1).keys()].map(
      (_) => ({
        id: "0x000",
        arbitrator: "0x000",
        opening_ts: openingTime,
        timeout: 129600,
        finalize_ts: 0,
        is_pending_arbitration: false,
        best_answer: "0x0000000000000000000000000000000000000000000000000000000000000000",
        bond: 0n,
        min_bond: 100000000000000000n,
      }),
    ),
  };

  return (
    <form onSubmit={openModal} className="space-y-5">
      {(createMarket.isError || verifyMarket.isError) && (
        <Alert type="error" className="mb-5">
          There was an error while submitting the transaction.
        </Alert>
      )}

      <DashedBox className="max-w-[644px] p-[32px] mx-auto">
        <MarketHeader
          market={dummyMarket}
          images={images === false ? undefined : images.url}
          chainId={DEFAULT_CHAIN}
          isPreview={true}
          isVerified={marketReadyToVerify && verifyNow}
        />
      </DashedBox>

      <Modal
        title="Create Market"
        content={
          <div className="text-black-secondary text-center">
            <p>
              When creating a market you are able to verify it by adding the market to the Curate List of Verified
              Markets. It provides extra credibility to the market being created.{" "}
              {/*In case you prefer you can verify it
              later.*/}
            </p>

            <p className="my-[24px] flex space-x-2 justify-center">
              Verified Markets hold a{" "}
              <span className="text-[14px] text-[#00C42B] flex space-x-1 items-center mx-2">
                <CheckCircleIcon /> <span>Verified</span>
              </span>{" "}
              badge.
            </p>

            <div className="border border-black-medium flex justify-between items-center py-[10px] px-[30px] my-[24px]">
              <div className="text-[16px] font-semibold text-black-primary">Verify it Now</div>
              <Toggle
                onChange={(event) => setVerifyNow(event.target.checked)}
                name="verify-now"
                value="1"
                checked={verifyNow}
              />
            </div>

            {verifyNow && !marketReadyToVerify && (
              <>
                <div className="text-[14px] text-purple-primary text-left mb-[16px]">Pending images:</div>
                <div className="text-[14px] text-left">
                  Verification requires the question and outcome images. Please, upload an 1:1 aspect ratio image with
                  transparent background, in SVG, or PNG for each field below.
                </div>

                <VerificationForm
                  useQuestionFormReturn={useQuestionFormReturn}
                  useOutcomesFormReturn={useOutcomesFormReturn}
                  showOnlyMissingImages={true}
                />
              </>
            )}

            {marketReadyToVerify && verifyNow && !isUndefined(submissionDeposit) && (
              <div className="text-purple-primary flex items-center justify-center space-x-2 my-[24px]">
                <span>Verification deposit:</span>{" "}
                <span className="text-[24px] font-semibold">{displayBalance(submissionDeposit, 18)} DAI</span>
              </div>
            )}

            <div className="space-x-[12px]">
              <Button type="button" variant="secondary" text="Return" onClick={goToPrevStep} />
              <Button
                type="button"
                text="Create Market"
                onClick={createMarketHandler}
                disabled={(verifyNow && !marketReadyToVerify) || newMarketId !== ""}
                isLoading={createMarket.isPending}
              />
              {verifyNow && (
                <Button
                  type="button"
                  text="Verify Market"
                  onClick={verifyMarketHandler}
                  disabled={!newMarketId}
                  isLoading={verifyMarket.isPending}
                />
              )}
            </div>
          </div>
        }
      />

      <ButtonsWrapper goToPrevStep={goToPrevStep} isLoading={false} />
    </form>
  );
}
