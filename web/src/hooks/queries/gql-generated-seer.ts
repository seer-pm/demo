import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  BigDecimal: { input: string; output: string };
  BigInt: { input: string; output: string };
  Bytes: { input: `0x${string}`; output: `0x${string}` };
  Int8: { input: string; output: string };
  Timestamp: { input: string; output: string };
};

export enum Aggregation_Interval {
  Day = "day",
  Hour = "hour",
}

export type ArbitratorMetadata = {
  __typename?: "ArbitratorMetadata";
  /** The arbitrator address */
  id: Scalars["Bytes"]["output"];
  /** The current arbitrator meta evidence URI */
  registrationMetaEvidenceURI: Scalars["String"]["output"];
};

export type ArbitratorMetadata_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ArbitratorMetadata_Filter>>>;
  id?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<ArbitratorMetadata_Filter>>>;
  registrationMetaEvidenceURI?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_gt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_gte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidenceURI_lt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_lte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidenceURI_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum ArbitratorMetadata_OrderBy {
  Id = "id",
  RegistrationMetaEvidenceUri = "registrationMetaEvidenceURI",
}

export type BlockChangedFilter = {
  number_gte: Scalars["Int"]["input"];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars["Bytes"]["input"]>;
  number?: InputMaybe<Scalars["Int"]["input"]>;
  number_gte?: InputMaybe<Scalars["Int"]["input"]>;
};

export type Condition = {
  __typename?: "Condition";
  /**  Conditional token conditionId  */
  id: Scalars["ID"]["output"];
  markets: Array<Market>;
};

export type ConditionMarketsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Market_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Market_Filter>;
};

export type Condition_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Condition_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  markets_?: InputMaybe<Market_Filter>;
  or?: InputMaybe<Array<InputMaybe<Condition_Filter>>>;
};

export enum Condition_OrderBy {
  Id = "id",
  Markets = "markets",
}

export type ConditionalEvent = {
  __typename?: "ConditionalEvent";
  accountId: Scalars["Bytes"]["output"];
  amount: Scalars["BigInt"]["output"];
  blockNumber: Scalars["BigInt"]["output"];
  collateral: Scalars["Bytes"]["output"];
  id: Scalars["Bytes"]["output"];
  market: Market;
  transactionHash: Scalars["Bytes"]["output"];
  type: Scalars["String"]["output"];
};

export type ConditionalEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  accountId?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  accountId_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  accountId_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  amount?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<ConditionalEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  blockNumber_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  collateral?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  collateral_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateral_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  market?: InputMaybe<Scalars["String"]["input"]>;
  market_?: InputMaybe<Market_Filter>;
  market_contains?: InputMaybe<Scalars["String"]["input"]>;
  market_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  market_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_gt?: InputMaybe<Scalars["String"]["input"]>;
  market_gte?: InputMaybe<Scalars["String"]["input"]>;
  market_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  market_lt?: InputMaybe<Scalars["String"]["input"]>;
  market_lte?: InputMaybe<Scalars["String"]["input"]>;
  market_not?: InputMaybe<Scalars["String"]["input"]>;
  market_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  market_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  market_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  market_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  market_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  market_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<ConditionalEvent_Filter>>>;
  transactionHash?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  transactionHash_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  type_contains?: InputMaybe<Scalars["String"]["input"]>;
  type_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  type_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  type_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  type_gt?: InputMaybe<Scalars["String"]["input"]>;
  type_gte?: InputMaybe<Scalars["String"]["input"]>;
  type_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  type_lt?: InputMaybe<Scalars["String"]["input"]>;
  type_lte?: InputMaybe<Scalars["String"]["input"]>;
  type_not?: InputMaybe<Scalars["String"]["input"]>;
  type_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  type_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  type_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  type_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  type_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  type_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  type_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  type_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  type_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum ConditionalEvent_OrderBy {
  AccountId = "accountId",
  Amount = "amount",
  BlockNumber = "blockNumber",
  Collateral = "collateral",
  Id = "id",
  Market = "market",
  MarketBlockNumber = "market__blockNumber",
  MarketBlockTimestamp = "market__blockTimestamp",
  MarketCollateralToken = "market__collateralToken",
  MarketCollateralToken1 = "market__collateralToken1",
  MarketCollateralToken2 = "market__collateralToken2",
  MarketConditionId = "market__conditionId",
  MarketCreator = "market__creator",
  MarketFactory = "market__factory",
  MarketFinalizeTs = "market__finalizeTs",
  MarketHasAnswers = "market__hasAnswers",
  MarketId = "market__id",
  MarketIndex = "market__index",
  MarketLowerBound = "market__lowerBound",
  MarketMarketName = "market__marketName",
  MarketOpeningTs = "market__openingTs",
  MarketOutcomesSupply = "market__outcomesSupply",
  MarketParentCollectionId = "market__parentCollectionId",
  MarketParentOutcome = "market__parentOutcome",
  MarketPayoutReported = "market__payoutReported",
  MarketQuestionId = "market__questionId",
  MarketQuestionsInArbitration = "market__questionsInArbitration",
  MarketTemplateId = "market__templateId",
  MarketTransactionHash = "market__transactionHash",
  MarketType = "market__type",
  MarketUpperBound = "market__upperBound",
  TransactionHash = "transactionHash",
  Type = "type",
}

