import { lightGeneralizedTcrAddress } from "@/hooks/contracts/generated";
import { Address } from "viem";
import { SupportedChain } from "./chains";

export const paths = {
  market: (id: Address | string, chainId: number) => `/markets/${chainId}/${id.toString()}/`,
  verifiedMarketPolicy: () => "#",
  marketRulesPolicy: () => "#",
  klerosDispute: () => "#",
  farmingProgram: () => "#",
  curateVerifiedList: (chainId: SupportedChain) => {
    if (chainId in lightGeneralizedTcrAddress) {
      // @ts-ignore
      return `https://curate.kleros.io/tcr/${chainId}/${lightGeneralizedTcrAddress[chainId]}`;
    }

    return "#";
  },
  faq: () => "#",
  dappGuide: () => "#",
  bugReport: () => "#",
  getHelp: () => "#",
  beginnerGuide: () => "https://ethereum.org/en/wallets/",
  etherscan: () => "#",
  github: () => "#",
  snapshot: () => "#",
  discord: () => "#",
  twitter: () => "#",
  telegram: () => "#",
};
