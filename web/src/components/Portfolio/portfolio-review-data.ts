import type { PortfolioPosition } from "@seer-pm/sdk";

export type PositionMetrics = { averageEntry: number; cost: number; traded: number; payout: number };
export type ReviewPosition = PortfolioPosition & { reviewMetrics?: PositionMetrics; reviewPayout?: number };
// Public Seer API snapshot, captured 5 October 2026. Only the largest Brazilian position is shown.
export const REVIEW_ACCOUNT = "0xc70402ecd3c8b1cf35eee9837e13053b54e5e45a" as const;
export const REVIEW_POSITIONS: ReviewPosition[] = [
  {
    marketId: "0x95149fcc1eb9ec665a5984c33927b991dd66a355",
    tokenIndex: 0,
    tokenId: "0x3bd991b8c65ce9e85f9d12caf4d8236b5fe76abf",
    tokenBalance: 1546.9466320344777,
    reviewPayout: 1546.9466320344777,
    rawBalance: "1546946632034477638860",
    lpTokenBalance: 0,
    rawLpBalance: "0",
    marketName: "Who will win Brazilian presidential election in 2026?",
    marketStatus: "open",
    marketFinalizeTs: 33260976000,
    outcome: "Luiz Inácio Lula da Silva",
    chainId: 100,
    collateralToken: "0xaf204776c7245bf4147c2612bf6e5972ee483701",
    redeemedPrice: 0,
    tokenPrice: 0.1615441930782194,
    tokenValue: 249.9002454070789,
    outcomeImage: "https://cdn.kleros.link/ipfs/QmetRDKeZEfZXqN5dyYVBU6sKj7rVGyyHxeimQ6kASEop4",
    isInvalidOutcome: false,
    isWorthless: false,
    sourceWallet: "0xc70402ecd3c8b1cf35eee9837e13053b54e5e45a",
  },
];