export type CurateMetadata = {
  __typename?: "CurateMetadata";
  /** The current removal meta evidence URI */
  clearingMetaEvidenceURI: Scalars["String"]["output"];
  /** The registry address */
  id: Scalars["Bytes"]["output"];
  /** The number of MetaEvidence event logs emitted. */
  metaEvidenceCount: Scalars["BigInt"]["output"];
  /** The current registration meta evidence URI */
  registrationMetaEvidenceURI: Scalars["String"]["output"];
};

export type CurateMetadata_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<CurateMetadata_Filter>>>;
  clearingMetaEvidenceURI?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_contains?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_gt?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_gte?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  clearingMetaEvidenceURI_lt?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_lte?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  clearingMetaEvidenceURI_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidenceURI_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  metaEvidenceCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  metaEvidenceCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<CurateMetadata_Filter>>>;
  registrationMetaEvidenceURI?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_gt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_gte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidenceURI_lt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_lte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidenceURI_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidenceURI_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum CurateMetadata_OrderBy {
  ClearingMetaEvidenceUri = "clearingMetaEvidenceURI",
  Id = "id",
  MetaEvidenceCount = "metaEvidenceCount",
  RegistrationMetaEvidenceUri = "registrationMetaEvidenceURI",
}

export type Market = {
  __typename?: "Market";
  blockNumber: Scalars["BigInt"]["output"];
  blockTimestamp: Scalars["BigInt"]["output"];
  childMarkets: Array<Market>;
  /**  collateral token for Generic markets. It's either the MarketFactory's collateralToken or the parentMarket corresponding wrapped token  */
  collateralToken: Scalars["Bytes"]["output"];
  /**  collateral token 1 for Futarchy markets  */
  collateralToken1: Scalars["Bytes"]["output"];
  /**  collateral token 2 for Futarchy markets  */
  collateralToken2: Scalars["Bytes"]["output"];
  conditionId: Scalars["Bytes"]["output"];
  creator: Scalars["Bytes"]["output"];
  ctfCondition: Condition;
  encodedQuestions: Array<Scalars["String"]["output"]>;
  factory: Scalars["Bytes"]["output"];
  /**  finalizeTs is equal to 33260976000 (random big number) if there is any unanswered question, otherwise it contains the finalizeTs value of the lattest question. This allows us to filter multi scalar markets using `finalizeTs > now` for markets with pending answers, and `finalizeTs < now` for markets with pending execution  */
  finalizeTs: Scalars["BigInt"]["output"];
  hasAnswers: Scalars["Boolean"]["output"];
  id: Scalars["ID"]["output"];
  index: Scalars["BigInt"]["output"];
  lowerBound: Scalars["BigInt"]["output"];
  marketName: Scalars["String"]["output"];
  openingTs: Scalars["BigInt"]["output"];
  outcomes: Array<Scalars["String"]["output"]>;
  outcomesSupply: Scalars["BigInt"]["output"];
  parentCollectionId: Scalars["Bytes"]["output"];
  parentMarket?: Maybe<Market>;
  parentOutcome: Scalars["BigInt"]["output"];
  payoutNumerators: Array<Scalars["BigInt"]["output"]>;
  payoutReported: Scalars["Boolean"]["output"];
  questionId: Scalars["Bytes"]["output"];
  questions: Array<MarketQuestion>;
  questionsInArbitration: Scalars["BigInt"]["output"];
  templateId: Scalars["BigInt"]["output"];
  transactionHash: Scalars["Bytes"]["output"];
  type: MarketType;
  upperBound: Scalars["BigInt"]["output"];
  wrappedTokens: Array<Scalars["Bytes"]["output"]>;
};

export type MarketChildMarketsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Market_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Market_Filter>;
};

export type MarketQuestionsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<MarketQuestion_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<MarketQuestion_Filter>;
};

export type MarketQuestion = {
  __typename?: "MarketQuestion";
  /**  baseQuestion is the original question that was created when the market was created  */
  baseQuestion: Question;
  id: Scalars["ID"]["output"];
  /**  a market can have the same question multiple times, we use the index to identify each one of them  */
  index: Scalars["Int"]["output"];
  market: Market;
  /**  question is the latest question if the original question was reopened, otherwise it's the same as baseQuestion  */
  question: Question;
};

