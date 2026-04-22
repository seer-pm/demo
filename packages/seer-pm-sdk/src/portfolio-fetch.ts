import type { Address } from "viem";
import type { SupportedChain } from "./chains";
import type {
  PortfolioPnLData,
  PortfolioPnLPeriod,
  PortfolioPosition,
  PortfolioValueApiResponse,
} from "./portfolio-types";
import { getApiHost } from "./subgraph/app-subgraph";

export async function fetchPortfolioPositions(account: Address, chainId: SupportedChain): Promise<PortfolioPosition[]> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
  });
  const res = await fetch(`${getApiHost()}/.netlify/functions/get-portfolio?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error fetching portfolio");
  }
  return (await res.json()) as PortfolioPosition[];
}

export async function fetchPortfolioValue(
  account: Address,
  chainId: SupportedChain,
): Promise<PortfolioValueApiResponse> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
  });
  const res = await fetch(`${getApiHost()}/.netlify/functions/get-portfolio-value?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error fetching portfolio value");
  }
  return (await res.json()) as PortfolioValueApiResponse;
}

export async function fetchPortfolioPnL(
  account: Address,
  chainId: SupportedChain,
  period: PortfolioPnLPeriod,
): Promise<PortfolioPnLData> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
    period,
  });
  const res = await fetch(`${getApiHost()}/.netlify/functions/get-portfolio-pl?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch portfolio P/L");
  }
  return (await res.json()) as PortfolioPnLData;
}
