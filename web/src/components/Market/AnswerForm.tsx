import Button from "@/components/Form/Button";
import Select from "@/components/Form/Select";
import { useArbitrationRequest } from "@/hooks/useArbitrationRequest";
import { useSubmitAnswer } from "@/hooks/useSubmitAnswer";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { answerFormSchema } from "@/lib/hookform-resolvers";
import { Market, MarketStatus, Question } from "@/lib/market";
import {
  ANSWERED_TOO_SOON,
  FormEventOutcomeValue,
  INVALID_RESULT,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  formatOutcome,
  getAnswerTextFromMarket,
  getCurrentBond,
  getRealityLink,
  isScalarBoundInWei,
} from "@/lib/reality";
import { config } from "@/wagmi";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { switchChain } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useForm } from "react-hook-form";
import { formatUnits, hexToNumber, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Alert } from "../Alert";
import Input from "../Form/Input";

interface AnswerFormValues {
  answerType: "multi" | "single" | typeof INVALID_RESULT | typeof ANSWERED_TOO_SOON | "";
  outcome: string | number; // single select
  outcomes: { value: boolean }[]; // multi select
}

interface AnswerFormProps {
  market: Market;
  marketStatus: MarketStatus;
  question: Question;
  closeModal: () => void;
  raiseDispute: () => void;
}

// NOTE about scalarBoundInWei:
// It's a temporary fix for backwards compatibility.
// Some older scalar markets were created using basic units (regular integers),
// while newer markets use wei (1e18) for scalar bounds.
// Going forward, all new scalar markets will use wei format.
function getOutcome(templateId: bigint, values: AnswerFormValues, scalarBoundInWei: boolean) {
  if (values.answerType === INVALID_RESULT || values.answerType === ANSWERED_TOO_SOON) {
    return values.answerType;
  }

  if (Number(templateId) === REALITY_TEMPLATE_UINT) {
    return scalarBoundInWei ? parseEther(String(values.outcome)).toString() : String(values.outcome);
  }

  if (Number(templateId) === REALITY_TEMPLATE_SINGLE_SELECT) {
    return values.outcome;
  }

  // for multi select return the index of the selected values
  return values.outcomes
    .map((outcome, i) => (outcome.value === true ? i : false))
    .filter((v) => v !== false) as number[];
}

function getOutcomesOptions(market: Market, question: Question) {
  let options: { value: FormEventOutcomeValue; text: string }[] = [];

  const outcomes = market.outcomes;

  options = outcomes
    // first map and then filter to keep the index of each outcome as value
    .map((outcome, i) => ({ value: i, text: outcome }));

  if (market.type === "Generic") {
    // the last element is the Invalid Result outcome
    options.pop();
  }

  if (Number(market.templateId) === REALITY_TEMPLATE_SINGLE_SELECT) {
    options = options.filter((_, i) => question.finalize_ts === 0 || i !== hexToNumber(question.best_answer));
  }

  return options;
}