export type MarketQuestion_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<MarketQuestion_Filter>>>;
  baseQuestion?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_?: InputMaybe<Question_Filter>;
  baseQuestion_contains?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_gt?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_gte?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  baseQuestion_lt?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_lte?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  baseQuestion_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  baseQuestion_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  index?: InputMaybe<Scalars["Int"]["input"]>;
  index_gt?: InputMaybe<Scalars["Int"]["input"]>;
  index_gte?: InputMaybe<Scalars["Int"]["input"]>;
  index_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  index_lt?: InputMaybe<Scalars["Int"]["input"]>;
  index_lte?: InputMaybe<Scalars["Int"]["input"]>;
  index_not?: InputMaybe<Scalars["Int"]["input"]>;
  index_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  market?: InputMaybe<Scalars["String"]["input"]>;
  market_?: InputMaybe<Market_Filter>;
  market_contains?: InputMaybe<Scalars["String"]["input"]>;
  market_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  market_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_gt?: InputMaybe<Scalars["String"]["input"]>;
  market_gte?: InputMaybe<Scalars["String"]["input"]>;
  market_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  market_lt?: InputMaybe<Scalars["String"]["input"]>;
  market_lte?: InputMaybe<Scalars["String"]["input"]>;
  market_not?: InputMaybe<Scalars["String"]["input"]>;
  market_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  market_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  market_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  market_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  market_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  market_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  market_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<MarketQuestion_Filter>>>;
  question?: InputMaybe<Scalars["String"]["input"]>;
  question_?: InputMaybe<Question_Filter>;
  question_contains?: InputMaybe<Scalars["String"]["input"]>;
  question_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  question_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  question_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  question_gt?: InputMaybe<Scalars["String"]["input"]>;
  question_gte?: InputMaybe<Scalars["String"]["input"]>;
  question_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  question_lt?: InputMaybe<Scalars["String"]["input"]>;
  question_lte?: InputMaybe<Scalars["String"]["input"]>;
  question_not?: InputMaybe<Scalars["String"]["input"]>;
  question_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  question_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  question_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  question_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  question_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  question_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  question_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  question_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  question_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum MarketQuestion_OrderBy {
  BaseQuestion = "baseQuestion",
  BaseQuestionArbitrationOccurred = "baseQuestion__arbitration_occurred",
  BaseQuestionArbitrator = "baseQuestion__arbitrator",
  BaseQuestionBestAnswer = "baseQuestion__best_answer",
  BaseQuestionBond = "baseQuestion__bond",
  BaseQuestionFinalizeTs = "baseQuestion__finalize_ts",
  BaseQuestionId = "baseQuestion__id",
  BaseQuestionIndex = "baseQuestion__index",
  BaseQuestionIsPendingArbitration = "baseQuestion__is_pending_arbitration",
  BaseQuestionMinBond = "baseQuestion__min_bond",
  BaseQuestionOpeningTs = "baseQuestion__opening_ts",
  BaseQuestionTimeout = "baseQuestion__timeout",
  Id = "id",
  Index = "index",
  Market = "market",
  MarketBlockNumber = "market__blockNumber",
  MarketBlockTimestamp = "market__blockTimestamp",
  MarketCollateralToken = "market__collateralToken",
  MarketCollateralToken1 = "market__collateralToken1",
  MarketCollateralToken2 = "market__collateralToken2",
  MarketConditionId = "market__conditionId",
  MarketCreator = "market__creator",
  MarketFactory = "market__factory",
  MarketFinalizeTs = "market__finalizeTs",
  MarketHasAnswers = "market__hasAnswers",
  MarketId = "market__id",
  MarketIndex = "market__index",
  MarketLowerBound = "market__lowerBound",
  MarketMarketName = "market__marketName",
  MarketOpeningTs = "market__openingTs",
  MarketOutcomesSupply = "market__outcomesSupply",
  MarketParentCollectionId = "market__parentCollectionId",
  MarketParentOutcome = "market__parentOutcome",
  MarketPayoutReported = "market__payoutReported",
  MarketQuestionId = "market__questionId",
  MarketQuestionsInArbitration = "market__questionsInArbitration",
  MarketTemplateId = "market__templateId",
  MarketTransactionHash = "market__transactionHash",
  MarketType = "market__type",
  MarketUpperBound = "market__upperBound",
  Question = "question",
  QuestionArbitrationOccurred = "question__arbitration_occurred",
  QuestionArbitrator = "question__arbitrator",
  QuestionBestAnswer = "question__best_answer",
  QuestionBond = "question__bond",
  QuestionFinalizeTs = "question__finalize_ts",
  QuestionId = "question__id",
  QuestionIndex = "question__index",
  QuestionIsPendingArbitration = "question__is_pending_arbitration",
  QuestionMinBond = "question__min_bond",
  QuestionOpeningTs = "question__opening_ts",
  QuestionTimeout = "question__timeout",
}

