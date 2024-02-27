import { CowSwapWidget, CowSwapWidgetParams, TradeType } from "@cowprotocol/widget-react";
import { Address } from "viem";

interface CowSwapEmbedProps {
  chainId: number;
  sellAsset: Address;
  buyAsset: Address;
}

export function CowSwapEmbed({ chainId, sellAsset, buyAsset }: CowSwapEmbedProps) {
  const params: CowSwapWidgetParams = {
    appCode: "Seer",
    width: "100%",
    height: "640px",
    chainId: chainId,
    tradeType: TradeType.SWAP,
    sell: {
      asset: sellAsset,
      amount: "0",
    },
    buy: {
      asset: buyAsset,
      amount: "0",
    },
    enabledTradeTypes: [TradeType.SWAP, TradeType.LIMIT, TradeType.ADVANCED],
    theme: "light",
    provider: window.ethereum,
  };

  return <CowSwapWidget params={params} />;
}
