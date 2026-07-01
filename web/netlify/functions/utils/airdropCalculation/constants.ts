import { base, gnosis, mainnet, optimism } from "viem/chains";

// Earliest period we scan pool-hour prices from, per chain. Optimism/Base launched
// later than the Oct 2024 genesis; 0 is a safe floor (extra empty rows are harmless).
export const START_TIME: Record<number, number> = {
  [gnosis.id]: 1728416320,
  [mainnet.id]: 1728082727,
  [optimism.id]: 0,
  [base.id]: 0,
};

export const SER_LPP = {
  [gnosis.id]: "0xa7a7f8d1770c08e2e1f55d8c6427c1f8213a34da",
  [mainnet.id]: "0xd14ef697281404646d8e2437a0050794a6a22fd6",
};
