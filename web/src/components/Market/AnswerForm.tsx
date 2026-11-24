import Button from "@/components/Form/Button";
import Select from "@/components/Form/Select";
import { useArbitrationRequest } from "@/hooks/useArbitrationRequest";
import { useGlobalState } from "@/hooks/useGlobalState";
import { useSignIn } from "@/hooks/useSignIn";
import { useSubmitAnswer } from "@/hooks/useSubmitAnswer";
import { SUPPORTED_CHAINS } from "@/lib/chains";
import { getConfigNumber } from "@/lib/config";
import { answerFormSchema } from "@/lib/hookform-resolvers";
import { queryClient } from "@/lib/query-client";
import { REALITY_EVIDENCE_LIMIT, findRealityAnswer, realityEvidencePath } from "@/lib/reality-evidence";
import { toastError } from "@/lib/toastify";
import { isAccessTokenExpired } from "@/lib/utils";
import { config } from "@/wagmi";
import { valibotResolver } from "@hookform/resolvers/valibot";
import {
  FormEventOutcomeValue,
  Market,
  MarketStatus,
  Question,
  formatOutcome,
  getAnswerTextFromMarket,
  getCurrentBond,
  getRealityLink,
} from "@seer-pm/sdk";
import {
  ANSWERED_TOO_SOON,
  INVALID_RESULT,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  isScalarBoundInWei,
} from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { getPublicClient, getTransactionReceipt, switchChain } from "@wagmi/core";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type Address,
  type Hex,
  type TransactionReceipt,
  formatUnits,
  hexToNumber,
  isAddressEqual,
  parseEther,
} from "viem";
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