export enum MarketType {
  Futarchy = "Futarchy",
  Generic = "Generic",
}

export type Market_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Market_Filter>>>;
  blockNumber?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  blockNumber_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  blockTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  blockTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  childMarkets_?: InputMaybe<Market_Filter>;
  collateralToken?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  collateralToken1_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken1_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  collateralToken2?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  collateralToken2_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken2_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  collateralToken_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  collateralToken_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  collateralToken_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  conditionId?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  conditionId_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  conditionId_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  creator?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  creator_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  creator_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  ctfCondition?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_?: InputMaybe<Condition_Filter>;
  ctfCondition_contains?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_gt?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_gte?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  ctfCondition_lt?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_lte?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  ctfCondition_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  ctfCondition_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  encodedQuestions?: InputMaybe<Array<Scalars["String"]["input"]>>;
  encodedQuestions_contains?: InputMaybe<Array<Scalars["String"]["input"]>>;
  encodedQuestions_contains_nocase?: InputMaybe<Array<Scalars["String"]["input"]>>;
  encodedQuestions_not?: InputMaybe<Array<Scalars["String"]["input"]>>;
  encodedQuestions_not_contains?: InputMaybe<Array<Scalars["String"]["input"]>>;
  encodedQuestions_not_contains_nocase?: InputMaybe<Array<Scalars["String"]["input"]>>;
  factory?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  factory_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  factory_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  finalizeTs?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalizeTs_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalizeTs_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalizeTs_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  finalizeTs_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalizeTs_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalizeTs_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalizeTs_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  hasAnswers?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasAnswers_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasAnswers_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasAnswers_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  index?: InputMaybe<Scalars["BigInt"]["input"]>;
  index_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  index_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  index_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  index_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  index_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  index_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  index_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lowerBound?: InputMaybe<Scalars["BigInt"]["input"]>;
  lowerBound_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lowerBound_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lowerBound_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lowerBound_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lowerBound_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lowerBound_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  lowerBound_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  marketName?: InputMaybe<Scalars["String"]["input"]>;
  marketName_contains?: InputMaybe<Scalars["String"]["input"]>;
  marketName_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  marketName_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  marketName_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  marketName_gt?: InputMaybe<Scalars["String"]["input"]>;
  marketName_gte?: InputMaybe<Scalars["String"]["input"]>;
  marketName_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  marketName_lt?: InputMaybe<Scalars["String"]["input"]>;
  marketName_lte?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  marketName_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  marketName_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  marketName_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  marketName_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  openingTs?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTs_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTs_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTs_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  openingTs_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTs_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTs_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTs_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Market_Filter>>>;
  outcomes?: InputMaybe<Array<Scalars["String"]["input"]>>;
  outcomesSupply?: InputMaybe<Scalars["BigInt"]["input"]>;
  outcomesSupply_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  outcomesSupply_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  outcomesSupply_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  outcomesSupply_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  outcomesSupply_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  outcomesSupply_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  outcomesSupply_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  outcomes_contains?: InputMaybe<Array<Scalars["String"]["input"]>>;
  outcomes_contains_nocase?: InputMaybe<Array<Scalars["String"]["input"]>>;
  outcomes_not?: InputMaybe<Array<Scalars["String"]["input"]>>;
  outcomes_not_contains?: InputMaybe<Array<Scalars["String"]["input"]>>;
  outcomes_not_contains_nocase?: InputMaybe<Array<Scalars["String"]["input"]>>;
  parentCollectionId?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  parentCollectionId_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  parentCollectionId_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  parentMarket?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_?: InputMaybe<Market_Filter>;
  parentMarket_contains?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_gt?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_gte?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  parentMarket_lt?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_lte?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  parentMarket_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  parentMarket_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentOutcome?: InputMaybe<Scalars["BigInt"]["input"]>;
  parentOutcome_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  parentOutcome_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  parentOutcome_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  parentOutcome_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  parentOutcome_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  parentOutcome_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  parentOutcome_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutNumerators?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutNumerators_contains?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutNumerators_contains_nocase?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutNumerators_not?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutNumerators_not_contains?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutNumerators_not_contains_nocase?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  payoutReported?: InputMaybe<Scalars["Boolean"]["input"]>;
  payoutReported_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  payoutReported_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  payoutReported_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  questionId?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  questionId_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  questionId_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  questionsInArbitration?: InputMaybe<Scalars["BigInt"]["input"]>;
  questionsInArbitration_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  questionsInArbitration_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  questionsInArbitration_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  questionsInArbitration_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  questionsInArbitration_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  questionsInArbitration_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  questionsInArbitration_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  questions_?: InputMaybe<MarketQuestion_Filter>;
  templateId?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  templateId_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  transactionHash?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  transactionHash_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  transactionHash_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  type?: InputMaybe<MarketType>;
  type_in?: InputMaybe<Array<MarketType>>;
  type_not?: InputMaybe<MarketType>;
  type_not_in?: InputMaybe<Array<MarketType>>;
  upperBound?: InputMaybe<Scalars["BigInt"]["input"]>;
  upperBound_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  upperBound_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  upperBound_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  upperBound_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  upperBound_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  upperBound_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  upperBound_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  wrappedTokens?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  wrappedTokens_contains?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  wrappedTokens_contains_nocase?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  wrappedTokens_not?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  wrappedTokens_not_contains?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  wrappedTokens_not_contains_nocase?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Market_OrderBy {
  BlockNumber = "blockNumber",
  BlockTimestamp = "blockTimestamp",
  ChildMarkets = "childMarkets",
  CollateralToken = "collateralToken",
  CollateralToken1 = "collateralToken1",
  CollateralToken2 = "collateralToken2",
  ConditionId = "conditionId",
  Creator = "creator",
  CtfCondition = "ctfCondition",
  CtfConditionId = "ctfCondition__id",
  EncodedQuestions = "encodedQuestions",
  Factory = "factory",
  FinalizeTs = "finalizeTs",
  HasAnswers = "hasAnswers",
  Id = "id",
  Index = "index",
  LowerBound = "lowerBound",
  MarketName = "marketName",
  OpeningTs = "openingTs",
  Outcomes = "outcomes",
  OutcomesSupply = "outcomesSupply",
  ParentCollectionId = "parentCollectionId",
  ParentMarket = "parentMarket",
  ParentMarketBlockNumber = "parentMarket__blockNumber",
  ParentMarketBlockTimestamp = "parentMarket__blockTimestamp",
  ParentMarketCollateralToken = "parentMarket__collateralToken",
  ParentMarketCollateralToken1 = "parentMarket__collateralToken1",
  ParentMarketCollateralToken2 = "parentMarket__collateralToken2",
  ParentMarketConditionId = "parentMarket__conditionId",
  ParentMarketCreator = "parentMarket__creator",
  ParentMarketFactory = "parentMarket__factory",
  ParentMarketFinalizeTs = "parentMarket__finalizeTs",
  ParentMarketHasAnswers = "parentMarket__hasAnswers",
  ParentMarketId = "parentMarket__id",
  ParentMarketIndex = "parentMarket__index",
  ParentMarketLowerBound = "parentMarket__lowerBound",
  ParentMarketMarketName = "parentMarket__marketName",
  ParentMarketOpeningTs = "parentMarket__openingTs",
  ParentMarketOutcomesSupply = "parentMarket__outcomesSupply",
  ParentMarketParentCollectionId = "parentMarket__parentCollectionId",
  ParentMarketParentOutcome = "parentMarket__parentOutcome",
  ParentMarketPayoutReported = "parentMarket__payoutReported",
  ParentMarketQuestionId = "parentMarket__questionId",
  ParentMarketQuestionsInArbitration = "parentMarket__questionsInArbitration",
  ParentMarketTemplateId = "parentMarket__templateId",
  ParentMarketTransactionHash = "parentMarket__transactionHash",
  ParentMarketType = "parentMarket__type",
  ParentMarketUpperBound = "parentMarket__upperBound",
  ParentOutcome = "parentOutcome",
  PayoutNumerators = "payoutNumerators",
  PayoutReported = "payoutReported",
  QuestionId = "questionId",
  Questions = "questions",
  QuestionsInArbitration = "questionsInArbitration",
  TemplateId = "templateId",
  TransactionHash = "transactionHash",
  Type = "type",
  UpperBound = "upperBound",
  WrappedTokens = "wrappedTokens",
}

