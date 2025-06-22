import { getConfigNumber } from "@/lib/config";
import { formatDate } from "@/lib/date";
import { MarketTypes, getMarketName, getOutcomes, getQuestionParts } from "@/lib/market";
import { escapeJson } from "@/lib/reality";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { Address, TransactionReceipt } from "viem";
import { writeFutarchyFactoryCreateProposal, writeMarketFactory } from "./contracts/generated-market-factory";

interface CreateMarketProps {
  marketType: MarketTypes;
  marketName: string;
  collateralToken1: Address | ""; // for futarchy markets
  collateralToken2: Address | ""; // for futarchy markets
  isArbitraryQuestion: boolean; // for futarchy markets
  parentMarket: Address;
  parentOutcome: bigint;
  outcomes: string[];
  tokenNames: string[];
  lowerBound: bigint;
  upperBound: bigint;
  unit: string;
  category: string;
  openingTime: number;
  chainId?: number;
}

const MarketTypeFunction: Record<
  string,
  "createCategoricalMarket" | "createScalarMarket" | "createMultiCategoricalMarket" | "createMultiScalarMarket"
> = {
  [MarketTypes.CATEGORICAL]: "createCategoricalMarket",
  [MarketTypes.SCALAR]: "createScalarMarket",
  [MarketTypes.MULTI_CATEGORICAL]: "createMultiCategoricalMarket",
  [MarketTypes.MULTI_SCALAR]: "createMultiScalarMarket",
} as const;

function generateTokenName(outcome: string) {
  return outcome
    .replace(/[^\w\s]/gi, "") // remove special characters
    .replaceAll("_", " ") // replace underscores with spaces
    .replace(/ {2,}/g, " ") // remove consecutive spaces
    .trim() // trim
    .replaceAll(" ", "_") // replace spaces with underscore
    .toLocaleUpperCase() // uppercase
    .substring(0, 11); // 11 characters to follow the verification policy
}

function getTokenNames(tokenNames: string[], outcomes: string[]) {
  // we loop over `outcomes` because it's the return value of getOutcomes(),
  // that already has the correct outcomes for scalar markets
  return outcomes.map((outcome, i) =>
    (tokenNames[i].trim() !== "" ? tokenNames[i].trim() : generateTokenName(outcome)).slice(0, 31),
  );
}

async function createMarket(props: CreateMarketProps): Promise<TransactionReceipt> {
  const outcomes = getOutcomes(props.outcomes, props.marketType);
  const marketName = getMarketName(props.marketType, props.marketName, props.unit);
  const questionParts = getQuestionParts(marketName, props.marketType);

  const result = await toastifyTx(
    () =>
      writeMarketFactory(config, {
        functionName: MarketTypeFunction[props.marketType],
        args: [
          {
            marketName,
            questionStart: escapeJson(questionParts?.questionStart || ""),
            questionEnd: escapeJson(questionParts?.questionEnd || ""),
            outcomeType: escapeJson(questionParts?.outcomeType || ""),
            parentMarket: props.parentMarket,
            parentOutcome: props.parentOutcome,
            lang: "en_US",
            category: "misc",
            outcomes: outcomes.map(escapeJson),
            tokenNames: getTokenNames(props.tokenNames, outcomes),
            lowerBound: props.lowerBound,
            upperBound: props.upperBound,
            minBond: getConfigNumber("MIN_BOND", props.chainId),
            openingTime: props.openingTime,
          },
        ],
      }),
    {
      txSent: { title: "Creating market..." },
      txSuccess: { title: "Market created!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export function getProposalName(marketName: string, openingTime: number, isArbitraryQuestion: boolean) {
  if (isArbitraryQuestion) {
    return marketName;
  }
  return `Will proposal "${marketName}" be accepted by ${formatDate(openingTime)} UTC?`;
}

async function createProposal(props: CreateMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeFutarchyFactoryCreateProposal(config, {
        args: [
          {
            marketName: escapeJson(getProposalName(props.marketName, props.openingTime, props.isArbitraryQuestion)),
            collateralToken1: props.collateralToken1 as Address,
            collateralToken2: props.collateralToken2 as Address,
            lang: "en_US",
            category: "misc",
            minBond: getConfigNumber("MIN_BOND", props.chainId),
            openingTime: props.openingTime,
          },
        ],
      }),
    {
      txSent: { title: "Creating proposal..." },
      txSuccess: { title: "Proposal created!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useCreateMarket = (isFutarchyMarket: boolean, onSuccess: (data: TransactionReceipt) => void) => {
  return useMutation({
    mutationFn: isFutarchyMarket ? createProposal : createMarket,
    onSuccess,
  });
};