type PendingEvidence = {
  transactionHash: Hex;
  answer: Hex;
  author: Address;
  body: string;
  confirmed: boolean;
};

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
  const currentBond = getCurrentBond(question.bond, question.min_bond, getConfigNumber("MIN_BOND", market.chainId));
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
    formState: { isValid, isSubmitting },
    handleSubmit,
    setValue,
  } = useFormReturn;

  const [outcomes, answerType] = useFormReturn.watch(["outcomes", "answerType"]);

  const submitAnswer = useSubmitAnswer();
  const signIn = useSignIn();
  const [evidence, setEvidence] = useState("");
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence>();

  /** Saves the note, prompting for Seer sign-in if the current session cannot authorize it. */
  async function saveConfirmedEvidence(pending: PendingEvidence) {
    if (!address || !isAddressEqual(address, pending.author) || connectedChainId !== market.chainId) {
      throw new Error("Connect the wallet and network that submitted the answer to save evidence.");
    }

    const url = realityEvidencePath(market.chainId, question.id);
    const body = JSON.stringify({
      transactionHash: pending.transactionHash,
      answer: pending.answer,
      body: pending.body,
    });
    /** Sends the evidence with the current Seer session. */
    const send = (token: string) =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

    const token = useGlobalState.getState().accessToken;
    let response = isAccessTokenExpired(token) ? undefined : await send(token);
    if (!response || response.status === 401 || response.status === 403) {
      const session = await signIn.mutateAsync({
        address: pending.author,
        chainId: market.chainId,
      });
      response = await send(session.token);
    }
    if (!response.ok) throw new Error("Couldn’t save evidence.");

    void queryClient.invalidateQueries({
      queryKey: ["realityAnswerHistory", market.chainId, question.id],
    });
    closeModal();
  }

  /** Saves evidence only when the receipt contains the exact answer submitted by this wallet. */
  async function finishEvidence(receipt: TransactionReceipt, pending: PendingEvidence) {
    if (!findRealityAnswer(receipt, market.chainId, question.id, pending.answer, pending.author)) {
      setPendingEvidence(undefined);
      toastError({
        title: "The transaction did not submit this Reality answer.",
      });
      return;
    }
    const confirmed = {
      ...pending,
      confirmed: true,
      transactionHash: receipt.transactionHash,
    };
    setPendingEvidence(confirmed);
    await saveConfirmedEvidence(confirmed);
  }

  /** Checks an unconfirmed transaction or retries only the evidence write after confirmation. */
  async function retryEvidence(pending: PendingEvidence) {
    if (pending.confirmed) return saveConfirmedEvidence(pending);
    const client = getPublicClient(config, { chainId: market.chainId });
    if (!client) throw new Error("The answer network is unavailable.");
    const receipt = await client.waitForTransactionReceipt({
      hash: pending.transactionHash,
      timeout: 8_000,
    });
    if (receipt.status === "success") void queryClient.invalidateQueries({ queryKey: ["useMarket"] });
    return finishEvidence(receipt, pending);
  }

  const retry = useMutation({ mutationFn: retryEvidence });

  /** Reports the answer and saves optional context after the Reality transaction confirms. */
  async function onSubmit(values: AnswerFormValues) {
    if (!address || pendingEvidence) return;
    const answer = formatOutcome(getOutcome(market.templateId, values, isScalarBoundInWei(market.upperBound)));
    const body = evidence.trim();
    let transactionHash: Hex | undefined;
    let receipt: TransactionReceipt | undefined;
    try {
      receipt = await submitAnswer.mutateAsync({
        questionId: question.id,
        outcome: answer,
        currentBond,
        chainId: market.chainId,
        onTransactionHash: body
          ? (hash) => {
              transactionHash = hash;
            }
          : undefined,
      });
      if (!body) return closeModal();
    } catch {
      if (!transactionHash) return;
      receipt = await getTransactionReceipt(config, {
        hash: transactionHash,
        chainId: market.chainId,
      }).catch(() => undefined);
      if (receipt?.status === "success") void queryClient.invalidateQueries({ queryKey: ["useMarket"] });
    }

    const hash = receipt?.transactionHash ?? transactionHash;
    if (!hash) return;
    const pending = {
      transactionHash: hash,
      answer,
      author: address,
      body,
      confirmed: false,
    };
    if (!receipt) setPendingEvidence(pending);
    else await finishEvidence(receipt, pending).catch(() => undefined);
  }

  if (pendingEvidence) {
    const busy = isSubmitting || retry.isPending;
    const canSave = address && isAddressEqual(address, pendingEvidence.author) && connectedChainId === market.chainId;
    return (
      <div className="space-y-4">
        <Alert type="info">
          {pendingEvidence.confirmed
            ? busy
              ? "Answer submitted. Saving evidence…"
              : "Answer submitted. Evidence couldn’t be saved."
            : "Waiting for Reality to confirm your answer."}
        </Alert>
        {pendingEvidence.confirmed && !canSave && <p>Connect the wallet and network that submitted the answer.</p>}
        {retry.isError && !pendingEvidence.confirmed && <p>The transaction couldn’t be confirmed yet.</p>}
        <div className="flex flex-wrap justify-center gap-4">
          <Button type="button" variant="secondary" text="Close without saving" onClick={closeModal} disabled={busy} />
          <Button
            type="button"
            variant="primary"
            text={pendingEvidence.confirmed ? "Retry saving evidence" : "Check transaction"}
            disabled={busy || (pendingEvidence.confirmed && !canSave)}
            isLoading={busy}
            onClick={() => retry.mutate(pendingEvidence)}
          />
        </div>
      </div>
    );
  }

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

  const lockEvidenceDraft = isSubmitting && evidence.trim().length > 0;

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
            <div className="flex flex-wrap max-h-[400px] overflow-y-auto">
              {outcomesOptions.map((outcome, i) => (
                <div key={outcome.value} className="basis-[calc(50%-0.5rem)] flex-grow">
                  <label className="label cursor-pointer justify-start space-x-2">
                    <input
                      type="checkbox"
                      {...register(`outcomes.${i}.value`)}
                      className="checkbox shrink-0"
                      onClick={onMultiSelectClick(i, outcome.value)}
                    />
                    <span className="label-text text-[16px] text-base-content break-words">{outcome.text}</span>
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

      <label className="mt-4 block">
        <span className="mb-2 block">Evidence or context (optional)</span>
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Explain your answer or paste source links"
          maxLength={REALITY_EVIDENCE_LIMIT}
          rows={3}
          value={evidence}
          disabled={isSubmitting}
          onChange={(event) => setEvidence(event.target.value)}
        />
        <span className="text-sm">Evidence is public and may require a wallet sign-in.</span>
      </label>
      <div className="flex justify-center space-x-[24px] text-center mt-[32px]">
        <Button type="button" variant="secondary" text="Return" onClick={closeModal} disabled={lockEvidenceDraft} />
        {question.finalize_ts > 0 && (
          <Button
            variant="primary"
            type="button"
            onClick={raiseDispute}
            text="Raise a Dispute"
            disabled={lockEvidenceDraft}
          />
        )}
        <Button
          variant="primary"
          type="submit"
          disabled={!isValid || !hasEnoughBalance || isSubmitting || !address}
          isLoading={isSubmitting}
          text="Answer"
        />
      </div>
    </form>
  );
}