export type MarketsCount = {
  __typename?: "MarketsCount";
  count: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
};

export type MarketsCount_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<MarketsCount_Filter>>>;
  count?: InputMaybe<Scalars["BigInt"]["input"]>;
  count_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  count_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  count_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  count_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  count_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  count_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  count_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<MarketsCount_Filter>>>;
};

export enum MarketsCount_OrderBy {
  Count = "count",
  Id = "id",
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = "asc",
  Desc = "desc",
}

export type Query = {
  __typename?: "Query";
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  arbitratorMetadata?: Maybe<ArbitratorMetadata>;
  arbitratorMetadata_collection: Array<ArbitratorMetadata>;
  condition?: Maybe<Condition>;
  conditionalEvent?: Maybe<ConditionalEvent>;
  conditionalEvents: Array<ConditionalEvent>;
  conditions: Array<Condition>;
  curateMetadata?: Maybe<CurateMetadata>;
  curateMetadata_collection: Array<CurateMetadata>;
  market?: Maybe<Market>;
  marketQuestion?: Maybe<MarketQuestion>;
  marketQuestions: Array<MarketQuestion>;
  markets: Array<Market>;
  marketsCount?: Maybe<MarketsCount>;
  marketsCounts: Array<MarketsCount>;
  question?: Maybe<Question>;
  questions: Array<Question>;
};

