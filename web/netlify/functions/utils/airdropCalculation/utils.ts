import { Market } from "@/lib/market";
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

export function getRandomNextDayTimestamp(timestampInSeconds: number, lastDayInSeconds: number) {
  // Convert seconds to milliseconds
  const date = new Date(timestampInSeconds * 1000);

  // Set to start of next day (00:00:00)
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  // Get seconds for start of next day
  const nextDayStartSeconds = Math.floor(date.getTime() / 1000);
  console.log({ nextDayStartSeconds, lastDayInSeconds });
  if (nextDayStartSeconds >= lastDayInSeconds) {
    return nextDayStartSeconds;
  }
  // Add random seconds
  const randomSeconds =
    Math.floor(Math.random() * (Math.min(lastDayInSeconds - nextDayStartSeconds, 86399) - 1 + 1)) + 1;
  return nextDayStartSeconds + randomSeconds;
}
