/**
 * @seer-pm/sdk – SDK for the Seer prediction market protocol
 */

export const SDK_VERSION = "0.0.1";

export type { Execution } from "./execution";
export {
  getCreateMarketExecution,
  getCreateProposalExecution,
  getCreateMarketParams,
  getMarketFactoryAddress,
  getFutarchyFactoryAddress,
  getProposalName,
  generateTokenName,
  MISC_CATEGORY,
  WEATHER_CATEGORY,
  MARKET_CATEGORIES,
} from "./create-market";
export type { CreateMarketProps, CreateMarketParams } from "./create-market";
export { MarketTypes, getMarketName, getOutcomes, getQuestionParts } from "./market";
export { escapeJson } from "./reality";
export { getResolveMarketExecution } from "./resolve-market";
export { CHAIN_ROUTERS, getRouterAddress, getRedeemRouter } from "./router-addresses";
export type { MarketLike, RouterAddressMap, RouterTypes } from "./router-addresses";
export { getRedeemExecution } from "./redeem-positions";
export type { GetRedeemExecutionParams } from "./redeem-positions";
export { getMergeExecution } from "./merge-positions";
export type { GetMergeExecutionParams } from "./merge-positions";
export { getSplitExecution } from "./split-position";
export type { GetSplitExecutionParams } from "./split-position";
export {
  NATIVE_TOKEN,
  TOKENS_BY_CHAIN,
  COLLATERAL_TOKENS,
  getPrimaryCollateralAddress,
  getCollateralTokenForSwap,
  getCollateralSymbol,
  hasAltCollateral,
} from "./collateral";
export type { Token, CollateralTokensMap } from "./collateral";
export { WRAPPED_OUTCOME_TOKEN_DECIMALS, EMPTY_TOKEN } from "./tokens";
export type { TokenTransfer } from "./tokens";
export { getSwapRouterAddress } from "./trading";
export {
  getCowQuote,
  getCowQuoteExactOut,
  getSwaprQuote,
  getSwaprQuoteExactOut,
  getUniswapQuote,
  getUniswapQuoteExactOut,
  fetchCowQuote,
  fetchSwaprQuote,
  fetchUniswapQuote,
  getTradeArgsExactIn,
  getTradeArgsExactOut,
  getUniswapTrade,
  getSwaprTrade,
  getUniswapTradeExactOut,
  getSwaprTradeExactOut,
  getCollateralPerShare,
  getOutcomeTokenVolume,
} from "./quote";
export type { QuoteTradeResult, QuoteTradeFn } from "./quote";
export {
  executeCoWTrade,
  executeSwaprTrade,
  executeUniswapTrade,
  tradeTokens,
  buildTradeCalls7702,
  buildSwaprTradeExecution,
  buildUniswapTradeExecution,
  getMaximumAmountIn,
  getTradeApprovals7702,
  getSwaprTradeExecution,
  getUniswapTradeExecution,
  getWrappedSeerCreditsExecution,
  clientToSigner,
} from "./execute-trade";
export type {
  TradeTokensProps,
  GetTradeApprovals7702Params,
} from "./execute-trade";
export { getNewMarketFromLogs, getNewProposalFromLogs } from "./events";
export { marketAbi } from "../generated/generated-market-factory";
