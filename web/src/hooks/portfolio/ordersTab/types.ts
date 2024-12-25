import { EnrichedOrder } from "@cowprotocol/cow-sdk";

export interface CowOrderData extends EnrichedOrder {
  marketName: string;
  marketId: string;
  buyTokenSymbol: string;
  sellTokenSymbol: string;
  limitPrice: string;
}
