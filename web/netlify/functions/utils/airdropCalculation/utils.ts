import { Market } from "@/hooks/useMarket";
import { Address } from "viem";

export function getTokensByTimestamp(markets: Market[], timestamp: number) {
  return markets.reduce(
    (acum, market) => {
      if (Number(market.finalizeTs) < timestamp) {
        for (let i = 0; i < market.wrappedTokens.length; i++) {
          const tokenId = market.wrappedTokens[i];
          acum[tokenId] = true;
        }
      }
      return acum;
    },
    {} as { [key: Address]: boolean },
  );
}

export function getRandomNextDayTimestamp(timestampInSeconds: number) {
  // Convert seconds to milliseconds
  const date = new Date(timestampInSeconds * 1000);

  // Set to start of next day (00:00:00)
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  // Get milliseconds for start of next day
  const nextDayStartMs = date.getTime();
  const now = new Date().getTime();
  let randomTimestampMs: number;
  do {
    randomTimestampMs = nextDayStartMs + Math.random() * 86400000;
  } while (randomTimestampMs > now);

  // Add random milliseconds and convert back to seconds
  return Math.floor(randomTimestampMs / 1000);
}