export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};

export type QueryArbitratorMetadataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryArbitratorMetadata_CollectionArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ArbitratorMetadata_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ArbitratorMetadata_Filter>;
};

export type QueryConditionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryConditionalEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryConditionalEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ConditionalEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ConditionalEvent_Filter>;
};

export type QueryConditionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Condition_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Condition_Filter>;
};

export type QueryCurateMetadataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryCurateMetadata_CollectionArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<CurateMetadata_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<CurateMetadata_Filter>;
};

export type QueryMarketArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMarketQuestionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMarketQuestionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<MarketQuestion_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MarketQuestion_Filter>;
};

export type QueryMarketsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Market_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Market_Filter>;
};

export type QueryMarketsCountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMarketsCountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<MarketsCount_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MarketsCount_Filter>;
};

export type QueryQuestionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryQuestionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Question_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Question_Filter>;
};

export type Question = {
  __typename?: "Question";
  arbitration_occurred: Scalars["Boolean"]["output"];
  arbitrator: Scalars["Bytes"]["output"];
  /**  MarketQuestion's that have this Question as the baseQuestion  */
  baseQuestions: Array<MarketQuestion>;
  best_answer: Scalars["Bytes"]["output"];
  bond: Scalars["BigInt"]["output"];
  finalize_ts: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  index: Scalars["Int"]["output"];
  is_pending_arbitration: Scalars["Boolean"]["output"];
  /**  MarketQuestion's that have this Question as the current question  */
  marketQuestions: Array<MarketQuestion>;
  min_bond: Scalars["BigInt"]["output"];
  opening_ts: Scalars["BigInt"]["output"];
  timeout: Scalars["BigInt"]["output"];
};

export type QuestionBaseQuestionsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<MarketQuestion_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<MarketQuestion_Filter>;
};

export type QuestionMarketQuestionsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<MarketQuestion_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<MarketQuestion_Filter>;
};

export type Question_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Question_Filter>>>;
  arbitration_occurred?: InputMaybe<Scalars["Boolean"]["input"]>;
  arbitration_occurred_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  arbitration_occurred_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  arbitration_occurred_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  arbitrator?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitrator_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  baseQuestions_?: InputMaybe<MarketQuestion_Filter>;
  best_answer?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  best_answer_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  best_answer_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  bond?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  bond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  finalize_ts?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalize_ts_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalize_ts_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalize_ts_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  finalize_ts_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalize_ts_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalize_ts_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalize_ts_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  index?: InputMaybe<Scalars["Int"]["input"]>;
  index_gt?: InputMaybe<Scalars["Int"]["input"]>;
  index_gte?: InputMaybe<Scalars["Int"]["input"]>;
  index_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  index_lt?: InputMaybe<Scalars["Int"]["input"]>;
  index_lte?: InputMaybe<Scalars["Int"]["input"]>;
  index_not?: InputMaybe<Scalars["Int"]["input"]>;
  index_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  is_pending_arbitration?: InputMaybe<Scalars["Boolean"]["input"]>;
  is_pending_arbitration_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  is_pending_arbitration_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  is_pending_arbitration_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  marketQuestions_?: InputMaybe<MarketQuestion_Filter>;
  min_bond?: InputMaybe<Scalars["BigInt"]["input"]>;
  min_bond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  min_bond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  min_bond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  min_bond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  min_bond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  min_bond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  min_bond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  opening_ts?: InputMaybe<Scalars["BigInt"]["input"]>;
  opening_ts_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  opening_ts_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  opening_ts_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  opening_ts_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  opening_ts_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  opening_ts_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  opening_ts_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Question_Filter>>>;
  timeout?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timeout_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
};

export enum Question_OrderBy {
  ArbitrationOccurred = "arbitration_occurred",
  Arbitrator = "arbitrator",
  BaseQuestions = "baseQuestions",
  BestAnswer = "best_answer",
  Bond = "bond",
  FinalizeTs = "finalize_ts",
  Id = "id",
  Index = "index",
  IsPendingArbitration = "is_pending_arbitration",
  MarketQuestions = "marketQuestions",
  MinBond = "min_bond",
  OpeningTs = "opening_ts",
  Timeout = "timeout",
}

export type _Block_ = {
  __typename?: "_Block_";
  /** The hash of the block */
  hash?: Maybe<Scalars["Bytes"]["output"]>;
  /** The block number */
  number: Scalars["Int"]["output"];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars["Bytes"]["output"]>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars["Int"]["output"]>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: "_Meta_";
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars["String"]["output"];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars["Boolean"]["output"];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = "allow",
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = "deny",
}

