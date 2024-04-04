import { marketFactoryAbi } from "@/hooks/contracts/generated";
import { MarketTypes, getOutcomes, useCreateMarket } from "@/hooks/useCreateMarket";
import { Market } from "@/hooks/useMarket";
import { useSubmissionDeposit } from "@/hooks/useSubmissionDeposit";
import { useVerifyMarket } from "@/hooks/useVerifyMarket";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { CheckCircleIcon } from "@/lib/icons";
import { paths } from "@/lib/paths";
import { displayBalance, isUndefined, localTimeToUtc } from "@/lib/utils";
import { useRef } from "react";
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
import { MarketHeader } from "../Market/MarketHeader";
import { useModal } from "../Modal";

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

function getImages(
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
}: FormStepPreview & FormWithPrevStep) {
  const navigate = useNavigate();

  const checkboxRef = useRef<HTMLInputElement>(null);

  const images = getImages(marketTypeValues.marketType, questionValues, outcomesValues);
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
      if (marketReadyToVerify && checkboxRef.current?.checked) {
        await verifyMarket.mutateAsync({
          marketId,
          marketImage: images.file.market,
          outcomesImages: images.file.outcomes,
          submissionDeposit: submissionDeposit!,
        });
      }

      navigate(paths.market(marketId, chainId));
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
    templateId: 2n,
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
          isVerified={marketReadyToVerify}
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

            {!marketReadyToVerify && (
              <p className="mt-[24px]">To verify the market, you need to add the images in the previous steps.</p>
            )}

            <p className="mt-[24px] mb-[85px] flex space-x-2 justify-center">
              Verified Markets hold a{" "}
              <span className="text-[14px] text-[#00C42B] flex space-x-1 items-center mx-2">
                <CheckCircleIcon /> <span>Verified</span>
              </span>{" "}
              badge.
            </p>

            {marketReadyToVerify && !isUndefined(submissionDeposit) && (
              <div className="text-purple-primary flex items-center justify-center space-x-2">
                <span>Verification cost:</span>{" "}
                <span className="text-[24px] font-semibold">{displayBalance(submissionDeposit, 18)} DAI</span>
              </div>
            )}

            {marketReadyToVerify && (
              <div className="form-control mt-[58px] mb-[32px]">
                <label className="label cursor-pointer justify-center space-x-2">
                  <input type="checkbox" defaultChecked className="checkbox" ref={checkboxRef} />
                  <span className="label-text text-[16px] text-black-primary">Verify it now.</span>
                </label>
              </div>
            )}

            <div className="space-x-[24px]">
              <Button type="button" variant="secondary" text="Return" onClick={goToPrevStep} />
              <Button
                type="button"
                text="Create Market"
                onClick={createMarketHandler}
                isLoading={createMarket.isPending || verifyMarket.isPending}
              />
            </div>
          </div>
        }
      />

      <ButtonsWrapper goToPrevStep={goToPrevStep} isLoading={false} />
    </form>
  );
}
