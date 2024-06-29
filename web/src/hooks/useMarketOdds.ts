import { SupportedChain } from "@/lib/chains";
import { COLLATERAL_TOKENS } from "@/lib/config";
import { useQuery } from "@tanstack/react-query";
import { Address, formatUnits } from "viem";
import { getCowQuote, getSwaprQuote } from "./trade";
import { useWrappedAddresses } from "./useWrappedAddresses";

function normalizeOdds(prices: number[]) {
  const sum = prices.reduce((acc, curr) => {
    return acc + curr;
  }, 0);

  return prices.map((price) => Math.round((price / sum) * 100));
}

async function getTokenPrice(wrappedAddress: Address, chainId: SupportedChain, buyAmount: string): Promise<bigint> {
  const outcomeToken = { address: wrappedAddress, symbol: "SEER_OUTCOME", decimals: 18 };
  const [swaprQuote, cowQuote] = await Promise.allSettled([
    getSwaprQuote(chainId, undefined, buyAmount, outcomeToken, COLLATERAL_TOKENS[chainId].primary, "buy"),
    getCowQuote(chainId, undefined, buyAmount, outcomeToken, COLLATERAL_TOKENS[chainId].primary, "buy"),
  ]);

  if (cowQuote.status === "fulfilled" && cowQuote?.value?.value && cowQuote.value.value > 0n) {
    return cowQuote.value.value;
  }

  if (swaprQuote.status === "fulfilled" && swaprQuote?.value?.value && swaprQuote.value.value > 0n) {
    return swaprQuote.value.value;
  }

  return 0n;
}

export const useMarketOdds = (
  chainId: SupportedChain,
  router: Address,
  conditionId: `0x${string}`,
  outcomeSlotCount: number,
) => {
  const { data: wrappedAddresses } = useWrappedAddresses(chainId, router, conditionId, outcomeSlotCount);
  return useQuery<number[] | undefined, Error>({
    enabled: !!wrappedAddresses && outcomeSlotCount > 0,
    queryKey: ["useMarketOdds", chainId, router, conditionId, outcomeSlotCount],
    queryFn: async () => {
      const BUY_AMOUNT = 1000;

      const prices = await Promise.all(
        wrappedAddresses!.map(async (wrappedAddress) => {
          try {
            const price = await getTokenPrice(wrappedAddress, chainId, String(BUY_AMOUNT));

            if (price === 0n) {
              return 0;
            }

            return BUY_AMOUNT / Number(formatUnits(price, 18));
          } catch {
            return 0;
          }
        }),
      );

      return normalizeOdds(prices);
    },
  });
};
