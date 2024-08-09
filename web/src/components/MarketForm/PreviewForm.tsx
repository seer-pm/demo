import { marketFactoryAbi } from "@/hooks/contracts/generated";
import { getOutcomes, useCreateMarket } from "@/hooks/useCreateMarket";
import { useGlobalState } from "@/hooks/useGlobalState";
import { Market } from "@/hooks/useMarket";
import { useSubmissionDeposit } from "@/hooks/useSubmissionDeposit";
import { useVerifyMarket } from "@/hooks/useVerifyMarket";
import { DEFAULT_CHAIN, SupportedChain } from "@/lib/chains";
import { CheckCircleIcon, PolicyIcon } from "@/lib/icons";
import { MarketTypes, getTemplateByMarketType } from "@/lib/market";
import { paths } from "@/lib/paths";
import { displayBalance, isUndefined, localTimeToUtc } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Address, TransactionReceipt } from "viem";
import { parseEventLogs } from "viem/utils";
import { useAccount } from "wagmi";
import {
  ButtonsWrapper,
  DateFormValues,
  FormWithPrevStep,
  MISC_CATEGORY,
  MarketTypeFormValues,
  OutcomesFormValues,
  getImagesForVerification,
  getQuestionParts,
} from ".";
import { Alert } from "../Alert";
import { DashedBox } from "../DashedBox";
import Button from "../Form/Button";
import Toggle from "../Form/Toggle";
import { MarketHeader } from "../Market/Header/MarketHeader";
import { useModal } from "../Modal";
import { VerificationForm } from "./VerificationForm";

type FormStepPreview = {
  marketTypeValues: MarketTypeFormValues;
  outcomesValues: OutcomesFormValues;
  dateValues: DateFormValues;
  chainId: SupportedChain;
};

interface PreviewButtonProps {
  chainId: SupportedChain;
  areFormsValid: boolean;
  createMarketHandler: () => void;
  createMarketIsPending: boolean;
  verifyMarketHandler: () => void;
  verifyMarketIsPending: boolean;
  verifyMarketIsSuccess: boolean;
  verifyNow: boolean;
  marketReadyToVerify: boolean;
  newMarketId: Address | "";
}

function PreviewButton({
  chainId,
  areFormsValid,
  createMarketHandler,
  createMarketIsPending,
  verifyMarketHandler,
  verifyMarketIsPending,
  verifyMarketIsSuccess,
  verifyNow,
  marketReadyToVerify,
  newMarketId,
}: PreviewButtonProps) {
  const navigate = useNavigate();

  if (newMarketId === "") {
    const text = `${createMarketIsPending ? "Creating Market" : "Create Market"} ${verifyNow ? "1/2" : ""}`;
    return (
      <Button
        type="button"
        text={text}
        onClick={createMarketHandler}
        disabled={!areFormsValid || (verifyNow && !marketReadyToVerify)}
        isLoading={createMarketIsPending}
      />
    );
  }

  if (verifyNow && !verifyMarketIsSuccess) {
    return (
      <Button
        type="button"
        text={verifyMarketIsPending ? "Verifying Market 2/2" : "Verify Market 2/2"}
        onClick={verifyMarketHandler}
        disabled={!newMarketId}
        isLoading={verifyMarketIsPending}
      />
    );
  }

  return <Button type="button" text="Go to Market" onClick={() => navigate(paths.market(newMarketId, chainId))} />;
}

function getModalTitle(newMarketId: Address | "", verifyNow: boolean, verifyMarketIsPending: boolean) {
  if (newMarketId === "") {
    return "Create Market";
  }

  if (!verifyNow) {
    return "Success!<br />Market Created!";
  }

  return verifyMarketIsPending ? "Create Market" : "Success!<br />Market Created and Submitted for verification!";
}

export function ModalContentSucessMessage({ isVerified, chainId }: { isVerified: boolean; chainId: SupportedChain }) {
  return (
    <div className="text-center mb-[32px]">
      <div className="text-success-primary my-[50px]">
        <CheckCircleIcon width="160" height="160" className="mx-auto" />
      </div>

      <div className="text-[16px]">
        {isVerified ? (
          <a
            href={paths.curateVerifiedList(chainId)}
            className="text-purple-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open the Curate List of Verified Markets
          </a>
        ) : (
          <span className="text-black-secondary">
            You can verify it later by clicking on Verify on the market card.
          </span>
        )}
      </div>
    </div>
  );
}

interface ModalContentCreateMarketProps {
  verifyNow: boolean;
  setVerifyNow: (verifyNow: boolean) => void;
  marketReadyToVerify: boolean;
  submissionDeposit: bigint | undefined;
  useOutcomesFormReturn: UseFormReturn<OutcomesFormValues>;
}

