import { lightGeneralizedTcrAddress } from "@/hooks/contracts/generated";
import { Market } from "@/hooks/useMarket";
import { Address } from "viem";
import { SupportedChain } from "./chains";

function marketPath(market: Market): string;
function marketPath(id: Address | string, chainId: number): string;
function marketPath(marketOrIdOrUrl: Market | Address | string, chainId?: number): string {
  if (typeof marketOrIdOrUrl === "string") {
    return `/markets/${chainId}/${marketOrIdOrUrl}`;
  }

  return `/markets/${marketOrIdOrUrl.chainId}/${marketOrIdOrUrl.url || marketOrIdOrUrl.id}`;
}

export const paths = {
  market: marketPath,
  verifyMarket: (id: Address | string, chainId: number) => `/markets/${chainId}/${id.toString()}/verify`,
  profile: () => "/profile/",
  collection: (collectionId: string) => `/collections/${collectionId}`,
  klerosDispute: (disputeId: bigint, chainId: SupportedChain) =>
    `https://resolve.kleros.io/cases/${disputeId.toString()}?requiredChainId=${chainId}`,
  farmingProgram: () => "https://seer-pm.medium.com/announcing-the-seer-initial-airdrop-distribution-58d38e1ec8f9",
  curateVerifiedList: (chainId: SupportedChain, itemId?: string) => {
    if (chainId in lightGeneralizedTcrAddress) {
      // @ts-ignore
      const baseUrl = `https://curate.kleros.io/tcr/${chainId}/${lightGeneralizedTcrAddress[chainId]}`;

      return itemId ? `${baseUrl}/${itemId}` : baseUrl;
    }

    return "#";
  },
  faq: () => "#",
  dappGuide: () => "https://seer-3.gitbook.io/seer-documentation",
  bugReport: () => "https://github.com/seer-pm/demo/issues",
  getHelp: () => "https://t.me/seer_pm",
  beginnerGuide: () => "https://ethereum.org/en/wallets/",
  etherscan: () => "#",
  github: () => "https://github.com/seer-pm",
  snapshot: () => "#",
  discord: () => "#",
  twitter: () => "https://x.com/seer_pm",
  telegram: () => "https://t.me/seer_pm",
  verificationCheck: (id: Address | string, chainId: number) => `/verification-check/${chainId}/${id.toString()}/`,
  xDAIBridge: () =>
    "https://jumper.exchange/?fromChain=1&fromToken=0x6B175474E89094C44Da98b954EedeAC495271d0F&toChain=100&toToken=0x0000000000000000000000000000000000000000",
};
