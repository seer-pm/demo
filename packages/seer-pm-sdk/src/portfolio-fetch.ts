import type { Address } from "viem";
import type {
  PortfolioChainId,
  PortfolioCostBasisResponse,
  PortfolioMarketPnLResponse,
  PortfolioPnLData,
  PortfolioPnLPeriod,
  PortfolioPosition,
  PortfolioValueApiResponse,
} from "./portfolio-types";
import { getApiHost } from "./subgraph/app-subgraph";

export async function fetchPortfolioPositions(
  account: Address,
  chainId: PortfolioChainId,
  collateralProfile: string,
): Promise<PortfolioPosition[]> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
    collateralProfile,
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
  chainId: PortfolioChainId,
  collateralProfile: string,
): Promise<PortfolioValueApiResponse> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
    collateralProfile,
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
  chainId: PortfolioChainId,
  period: PortfolioPnLPeriod,
  collateralProfile: string,
  marketId?: Address,
): Promise<PortfolioPnLData> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
    period,
    collateralProfile,
  });
  if (marketId) {
    params.set("marketId", marketId);
  }
  const res = await fetch(`${getApiHost()}/.netlify/functions/get-portfolio-pl?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch portfolio P/L");
  }
  return (await res.json()) as PortfolioPnLData;
}

export async function fetchPortfolioMarketPnL(
  account: Address,
  chainId: PortfolioChainId,
  period: PortfolioPnLPeriod,
  collateralProfile: string,
): Promise<PortfolioMarketPnLResponse> {
  const params = new URLSearchParams({
    account,
    chainId: String(chainId),
    period,
    collateralProfile,
  });
  const res = await fetch(`${getApiHost()}/.netlify/functions/get-portfolio-market-pl?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch per-market portfolio P/L");
  }
  return (await res.json()) as PortfolioMarketPnLResponse;
}

export async function fetchPortfolioCostBasis(
  account: Address,
  chainId: PortfolioChainId,
  collateralProfile: string,
): Promise<PortfolioCostBasisResponse> {
  const params = new URLSearchParams({ account, chainId: String(chainId), collateralProfile });
  const res = await fetch(`${getApiHost()}/.netlify/functions/get-portfolio-cost-basis?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch portfolio cost basis");
  }
  return (await res.json()) as PortfolioCostBasisResponse;
}
