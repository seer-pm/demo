import { lightGeneralizedTcrAddress } from "@/hooks/contracts/generated-curate";
import { Address } from "viem";
import { SupportedChain } from "./chains";
import { TOKENS_BY_CHAIN, isSeerCredits } from "./config";
import { Market } from "./market";

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
  getHelp: () => "https://discord.com/invite/rBEB4MYQwV",
  beginnerGuide: () => "https://ethereum.org/en/wallets/",
  etherscan: () => "#",
  github: () => "https://github.com/seer-pm",
  snapshot: () => "#",
  discord: () => "https://discord.com/invite/rBEB4MYQwV",
  twitter: () => "https://x.com/seer_pm",
  verificationCheck: (id: Address | string, chainId: number) => `/verification-check/${chainId}/${id.toString()}/`,
  depositGuideEth: () =>
    "https://seer-3.gitbook.io/seer-documentation/getting-started/deposit-tokens/on-ethereum/deposit-dai",
  depositGuideGnosis: () =>
    "https://seer-3.gitbook.io/seer-documentation/getting-started/deposit-tokens/on-gnosis/deposit-xdai",
  swapETHToDai: () =>
    "https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=0x6B175474E89094C44Da98b954EedeAC495271d0F",
  xDAIBridge: () =>
    "https://jumper.exchange/?fromChain=1&fromToken=0x6B175474E89094C44Da98b954EedeAC495271d0F&toChain=100&toToken=0x0000000000000000000000000000000000000000",
  tokenImage: (address: string, chainId: number) => {
    // TODO: use kleros list, add sUSDS on optimism and sDAI on mainnet
    if (chainId === 10) {
      if (address.toLowerCase() === TOKENS_BY_CHAIN[10].sUSDS) {
        return "https://assets.coingecko.com/coins/images/52721/standard/sUSDS_Coin.png";
      }

      if (address.toLowerCase() === TOKENS_BY_CHAIN[10].USDS) {
        return "https://assets.coingecko.com/coins/images/39926/standard/usds.webp";
      }

      if (address.toLowerCase() === TOKENS_BY_CHAIN[10].USDC) {
        return "https://assets.coingecko.com/coins/images/6319/standard/usdc.png";
      }
    }

    if (isSeerCredits(chainId as SupportedChain, address as Address)) {
      return "/assets/android-icon-192x192.png";
    }

    return `https://raw.githubusercontent.com/cowprotocol/token-lists/main/src/public/images/${chainId}/${address}/logo.png`;
  },
};
