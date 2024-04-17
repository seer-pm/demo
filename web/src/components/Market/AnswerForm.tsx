import Button from "@/components/Form/Button";
import Select from "@/components/Form/Select";
import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useSubmitAnswer } from "@/hooks/useSubmitAnswer";
import { SupportedChain } from "@/lib/chains";
import {
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  formatOutcome,
  getAnswerText,
  getCurrentBond,
} from "@/lib/reality";
import { displayBalance, isUndefined } from "@/lib/utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useForm } from "react-hook-form";
import { parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Alert } from "../Alert";
import Input from "../Form/Input";

interface AnswerFormValues {
  outcome: string; // single select
  outcomes: { value: boolean }[]; // multi select
}

interface AnswerFormProps {
  market: Market;
  marketStatus: MarketStatus;
  question: Question;
  closeModal: () => void;
  raiseDispute: () => void;
  chainId: SupportedChain;
}

function getOutcome(templateId: bigint, values: AnswerFormValues) {
  if (Number(templateId) === REALITY_TEMPLATE_UINT) {
    return parseEther(values.outcome).toString();
  }

  if (Number(templateId) === REALITY_TEMPLATE_SINGLE_SELECT) {
    return values.outcome;
  }

  // for multi select return the index of the selected values
  return values.outcomes
    .map((outcome, i) => (outcome.value === true ? i : false))
    .filter((v) => v !== false) as number[];
}

export function AnswerForm({ market, marketStatus, question, closeModal, raiseDispute, chainId }: AnswerFormProps) {
  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const { data: balance = { value: 0n } } = useBalance({ address });
  const currentBond = getCurrentBond(question.bond, question.min_bond);
  const hasEnoughBalance = balance.value > currentBond;

  const useFormReturn = useForm<AnswerFormValues>({
    mode: "all",
    defaultValues: {
      outcome: "",
      outcomes: [],
    },
  });

  const {
    register,
    reset,
    formState: { isValid: isFormStateValid },
    handleSubmit,
  } = useFormReturn;

  const outcomes = useFormReturn.watch("outcomes");
  const isValid =
    Number(market.templateId) === REALITY_TEMPLATE_MULTIPLE_SELECT
      ? !isUndefined(outcomes.find((o) => o.value === true))
      : isFormStateValid;

  const submitAnswer = useSubmitAnswer((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (values: AnswerFormValues) => {
    await submitAnswer.mutateAsync({
      questionId: question.id,
      outcome: formatOutcome(getOutcome(market.templateId, values)),
      currentBond: currentBond,
      chainId: chainId! as SupportedChain,
    });

    closeModal();
  };

  if (!address) {
    return (
      <>
        <Alert type="error">Connect your wallet to submit an answer.</Alert>;
        <div className="space-x-[24px] text-center">
          <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
          <Button variant="primary" type="button" onClick={async () => open({ view: "Connect" })} text="Connect" />
        </div>
      </>
    );
  }

  if (question.is_pending_arbitration) {
    return <Alert type="info">This question is in arbitration process.</Alert>;
  }

  if (marketStatus === MarketStatus.NOT_OPEN) {
    return <Alert type="info">This market is not open yet.</Alert>;
  }

  if (marketStatus === MarketStatus.PENDING_EXECUTION || marketStatus === MarketStatus.CLOSED) {
    return (
      <div className="text-black-secondary text-[16px] space-y-[15px] text-center">
        <div>This market is already resolved.</div>
        <div>
          Final answer:{" "}
          <span className="text-purple-primary font-semibold">
            {getAnswerText(question, market.outcomes, market.templateId)}
          </span>
        </div>
      </div>
    );
  }

  //marketStatus === MarketStatus.OPEN || marketStatus === MarketStatus.ANSWER_NOT_FINAL;
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="text-black-secondary text-[16px] space-y-[15px] text-center mb-[48px]">
        <div>
          This market is not resolved yet. You can provide an answer below, depositing a bond of{" "}
          <span className="text-purple-primary font-semibold">{displayBalance(currentBond, 18)} DAI</span>.
        </div>
        <div>
          Current answer:{" "}
          <span className="text-purple-primary font-semibold">
            {getAnswerText(question, market.outcomes, market.templateId)}
          </span>
        </div>
      </div>

      {!hasEnoughBalance && <Alert type="warning">You don't have enough balance to submit the answer.</Alert>}

      {Number(market.templateId) === REALITY_TEMPLATE_UINT && (
        <div className="space-y-2 mt-[32px]">
          <Input
            {...register("outcome", {
              required: "This field is required.",
            })}
            className="w-full"
            useFormReturn={useFormReturn}
            type="number"
          />
        </div>
      )}

      {Number(market.templateId) === REALITY_TEMPLATE_SINGLE_SELECT && (
        <div className="space-y-2 mt-[32px]">
          <Select
            options={market.outcomes.map((outcome, i) => ({ value: i, text: outcome }))}
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
          {market.outcomes.map((outcome, i) => (
            <div key={`${outcome}_${i}`}>
              <label className="label cursor-pointer justify-start space-x-2">
                <input type="checkbox" {...register(`outcomes.${i}.value`)} className="checkbox" />
                <span className="label-text text-[16px] text-black-primary">{outcome}</span>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
        {question.finalize_ts > 0 && (
          <Button variant="primary" type="button" onClick={raiseDispute} text="Raise a Dispute" />
        )}
        <Button
          variant="primary"
          type="submit"
          disabled={!isValid || !hasEnoughBalance || submitAnswer.isPending || !address || !chainId}
          isLoading={submitAnswer.isPending}
          text="Answer"
        />
      </div>
    </form>
  );
}
