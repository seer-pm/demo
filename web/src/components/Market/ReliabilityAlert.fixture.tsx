import { Alert } from "@/components/Alert";
import { gnosis } from "@/lib/chains";
import { Market, isMarketReliable } from "@seer-pm/sdk";
import { REALITY_TEMPLATE_SINGLE_SELECT, REALITY_TEMPLATE_UINT } from "@seer-pm/sdk";
import { zeroAddress } from "viem";

// Reality separates the question parameters with this character (U+241F).
const DELIM = "␟";

const baseMarket: Market = {
  id: "0xC11712D7b3a22483a269a1B00F825E0916C5DDE4",
  type: "Generic",
  collateralToken: zeroAddress,
  collateralToken1: zeroAddress,
  collateralToken2: zeroAddress,
  chainId: gnosis.id,
  marketName: "Will it happen?",
  outcomes: ["Yes", "No", "Invalid result"],
  wrappedTokens: [zeroAddress, zeroAddress, zeroAddress],
  parentMarket: {
    id: zeroAddress,
    conditionId: "0x000",
    payoutReported: false,
    payoutNumerators: [0n, 0n],
  },
  parentOutcome: 0n,
  outcomesSupply: 0n,
  liquidityUSD: 0,
  openInterestUSD: 0,
  volumeUSD: 0,
  volumeNotionalUSD: 0,
  maxLiquidity: 0,
  incentive: 0,
  hasLiquidity: false,
  parentCollectionId: "0x000",
  conditionId: "0x000",
  questionId: "0x000",
  templateId: BigInt(REALITY_TEMPLATE_SINGLE_SELECT),
  lowerBound: 0n,
  upperBound: 0n,
  payoutReported: false,
  payoutNumerators: [0n, 0n],
  questions: [],
  openingTs: 0,
  finalizeTs: 0,
  encodedQuestions: [`Will it happen?${DELIM}"Yes","No"${DELIM}misc${DELIM}en_US`],
  categories: ["misc"],
  poolBalance: [],
  odds: [],
  url: "",
};

function makeMarket(overrides: Partial<Market>): Market {
  return { ...structuredClone(baseMarket), ...overrides };
}

const SCENARIOS: { label: string; note: string; market: Market }[] = [
  {
    label: "Clean categorical market",
    note: "No injection. The warning must NOT appear.",
    market: makeMarket({}),
  },
  {
    label: "lang parameter overrides the outcomes (advisory payload)",
    note: 'lang = en_US","outcomes":["No","Yes"],"z":" — Reality shows Yes/No swapped.',
    market: makeMarket({
      encodedQuestions: [`Will it happen?${DELIM}"Yes","No"${DELIM}misc${DELIM}en_US","outcomes":["No","Yes"],"z":"`],
    }),
  },
  {
    label: "category parameter forges outcomes and title",
    note: 'category = misc","outcomes":["No","Yes"],"title":"Forged?","z":"',
    market: makeMarket({
      encodedQuestions: [
        `Will it happen?${DELIM}"Yes","No"${DELIM}misc","outcomes":["No","Yes"],"title":"Forged?","z":"${DELIM}en_US`,
      ],
    }),
  },
  {
    label: "scalar market overrides decimals",
    note: 'uint question, lang = en_US","decimals":0,"z":" — changes how the answer is scaled.',
    market: makeMarket({
      templateId: BigInt(REALITY_TEMPLATE_UINT),
      outcomes: ["Lower", "Upper", "Invalid result"],
      lowerBound: 0n,
      upperBound: 100n,
      encodedQuestions: [`What will the price be?${DELIM}misc${DELIM}en_US","decimals":0,"z":"`],
    }),
  },
  {
    label: "separator smuggled into the title",
    note: "A U+241F inside the title shifts every later parameter into the wrong slot.",
    market: makeMarket({
      encodedQuestions: [
        `Will it happen?${DELIM}"No","Yes"${DELIM}misc${DELIM}en_US${DELIM}"Yes","No"${DELIM}misc${DELIM}en_US`,
      ],
    }),
  },
  {
    label: "Unescaped quotes that break the JSON (harmless)",
    note: "Old markets with a bare quote in the title. Reality shows a broken question, meaning is unchanged. The warning must NOT appear.",
    market: makeMarket({
      encodedQuestions: [`Will "it" happen?${DELIM}"Yes","No"${DELIM}misc${DELIM}en_US`],
    }),
  },
];

export default Object.fromEntries(
  SCENARIOS.map((scenario) => [
    scenario.label,
    <div className="container-fluid py-10 space-y-3" key={scenario.label}>
      <div className="text-[14px] text-black-secondary">{scenario.note}</div>
      <code className="block text-[12px] break-all bg-gray-100 p-2 rounded">{scenario.market.encodedQuestions[0]}</code>
      {/* Same block that renders on the market page (see pages/markets/@chainId/@id/+Page.tsx). */}
      {!isMarketReliable(scenario.market) && (
        <Alert type="error" title="There is a discrepancy between the market information and the Reality.eth questions">
          It could lead to the market being resolved to an invalid or unexpected outcome. Proceed with caution.
        </Alert>
      )}
    </div>,
  ]),
);