export type QuestionFragment = {
  __typename?: "Question";
  id: string;
  index: number;
  arbitrator: `0x${string}`;
  opening_ts: string;
  timeout: string;
  finalize_ts: string;
  is_pending_arbitration: boolean;
  best_answer: `0x${string}`;
  bond: string;
  min_bond: string;
};

export type MarketFragment = {
  __typename?: "Market";
  id: string;
  type: MarketType;
  marketName: string;
  outcomes: Array<string>;
  wrappedTokens: Array<`0x${string}`>;
  collateralToken: `0x${string}`;
  collateralToken1: `0x${string}`;
  collateralToken2: `0x${string}`;
  parentOutcome: string;
  parentCollectionId: `0x${string}`;
  conditionId: `0x${string}`;
  questionId: `0x${string}`;
  templateId: string;
  hasAnswers: boolean;
  questionsInArbitration: string;
  openingTs: string;
  finalizeTs: string;
  encodedQuestions: Array<string>;
  lowerBound: string;
  upperBound: string;
  payoutReported: boolean;
  payoutNumerators: Array<string>;
  factory: `0x${string}`;
  creator: `0x${string}`;
  outcomesSupply: string;
  blockTimestamp: string;
  transactionHash: `0x${string}`;
  parentMarket?: {
    __typename?: "Market";
    id: string;
    payoutReported: boolean;
    conditionId: `0x${string}`;
    payoutNumerators: Array<string>;
  } | null;
  questions: Array<{
    __typename?: "MarketQuestion";
    question: {
      __typename?: "Question";
      id: string;
      arbitrator: `0x${string}`;
      opening_ts: string;
      timeout: string;
      finalize_ts: string;
      is_pending_arbitration: boolean;
      best_answer: `0x${string}`;
      bond: string;
      min_bond: string;
      index: number;
    };
    baseQuestion: { __typename?: "Question"; id: string };
  }>;
};

export type GetMarketsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Market_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Market_Filter>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetMarketsQuery = {
  __typename?: "Query";
  markets: Array<{
    __typename?: "Market";
    id: string;
    type: MarketType;
    marketName: string;
    outcomes: Array<string>;
    wrappedTokens: Array<`0x${string}`>;
    collateralToken: `0x${string}`;
    collateralToken1: `0x${string}`;
    collateralToken2: `0x${string}`;
    parentOutcome: string;
    parentCollectionId: `0x${string}`;
    conditionId: `0x${string}`;
    questionId: `0x${string}`;
    templateId: string;
    hasAnswers: boolean;
    questionsInArbitration: string;
    openingTs: string;
    finalizeTs: string;
    encodedQuestions: Array<string>;
    lowerBound: string;
    upperBound: string;
    payoutReported: boolean;
    payoutNumerators: Array<string>;
    factory: `0x${string}`;
    creator: `0x${string}`;
    outcomesSupply: string;
    blockTimestamp: string;
    transactionHash: `0x${string}`;
    parentMarket?: {
      __typename?: "Market";
      id: string;
      payoutReported: boolean;
      conditionId: `0x${string}`;
      payoutNumerators: Array<string>;
    } | null;
    questions: Array<{
      __typename?: "MarketQuestion";
      question: {
        __typename?: "Question";
        id: string;
        arbitrator: `0x${string}`;
        opening_ts: string;
        timeout: string;
        finalize_ts: string;
        is_pending_arbitration: boolean;
        best_answer: `0x${string}`;
        bond: string;
        min_bond: string;
        index: number;
      };
      baseQuestion: { __typename?: "Question"; id: string };
    }>;
  }>;
};

export type GetMarketQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetMarketQuery = {
  __typename?: "Query";
  market?: {
    __typename?: "Market";
    id: string;
    type: MarketType;
    marketName: string;
    outcomes: Array<string>;
    wrappedTokens: Array<`0x${string}`>;
    collateralToken: `0x${string}`;
    collateralToken1: `0x${string}`;
    collateralToken2: `0x${string}`;
    parentOutcome: string;
    parentCollectionId: `0x${string}`;
    conditionId: `0x${string}`;
    questionId: `0x${string}`;
    templateId: string;
    hasAnswers: boolean;
    questionsInArbitration: string;
    openingTs: string;
    finalizeTs: string;
    encodedQuestions: Array<string>;
    lowerBound: string;
    upperBound: string;
    payoutReported: boolean;
    payoutNumerators: Array<string>;
    factory: `0x${string}`;
    creator: `0x${string}`;
    outcomesSupply: string;
    blockTimestamp: string;
    transactionHash: `0x${string}`;
    parentMarket?: {
      __typename?: "Market";
      id: string;
      payoutReported: boolean;
      conditionId: `0x${string}`;
      payoutNumerators: Array<string>;
    } | null;
    questions: Array<{
      __typename?: "MarketQuestion";
      question: {
        __typename?: "Question";
        id: string;
        arbitrator: `0x${string}`;
        opening_ts: string;
        timeout: string;
        finalize_ts: string;
        is_pending_arbitration: boolean;
        best_answer: `0x${string}`;
        bond: string;
        min_bond: string;
        index: number;
      };
      baseQuestion: { __typename?: "Question"; id: string };
    }>;
  } | null;
};

