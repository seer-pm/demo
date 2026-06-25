import { useQuery } from "@tanstack/react-query";

// Hardcoded peg / yield-token approximations. Used when CoinGecko is
// unreachable, or for symbols we know are pegged 1:1. Easier to tune
// here than to refetch live prices for every stablecoin.
const HARDCODED_PRICES: Record<string, number> = {
  USDC: 1.0,
  DAI: 1.0,
  XDAI: 1.0,
  WXDAI: 1.0,
  USDS: 1.0,
  SDAI: 1.08,
  SUSDS: 1.05,
};

// Map our token symbols → CoinGecko ids. Only listed for the YIELD
// tokens whose live price actually differs from $1.00; the rest fall
// through to the hardcoded $1.00 above.
const COINGECKO_IDS: Record<string, string> = {
  SDAI: "savings-dai",
  SUSDS: "susds",
};

type CoinGeckoPriceMap = Record<string, { usd?: number }>;

async function fetchCoinGeckoPrices(): Promise<CoinGeckoPriceMap | null> {
  const ids = Object.values(COINGECKO_IDS).join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    );
    if (!res.ok) return null;
    return (await res.json()) as CoinGeckoPriceMap;
  } catch {
    return null;
  }
}

/**
 * @param symbol  Token ticker (case-insensitive). Returns 1 if undefined.
 * @returns       USD price per 1 token unit.
 */
export function useTokenUsdPrice(symbol: string | undefined): number {
  const { data } = useQuery({
    queryKey: ["seer", "usd-prices"],
    queryFn: fetchCoinGeckoPrices,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (!symbol) return 1;
  const key = symbol.toUpperCase();

  const cgId = COINGECKO_IDS[key];
  if (cgId && data?.[cgId]?.usd != null) {
    return data[cgId].usd as number;
  }

  return HARDCODED_PRICES[key] ?? 1;
}
