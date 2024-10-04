import { lightGeneralizedTcrAddress } from "@/hooks/contracts/generated";
import { Address } from "viem";
import { SupportedChain } from "./chains";

export const paths = {
  market: (id: Address | string, chainId: number) => `/markets/${chainId}/${id.toString()}/`,
  verifyMarket: (id: Address | string, chainId: number) => `/markets/${chainId}/${id.toString()}/verify`,
  profile: () => "/profile/",
  verifiedMarketPolicy: () =>
    "https://cdn.kleros.link/ipfs/QmfGcodBzG53DBxS2Uxu5jug9YiHUpJ5tKFqhP6Z2HjscU/Seer%20-%20Verified%20Markets.pdf",
  marketRulesPolicy: () =>
    "https://cdn.kleros.link/ipfs/QmPmRkXFUmzP4rq2YfD3wNwL8bg3WDxkYuvTP9A9UZm9gJ/seer-markets-resolution-policy.pdf",
  klerosDispute: (disputeId: number) => `https://court.kleros.io/cases/${disputeId}`,
  farmingProgram: () => "#",
  curateVerifiedList: (chainId: SupportedChain, itemId?: string) => {
    if (chainId in lightGeneralizedTcrAddress) {
      // @ts-ignore
      const baseUrl = `https://curate.kleros.io/tcr/${chainId}/${lightGeneralizedTcrAddress[chainId]}`;

      return itemId ? `${baseUrl}/${itemId}` : baseUrl;
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
  verificationCheck: (id: Address | string, chainId: number) => `/verification-check/${chainId}/${id.toString()}/`,
};
