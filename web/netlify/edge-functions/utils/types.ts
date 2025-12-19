import { base, gnosis, mainnet, optimism, sepolia } from "https://esm.sh/viem@2.17.5/chains";

const chainIds = [mainnet.id, sepolia.id, gnosis.id, optimism.id, base.id] as const;

export { gnosis, mainnet, optimism, base, sepolia };

export type SupportedChain = (typeof chainIds)[number];

export type SimpleMarket = {
  marketName: string;
  outcomes: string[];
  liquidityUSD: number;
  odds: (number | null)[];
  templateId: string;
  questions: Array<{ id: string }>;
  upperBound: string;
  lowerBound: string;
};

export enum MarketTypes {
  CATEGORICAL = "categorical",
  SCALAR = "scalar",
  MULTI_CATEGORICAL = "multi_categorical",
  MULTI_SCALAR = "multi_scalar",
}
