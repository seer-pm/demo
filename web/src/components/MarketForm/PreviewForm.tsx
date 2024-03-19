import { marketFactoryAbi } from "@/hooks/contracts/generated";
import { MarketTypes, getOutcomes, useCreateMarket } from "@/hooks/useCreateMarket";
import { Market } from "@/hooks/useMarket";
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
import { MarketHeader } from "../Market/MarketHeader";

type FormStepPreview = {
  marketTypeValues: MarketTypeFormValues;
  questionValues: QuestionFormValues;
  outcomesValues: OutcomesFormValues;
  dateValues: DateFormValues;
  chainId: SupportedChain;
};

export function PreviewForm({
  marketTypeValues,
  questionValues,
  outcomesValues,
  dateValues,
  goToPrevStep,
  chainId,
}: FormStepPreview & FormWithPrevStep) {
  const navigate = useNavigate();

  const createMarket = useCreateMarket((receipt: TransactionReceipt) => {
    const marketId = parseEventLogs({
      abi: marketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    })?.[0]?.args?.market;

    if (marketId) {
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
    conditionId: "0x000",
    questionId: "0x000",
    templateId: 2n,
    lowerBound: BigInt(outcomesValues.lowerBound),
    upperBound: BigInt(outcomesValues.upperBound),
    payoutReported: true,
    questions: [...Array(marketTypeValues.marketType === MarketTypes.MULTI_SCALAR ? outcomes.length : 1).keys()].map(
      (_) => ({
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

  const svg = `data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='3' ry='3' stroke='%239747FF' stroke-width='2' stroke-dasharray='15%2c 10' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e`;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {createMarket.isError && (
        <Alert type="error" className="mb-5">
          There was an error while submitting the transaction.
        </Alert>
      )}

      <div
        className="max-w-[644px] bg-purple-medium p-[32px] rounded-[3px] mx-auto"
        style={{ backgroundImage: `url("${svg}")` }}
      >
        <MarketHeader market={dummyMarket} chainId={DEFAULT_CHAIN} showOutcomes={true} />
      </div>

      <ButtonsWrapper goToPrevStep={goToPrevStep} isLoading={createMarket.isPending} />
    </form>
  );
}