function ModalContentCreateMarket({
  verifyNow,
  setVerifyNow,
  marketReadyToVerify,
  submissionDeposit,
  useOutcomesFormReturn,
}: ModalContentCreateMarketProps) {
  return (
    <>
      <p>
        When creating a market you are able to verify it by adding the market to the Curate List of Verified Markets. It
        provides extra credibility to the market being created.{" "}
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

      {verifyNow && (
        <div className="mt-[16px] mb-[16px] px-[20px] space-y-[8px] text-left text-[14px]">
          <div>Before verifying it make sure you read and understand the policies.</div>
          <div className="flex space-x-[24px] items-center">
            <div className="flex space-x-2 items-center">
              <PolicyIcon />{" "}
              <a href={paths.verifiedMarketPolicy()} className="text-purple-primary">
                Verified Market Policy
              </a>
            </div>
            <div className="flex space-x-2 items-center">
              <PolicyIcon />{" "}
              <a href={paths.marketRulesPolicy()} className="text-purple-primary">
                Market Rules Policy
              </a>
            </div>
          </div>
        </div>
      )}

      {verifyNow && (
        <div className="px-[20px]">
          <div className="text-[14px] text-purple-primary text-left mb-[16px]">Pending images:</div>
          <div className="text-[14px] text-left">
            Verification requires the question and outcome images. Please, upload an 1:1 aspect ratio image with
            transparent background, in SVG, or PNG for each field below.
          </div>

          <VerificationForm useOutcomesFormReturn={useOutcomesFormReturn} showOnlyMissingImages={false} />
        </div>
      )}

      {marketReadyToVerify && verifyNow && !isUndefined(submissionDeposit) && (
        <div className="text-purple-primary flex items-center justify-center space-x-2 my-[24px]">
          <span>Verification deposit:</span>{" "}
          <span className="text-[24px] font-semibold">{displayBalance(submissionDeposit, 18)} DAI</span>
        </div>
      )}
    </>
  );
}

export function PreviewForm({
  marketTypeValues,
  outcomesValues,
  dateValues,
  goToPrevStep,
  chainId,
  useOutcomesFormReturn,
}: FormStepPreview &
  FormWithPrevStep & {
    useOutcomesFormReturn: UseFormReturn<OutcomesFormValues>;
  }) {
  const { address = "" } = useAccount();
  const [verifyNow, setVerifyNow] = useState(false);
  const [newMarketId, setNewMarketId] = useState<Address | "">("");

  const images = getImagesForVerification(marketTypeValues.marketType, outcomesValues);
  const marketReadyToVerify = images !== false;

  useEffect(() => {
    if (marketReadyToVerify) {
      setVerifyNow(true);
    }
  }, []);

  const verifyMarket = useVerifyMarket();

  const { data: submissionDeposit } = useSubmissionDeposit();

  const { Modal, openModal } = useModal("answer-modal");
  const { toggleFavorite } = useGlobalState();

  const createMarket = useCreateMarket(async (receipt: TransactionReceipt) => {
    const marketId = parseEventLogs({
      abi: marketFactoryAbi,
      eventName: "NewMarket",
      logs: receipt.logs,
    })?.[0]?.args?.market;

    if (marketId) {
      setNewMarketId(marketId);
      toggleFavorite(address, marketId);
    }
  });

  const outcomes = outcomesValues.outcomes.map((o) => o.value);

  const openingTime = Math.round(localTimeToUtc(dateValues.openingTime).getTime() / 1000);

  const createMarketHandler = async () => {
    const questionParts = getQuestionParts(outcomesValues.market, marketTypeValues.marketType);
    await createMarket.mutateAsync({
      marketType: marketTypeValues.marketType,
      marketName: outcomesValues.market,
      outcomes: outcomes,
      tokenNames: outcomesValues.outcomes.map((o) => o.token),
      questionStart: questionParts?.questionStart || "",
      questionEnd: questionParts?.questionEnd || "",
      outcomeType: `[${questionParts?.outcomeType ?? ""}]`,
      lowerBound: outcomesValues.lowerBound,
      upperBound: outcomesValues.upperBound,
      unit: outcomesValues.unit,
      category: MISC_CATEGORY,
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
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openModal();
  };

  const dummyMarket: Market = {
    id: "0x000",
    marketName: outcomesValues.market,
    outcomes: getOutcomes(
      outcomes,
      outcomesValues.lowerBound,
      outcomesValues.upperBound,
      marketTypeValues.marketType,
    ).concat("Invalid result"),
    wrappedTokens: ["0x000", "0x000"],
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
    encodedQuestions: [
      ...Array(marketTypeValues.marketType === MarketTypes.MULTI_SCALAR ? outcomes.length : 1).keys(),
    ].map((_) => ""),
  };

  const showSuccessMessage = newMarketId !== "" && (!verifyNow || verifyMarket.isSuccess);

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
          verificationStatusResult={marketReadyToVerify && verifyNow ? { status: "verified" } : undefined}
        />
      </DashedBox>

      <Modal
        title={getModalTitle(newMarketId, verifyNow, verifyMarket.isPending)}
        content={
          <div className="text-black-secondary text-center">
            {showSuccessMessage ? (
              <ModalContentSucessMessage isVerified={verifyNow} chainId={chainId} />
            ) : (
              <ModalContentCreateMarket
                verifyNow={verifyNow}
                setVerifyNow={setVerifyNow}
                marketReadyToVerify={marketReadyToVerify}
                submissionDeposit={submissionDeposit}
                useOutcomesFormReturn={useOutcomesFormReturn}
              />
            )}

            <div className="flex justify-center space-x-[12px]">
              <Button type="button" variant="secondary" text="Return" onClick={goToPrevStep} />
              <PreviewButton
                chainId={chainId}
                areFormsValid={useOutcomesFormReturn.formState.isValid}
                createMarketHandler={createMarketHandler}
                createMarketIsPending={createMarket.isPending}
                verifyMarketHandler={verifyMarketHandler}
                verifyMarketIsPending={verifyMarket.isPending}
                verifyMarketIsSuccess={verifyMarket.isSuccess}
                verifyNow={verifyNow}
                marketReadyToVerify={marketReadyToVerify}
                newMarketId={newMarketId}
              />
            </div>
          </div>
        }
      />

      <ButtonsWrapper goToPrevStep={goToPrevStep} isLoading={false} />
    </form>
  );
}
