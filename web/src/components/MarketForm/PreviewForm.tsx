import { marketFactoryAbi } from "@/hooks/contracts/generated";
import { MarketTypes, getOutcomes, useCreateMarket } from "@/hooks/useCreateMarket";
import { Market } from "@/hooks/useMarket";
import { useVerifyMarket } from "@/hooks/useVerifyMarket";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { paths } from "@/lib/paths";
import { localTimeToUtc } from "@/lib/utils";
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
import { MarketHeader } from "../Market/MarketHeader";

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

  const images = getImages(marketTypeValues.marketType, questionValues, outcomesValues);
  const submitToVerification = images !== false;

  const verifyMarket = useVerifyMarket();

  const createMarket = useCreateMarket(async (receipt: TransactionReceipt) => {
    const marketId = parseEventLogs({
      abi: marketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    })?.[0]?.args?.market;

    if (marketId) {
      if (submitToVerification) {
        await verifyMarket.mutateAsync({
          marketId,
          marketImage: images.file.market,
          outcomesImages: images.file.outcomes,
        });
      }

      navigate(paths.market(marketId, chainId));
    }
  });

  const outcomes = outcomesValues.outcomes.map((o) => o.value);

  const openingTime = Math.round(localTimeToUtc(dateValues.openingTime).getTime() / 1000);

  const onSubmit = async () => {
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
    <form onSubmit={onSubmit} className="space-y-5">
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
          isVerified={submitToVerification}
        />
      </DashedBox>

      <ButtonsWrapper goToPrevStep={goToPrevStep} isLoading={createMarket.isPending || verifyMarket.isPending} />
    </form>
  );
}