export type GetConditionalEventsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ConditionalEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ConditionalEvent_Filter>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetConditionalEventsQuery = {
  __typename?: "Query";
  conditionalEvents: Array<{
    __typename?: "ConditionalEvent";
    id: `0x${string}`;
    accountId: `0x${string}`;
    type: string;
    amount: string;
    blockNumber: string;
    collateral: `0x${string}`;
    transactionHash: `0x${string}`;
    market: { __typename?: "Market"; id: string; marketName: string };
  }>;
};

export type GetCurateMetadataQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetCurateMetadataQuery = {
  __typename?: "Query";
  curateMetadata?: { __typename?: "CurateMetadata"; registrationMetaEvidenceURI: string } | null;
};

export type GetArbitratorMetadataQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetArbitratorMetadataQuery = {
  __typename?: "Query";
  arbitratorMetadata?: { __typename?: "ArbitratorMetadata"; registrationMetaEvidenceURI: string } | null;
};

export const QuestionFragmentDoc = gql`
    fragment Question on Question {
  id
  index
  arbitrator
  opening_ts
  timeout
  finalize_ts
  is_pending_arbitration
  best_answer
  bond
  min_bond
}
    `;
export const MarketFragmentDoc = gql`
    fragment Market on Market {
  id
  type
  marketName
  outcomes
  wrappedTokens
  collateralToken
  collateralToken1
  collateralToken2
  parentMarket {
    id
    payoutReported
    conditionId
    payoutNumerators
  }
  parentOutcome
  parentCollectionId
  conditionId
  questionId
  templateId
  hasAnswers
  questionsInArbitration
  questions {
    question {
      id
      arbitrator
      opening_ts
      timeout
      finalize_ts
      is_pending_arbitration
      best_answer
      bond
      min_bond
      index
    }
    baseQuestion {
      id
    }
  }
  openingTs
  finalizeTs
  encodedQuestions
  lowerBound
  upperBound
  payoutReported
  payoutNumerators
  factory
  creator
  outcomesSupply
  blockTimestamp
  transactionHash
}
    `;
export const GetMarketsDocument = gql`
    query GetMarkets($skip: Int = 0, $first: Int = 100, $orderBy: Market_orderBy, $orderDirection: OrderDirection, $where: Market_filter, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  markets(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    ...Market
  }
}
    ${MarketFragmentDoc}`;
export const GetMarketDocument = gql`
    query GetMarket($id: ID!) {
  market(id: $id) {
    ...Market
  }
}
    ${MarketFragmentDoc}`;
export const GetConditionalEventsDocument = gql`
    query GetConditionalEvents($skip: Int = 0, $first: Int = 100, $orderBy: ConditionalEvent_orderBy, $orderDirection: OrderDirection, $where: ConditionalEvent_filter, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  conditionalEvents(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    id
    market {
      id
      marketName
    }
    accountId
    type
    amount
    blockNumber
    collateral
    transactionHash
  }
}
    `;
export const GetCurateMetadataDocument = gql`
    query GetCurateMetadata($id: ID!) {
  curateMetadata(id: $id) {
    registrationMetaEvidenceURI
  }
}
    `;
export const GetArbitratorMetadataDocument = gql`
    query GetArbitratorMetadata($id: ID!) {
  arbitratorMetadata(id: $id) {
    registrationMetaEvidenceURI
  }
}
    `;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetMarkets(
      variables?: GetMarketsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetMarketsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetMarketsQuery>(GetMarketsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetMarkets",
        "query",
        variables,
      );
    },
    GetMarket(
      variables: GetMarketQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetMarketQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetMarketQuery>(GetMarketDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetMarket",
        "query",
        variables,
      );
    },
    GetConditionalEvents(
      variables?: GetConditionalEventsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetConditionalEventsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetConditionalEventsQuery>(GetConditionalEventsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetConditionalEvents",
        "query",
        variables,
      );
    },
    GetCurateMetadata(
      variables: GetCurateMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetCurateMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetCurateMetadataQuery>(GetCurateMetadataDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetCurateMetadata",
        "query",
        variables,
      );
    },
    GetArbitratorMetadata(
      variables: GetArbitratorMetadataQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetArbitratorMetadataQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetArbitratorMetadataQuery>(GetArbitratorMetadataDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetArbitratorMetadata",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