export function AnswerForm({ market, marketStatus, question, closeModal, raiseDispute }: AnswerFormProps) {
  const { address, chainId: connectedChainId, chain } = useAccount();
  const { open } = useWeb3Modal();
  const { data: balance = { value: 0n }, isLoading } = useBalance({ address });
  const currentBond = getCurrentBond(question.bond, question.min_bond, market.chainId);
  const hasEnoughBalance = balance.value > currentBond;

  const { data: arbitrationRequest } = useArbitrationRequest(question.id, market.chainId);

  const useFormReturn = useForm<AnswerFormValues>({
    mode: "all",
    defaultValues: {
      answerType: "",
      outcome: "",
      outcomes: [],
    },
    resolver: valibotResolver(answerFormSchema),
  });

  const {
    register,
    reset,
    formState: { isValid },
    handleSubmit,
    setValue,
  } = useFormReturn;

  const [outcomes, answerType] = useFormReturn.watch(["outcomes", "answerType"]);

  const submitAnswer = useSubmitAnswer((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (values: AnswerFormValues) => {
    await submitAnswer.mutateAsync({
      questionId: question.id,
      outcome: formatOutcome(getOutcome(market.templateId, values, isScalarBoundInWei(market.upperBound))),
      currentBond: currentBond,
      chainId: market.chainId,
    });
    closeModal();
  };

  if (!address) {
    return (
      <>
        <Alert type="error">Connect your wallet to submit an answer.</Alert>
        <div className="space-x-[24px] text-center mt-[24px] flex justify-center">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
          <Button variant="primary" type="button" onClick={async () => open({ view: "Connect" })} text="Connect" />
        </div>
      </>
    );
  }

  if (market.chainId !== connectedChainId) {
    return (
      <>
        <Alert type="info">Switch to {SUPPORTED_CHAINS?.[market.chainId]?.name} to report the answer.</Alert>
        <div className="space-x-[24px] text-center mt-[24px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
          <Button
            variant="primary"
            type="button"
            onClick={async () => await switchChain(config, { chainId: market.chainId })}
            text="Switch network"
          />
        </div>
      </>
    );
  }

  if (question.is_pending_arbitration || arbitrationRequest?.status === 1) {
    return (
      <>
        <Alert type="info">This question is in arbitration process.</Alert>
        <div className="text-center mt-[24px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        </div>
      </>
    );
  }

  if (marketStatus === MarketStatus.NOT_OPEN) {
    return (
      <>
        <Alert type="info">This market is not open yet.</Alert>
        <div className="text-center mt-[24px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        </div>
      </>
    );
  }

  if (marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === MarketStatus.CLOSED) {
    return (
      <>
        <div className="text-base-content text-[16px] space-y-[15px] text-center">
          <div>This market is already resolved.</div>
          <div>
            Final answer:{" "}
            <span className="text-purple-primary font-semibold">{getAnswerTextFromMarket(question, market)}</span>
          </div>
        </div>
        <div className="text-center mt-[24px]">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        </div>
      </>
    );
  }

  const outcomesOptions = getOutcomesOptions(market, question);

  const onMultiSelectClick = (index: number, value: FormEventOutcomeValue) => {
    return () => {
      if (value === INVALID_RESULT || value === ANSWERED_TOO_SOON) {
        // if value is INVALID_RESULT or ANSWERED_TOO_SOON reset the other values
        setValue(
          "outcomes",
          outcomes.map((_, i) => ({ value: index === i })),
        );
      } else {
        // reset INVALID_RESULT and ANSWERED_TOO_SOON
        const invalidResultIndex = outcomesOptions.findIndex((o) => o.value === INVALID_RESULT);
        if (invalidResultIndex > -1) {
          setValue(`outcomes.${invalidResultIndex}.value`, false);
        }
        const answeredTooSoonIndex = outcomesOptions.findIndex((o) => o.value === ANSWERED_TOO_SOON);
        if (answeredTooSoonIndex > -1) {
          setValue(`outcomes.${answeredTooSoonIndex}.value`, false);
        }
      }
    };
  };

  //marketStatus === MarketStatus.OPEN || marketStatus === MarketStatus.ANSWER_NOT_FINAL;
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="text-base-content text-[16px] space-y-[15px] text-center mb-[48px]">
        <div>
          This market is not resolved yet. You can provide an answer to the{" "}
          <a
            className="text-purple-primary"
            href={getRealityLink(market.chainId, question.id)}
            target="_blank"
            rel="noreferrer"
          >
            Reality question
          </a>{" "}
          by depositing a bond of{" "}
          <span className="text-purple-primary font-semibold">
            {formatUnits(currentBond, 18)} {chain?.nativeCurrency?.symbol ?? "Native Tokens"}
          </span>
          .
        </div>
        <div>
          Current answer:{" "}
          <span className="text-purple-primary font-semibold">{getAnswerTextFromMarket(question, market)}</span>
        </div>
      </div>

      {!hasEnoughBalance && !isLoading && (
        <div className="mb-[24px]">
          <Alert type="warning">You don't have enough balance to submit the answer.</Alert>
        </div>
      )}
      <label className="label cursor-pointer justify-start space-x-2">
        <input
          type="radio"
          {...register("answerType")}
          value={Number(market.templateId) === REALITY_TEMPLATE_MULTIPLE_SELECT ? "multi" : "single"}
          className="radio"
        />
        <span className="label-text text-[16px] text-base-content">
          {Number(market.templateId) === REALITY_TEMPLATE_UINT ? "Type an answer" : "Choose an answer"}
        </span>
      </label>
      {(answerType === "single" || answerType === "multi") && (
        <div className="my-[16px] px-[32px]">
          {Number(market.templateId) === REALITY_TEMPLATE_UINT && (
            <div className="space-y-2">
              <Input
                step="any"
                {...register("outcome", {
                  required: "This field is required.",
                  valueAsNumber: true,
                })}
                className="w-full"
                useFormReturn={useFormReturn}
                type="number"
              />
            </div>
          )}

          {Number(market.templateId) === REALITY_TEMPLATE_SINGLE_SELECT && (
            <div className="space-y-2">
              <Select
                options={outcomesOptions}
                {...register("outcome", {
                  required: "This field is required.",
                })}
                className="w-full"
                useFormReturn={useFormReturn}
              />
            </div>
          )}

          {Number(market.templateId) === REALITY_TEMPLATE_MULTIPLE_SELECT && (
            <div className="grid grid-cols-3">
              {outcomesOptions.map((outcome, i) => (
                <div key={outcome.value}>
                  <label className="label cursor-pointer justify-start space-x-2">
                    <input
                      type="checkbox"
                      {...register(`outcomes.${i}.value`)}
                      className="checkbox"
                      onClick={onMultiSelectClick(i, outcome.value)}
                    />
                    <span className="label-text text-[16px] text-base-content">{outcome.text}</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {question.best_answer !== INVALID_RESULT && (
        <label className="label cursor-pointer justify-start space-x-2">
          <input type="radio" {...register("answerType")} value={INVALID_RESULT} className="radio" />
          <span className="label-text text-[16px] text-base-content">Mark this question invalid</span>
        </label>
      )}

      {question.finalize_ts > 0 && question.best_answer !== ANSWERED_TOO_SOON && (
        <label className="label cursor-pointer justify-start space-x-2">
          <input type="radio" {...register("answerType")} value={ANSWERED_TOO_SOON} className="radio" />
          <span className="label-text text-[16px] text-base-content">Mark this question answered too soon</span>
        </label>
      )}

      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        {question.finalize_ts > 0 && (
          <Button variant="primary" type="button" onClick={raiseDispute} text="Raise a Dispute" />
        )}
        <Button
          variant="primary"
          type="submit"
          disabled={!isValid || !hasEnoughBalance || submitAnswer.isPending || !address}
          isLoading={submitAnswer.isPending}
          text="Answer"
        />
      </div>
    </form>
  );
}
