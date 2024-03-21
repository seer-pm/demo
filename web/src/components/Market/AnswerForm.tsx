import Button from "@/components/Form/Button";
import Select from "@/components/Form/Select";
import { Market, Question } from "@/hooks/useMarket";
import { MarketStatus } from "@/hooks/useMarketStatus";
import { useSubmitAnswer } from "@/hooks/useSubmitAnswer";
import { SupportedChain } from "@/lib/chains";
import { REALITY_TEMPLATE_UINT, formatOutcome, getAnswerText, getCurrentBond } from "@/lib/reality";
import { displayBalance } from "@/lib/utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useForm } from "react-hook-form";
import { parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Alert } from "../Alert";
import Input from "../Form/Input";

interface AnswerFormValues {
  outcome: string;
}

interface AnswerFormProps {
  market: Market;
  marketStatus: MarketStatus;
  question: Question;
  closeModal: () => void;
  chainId: SupportedChain;
}

export function AnswerForm({ market, marketStatus, question, closeModal, chainId }: AnswerFormProps) {
  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const { data: balance = { value: 0n } } = useBalance({ address });
  const currentBond = getCurrentBond(question.bond, question.min_bond);
  const hasEnoughBalance = balance.value > currentBond;

  const {
    register,
    reset,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<AnswerFormValues>({
    mode: "all",
    defaultValues: {
      outcome: "",
    },
  });

  const submitAnswer = useSubmitAnswer((/*receipt: TransactionReceipt*/) => {
    reset();
  });

  const onSubmit = async (values: AnswerFormValues) => {
    const outcome =
      Number(market.templateId) === REALITY_TEMPLATE_UINT ? parseEther(values.outcome).toString() : values.outcome;

    await submitAnswer.mutateAsync({
      questionId: question.id,
      outcome: formatOutcome(outcome),
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
            errors={errors}
            type="number"
          />
        </div>
      )}

      {Number(market.templateId) !== REALITY_TEMPLATE_UINT && (
        <div className="space-y-2 mt-[32px]">
          <Select
            options={market.outcomes.map((outcome, i) => ({ value: i, text: outcome }))}
            {...register("outcome", {
              required: "This field is required.",
            })}
            className="w-full"
            errors={errors}
          />
        </div>
      )}

      <div className="space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} />
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
