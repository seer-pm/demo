import { getConfigNumber } from "@/lib/config";
import { MarketTypes } from "@/lib/market";
import { escapeJson } from "@/lib/reality";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { Address, TransactionReceipt } from "viem";
import { writeFutarchyFactoryCreateProposal, writeMarketFactory } from "./contracts/generated";

interface CreateMarketProps {
  marketType: MarketTypes;
  marketName: string;
  collateralToken1: Address | ""; // for futarchy markets
  collateralToken2: Address | ""; // for futarchy markets
  questionStart: string;
  questionEnd: string;
  outcomeType: string;
  parentMarket: Address;
  parentOutcome: bigint;
  outcomes: string[];
  tokenNames: string[];
  lowerBound: number;
  upperBound: number;
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

export function getOutcomes(outcomes: string[], marketType: MarketTypes) {
  if (marketType === MarketTypes.SCALAR) {
    return ["DOWN", "UP", ...outcomes.slice(2)];
  }

  return outcomes;
}

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

  const result = await toastifyTx(
    () =>
      writeMarketFactory(config, {
        functionName: MarketTypeFunction[props.marketType],
        args: [
          {
            marketName:
              props.marketType === MarketTypes.SCALAR
                ? `${escapeJson(props.marketName)} [${escapeJson(props.unit)}]`
                : escapeJson(props.marketName),
            questionStart: escapeJson(props.questionStart),
            questionEnd: escapeJson(props.questionEnd),
            outcomeType: escapeJson(props.outcomeType),
            parentMarket: props.parentMarket,
            parentOutcome: props.parentOutcome,
            lang: "en_US",
            category: "misc",
            outcomes: outcomes.map(escapeJson),
            tokenNames: getTokenNames(props.tokenNames, outcomes),
            lowerBound: BigInt(props.lowerBound),
            upperBound: BigInt(props.upperBound),
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

async function createProposal(props: CreateMarketProps): Promise<TransactionReceipt> {
  const result = await toastifyTx(
    () =>
      writeFutarchyFactoryCreateProposal(config, {
        args: [
          {
            proposalName: escapeJson(props.marketName),
            collateralToken1: props.collateralToken1 as Address,
            collateralToken2: props.collateralToken2 as Address,
            parentProposal: props.parentMarket,
            parentOutcome: props.parentOutcome,
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

export const useCreateMarket = (isFutarchyMarket: boolean, onSuccess: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: isFutarchyMarket ? createProposal : createMarket,
    onSuccess,
  });
};
