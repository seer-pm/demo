/**
 * @seer-pm/sdk – SDK for the Seer prediction market protocol
 */
export type { Execution } from "./execution";
export type {
  Question,
  VerificationStatus,
  VerificationResult,
  MarketOffChainFields,
  Market,
  SerializedMarket,
} from "./market-types";
export { MarketStatus, serializeMarket, deserializeMarket } from "./market-types";
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
export { validateNewMarket } from "./validate-new-market";
export type { NewMarketValidationIssue } from "./validate-new-market";
export {
  INVALID_RESULT_OUTCOME,
  INVALID_RESULT_OUTCOME_TEXT,
  MarketTypes,
  getMarketName,
  getMarketStatus,
  getOutcomes,
  getQuestionParts,
  getMarketUnit,
  getMarketType,
  hasOutcomes,
  hasOpenQuestions,
  hasAllUnansweredQuestions,
  isInDispute,
  isWaitingResults,
  getClosingTime,
  getTemplateByMarketType,
  isMarketReliable,
  isInvalidOutcome,
  getMultiScalarEstimate,
  getRedeemedPrice,
} from "./market";
export {
  generateBasicPartition,
  generateWinningOutcomeIndexes,
  getPositionId,
} from "./conditional-tokens";
export { STATUS_TEXTS, MARKET_TYPES_TEXTS, MARKET_TYPES_DESCRIPTION } from "./market-texts";
export type { OnChainMarket } from "./on-chain-market";
export { mapOnChainMarket } from "./on-chain-market";
export {
  FUTARCHY_LP_PAIRS_MAPPING,
  getCollateralByIndex,
  getLiquidityPair,
  getLiquidityPairForToken,
  getMarketPoolsPairs,
  getToken0Token1,
  getTokensPairKey,
} from "./market-pools";
export type { Token0Token1 } from "./market-pools";
export {
  getBlockExplorerUrl,
  getLiquidityUrl,
  getLiquidityUrlByMarket,
  getPoolExplorerUrl,
  getTokenExplorerUrl,
} from "./explorer-urls";
export {
  ANSWERED_TOO_SOON,
  INVALID_RESULT,
  REALITY_TEMPLATE_MULTIPLE_SELECT,
  REALITY_TEMPLATE_SINGLE_SELECT,
  REALITY_TEMPLATE_UINT,
  displayScalarBound,
  encodeOutcomes,
  encodeQuestionText,
  decodeQuestion,
  decodeOutcomes,
  escapeJson,
  formatOutcome,
  getAnswerText,
  getAnswerTextFromMarket,
  getCurrentBond,
  getMultiSelectAnswers,
  getQuestionStatus,
  getRealityLink,
  isFinalized,
  isQuestionOpen,
  isQuestionUnanswered,
  isQuestionInDispute,
  isQuestionPending,
  isScalarBoundInWei,
  unescapeJson,
} from "./reality";
export type { FormEventOutcomeValue, Outcome } from "./reality";
export { getResolveMarketExecution } from "./resolve-market";
export {
  CHAIN_ROUTERS,
  getRouterAddress,
  getRedeemRouter,
  routerAddressMap,
  getRouterAddresses,
} from "./router-addresses";
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
export { getTokenInfo, getTokensInfo } from "./token-info";
export type { GetTokenResult } from "./token-info";
export { fetchNeededApprovals, getApprovals7702 } from "./approvals";
export type { ApprovalInfo, GetApprovals7702Props } from "./approvals";
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
  cancelCowOrder,
  cancelEthFlowOrder,
  clientToSigner,
  viemClientToSigner,
  createCowOrder,
  ETH_FLOW_ADDRESS,
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
} from "./execute-trade";
export type {
  TradeTokensProps,
  GetTradeApprovals7702Params,
} from "./execute-trade";
export { getNewMarketFromLogs, getNewProposalFromLogs } from "./events";
export { marketAbi } from "../generated/contracts/market-factory";
export type { SupportedChain, SupportedChains } from "./chains";
export { isOpStack } from "./chains";
export { getTokenSwapResult, getTokenPriceFromSwap, getTokenPrice } from "./token-price";
export {
  isOdd,
  rescaleOdds,
  normalizeOdds,
  getMarketOdds,
  getMarketEstimate,
} from "./market-odds";
export { getMarketPositions } from "./get-market-positions";
export type { MarketPosition } from "./get-market-positions";
export { getWinningPositions } from "./get-winning-positions";
export type { WinningPositionInput, WinningPositionsResult } from "./get-winning-positions";
export { decimalToFraction, sqrtPriceX96ToPrice, tickToPrice } from "./liquidity-utils";
export { isSeerCredits } from "./seer-credits";

// Transaction notification abstractions (UI-agnostic)
export type {
  TxNotificationMessage,
  TxNotificationConfig,
  TxNotificationResult,
  TxNotifierFn,
  TxBatchNotifierFn,
} from "./tx-notifier";
export type { NotifierFn, NotifierResult } from "./notifier";

// Markets fetch (search + get by id/slug)
export {
  fetchMarkets,
  fetchMarket,
  type FetchMarketParams,
  type JsonMarketsResult,
  type MarketsResult,
} from "./markets-fetch";
export { searchOnChainMarkets } from "./on-chain-markets";

export {
  fetchPortfolioPositions,
  fetchPortfolioValue,
  fetchPortfolioPnL,
} from "./portfolio-fetch";
export type {
  PortfolioPosition,
  PortfolioPnLPeriod,
  PortfolioPnLData,
  PortfolioValueApiResponse,
} from "./portfolio-types";

// Subgraph: endpoints, clients, token price from subgraph
export {
  initApiHost,
  getAppSubgraphUrl,
  graphQLClient,
  curateGraphQLClient,
  uniswapGraphQLClient,
  swaprGraphQLClient,
  realityGraphQLClient,
  getSubgraphUrl,
  SUBGRAPHS,
  getTokenPriceFromSubgraph,
} from "./subgraph";
export type { AppSubgraphType, SubgraphTypes } from "./subgraph";
export { CHAIN_IDS } from "./subgraph";

// Re-export CoW Protocol SDK for web consumers (single dependency)
export { OrderBookApi, OrderStatus, SupportedChainId } from "@cowprotocol/cow-sdk";
export type { EnrichedOrder, UnsignedOrder } from "@cowprotocol/cow-sdk";

// Re-export Swapr SDK for web consumers (single dependency)
export {
  TradeType,
  Trade,
  CoWTrade,
  SwaprV3Trade,
  UniswapTrade,
  ChainId,
  configureRpcProviders,
  Currency,
  CurrencyAmount,
  Percent,
} from "@swapr/sdk";
