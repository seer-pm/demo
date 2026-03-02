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

export type Answer = {
  __typename?: "Answer";
  answer?: Maybe<Scalars["Bytes"]["output"]>;
  bondAggregate: Scalars["BigInt"]["output"];
  createdBlock: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  lastBond: Scalars["BigInt"]["output"];
  question: Question;
  timestamp: Scalars["BigInt"]["output"];
};

export type Answer_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Answer_Filter>>>;
  answer?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  answer_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  bondAggregate?: InputMaybe<Scalars["BigInt"]["input"]>;
  bondAggregate_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bondAggregate_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bondAggregate_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  bondAggregate_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bondAggregate_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bondAggregate_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  bondAggregate_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  lastBond?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lastBond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Answer_Filter>>>;
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
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
};

export enum Answer_OrderBy {
  Answer = "answer",
  BondAggregate = "bondAggregate",
  CreatedBlock = "createdBlock",
  Id = "id",
  LastBond = "lastBond",
  Question = "question",
  QuestionAnswerFinalizedTimestamp = "question__answerFinalizedTimestamp",
  QuestionArbitrationOccurred = "question__arbitrationOccurred",
  QuestionArbitrationRequestedBy = "question__arbitrationRequestedBy",
  QuestionArbitrationRequestedTimestamp = "question__arbitrationRequestedTimestamp",
  QuestionArbitrator = "question__arbitrator",
  QuestionBounty = "question__bounty",
  QuestionContentHash = "question__contentHash",
  QuestionContract = "question__contract",
  QuestionCreatedBlock = "question__createdBlock",
  QuestionCreatedLogIndex = "question__createdLogIndex",
  QuestionCreatedTimestamp = "question__createdTimestamp",
  QuestionCumulativeBonds = "question__cumulativeBonds",
  QuestionCurrentAnswer = "question__currentAnswer",
  QuestionCurrentAnswerBond = "question__currentAnswerBond",
  QuestionCurrentAnswerTimestamp = "question__currentAnswerTimestamp",
  QuestionCurrentScheduledFinalizationTimestamp = "question__currentScheduledFinalizationTimestamp",
  QuestionData = "question__data",
  QuestionHistoryHash = "question__historyHash",
  QuestionId = "question__id",
  QuestionIsPendingArbitration = "question__isPendingArbitration",
  QuestionLastBond = "question__lastBond",
  QuestionMinBond = "question__minBond",
  QuestionOpeningTimestamp = "question__openingTimestamp",
  QuestionQCategory = "question__qCategory",
  QuestionQDescription = "question__qDescription",
  QuestionQJsonStr = "question__qJsonStr",
  QuestionQLang = "question__qLang",
  QuestionQTitle = "question__qTitle",
  QuestionQType = "question__qType",
  QuestionQuestionId = "question__questionId",
  QuestionTimeout = "question__timeout",
  QuestionUpdatedBlock = "question__updatedBlock",
  QuestionUpdatedTimestamp = "question__updatedTimestamp",
  QuestionUser = "question__user",
  Timestamp = "timestamp",
}

export type BlockChangedFilter = {
  number_gte: Scalars["Int"]["input"];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars["Bytes"]["input"]>;
  number?: InputMaybe<Scalars["Int"]["input"]>;
  number_gte?: InputMaybe<Scalars["Int"]["input"]>;
};

export type Category = {
  __typename?: "Category";
  id: Scalars["ID"]["output"];
  numClosedConditions: Scalars["Int"]["output"];
  numConditions: Scalars["Int"]["output"];
  numOpenConditions: Scalars["Int"]["output"];
};

export type Category_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Category_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  numClosedConditions?: InputMaybe<Scalars["Int"]["input"]>;
  numClosedConditions_gt?: InputMaybe<Scalars["Int"]["input"]>;
  numClosedConditions_gte?: InputMaybe<Scalars["Int"]["input"]>;
  numClosedConditions_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  numClosedConditions_lt?: InputMaybe<Scalars["Int"]["input"]>;
  numClosedConditions_lte?: InputMaybe<Scalars["Int"]["input"]>;
  numClosedConditions_not?: InputMaybe<Scalars["Int"]["input"]>;
  numClosedConditions_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  numConditions?: InputMaybe<Scalars["Int"]["input"]>;
  numConditions_gt?: InputMaybe<Scalars["Int"]["input"]>;
  numConditions_gte?: InputMaybe<Scalars["Int"]["input"]>;
  numConditions_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  numConditions_lt?: InputMaybe<Scalars["Int"]["input"]>;
  numConditions_lte?: InputMaybe<Scalars["Int"]["input"]>;
  numConditions_not?: InputMaybe<Scalars["Int"]["input"]>;
  numConditions_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  numOpenConditions?: InputMaybe<Scalars["Int"]["input"]>;
  numOpenConditions_gt?: InputMaybe<Scalars["Int"]["input"]>;
  numOpenConditions_gte?: InputMaybe<Scalars["Int"]["input"]>;
  numOpenConditions_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  numOpenConditions_lt?: InputMaybe<Scalars["Int"]["input"]>;
  numOpenConditions_lte?: InputMaybe<Scalars["Int"]["input"]>;
  numOpenConditions_not?: InputMaybe<Scalars["Int"]["input"]>;
  numOpenConditions_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Category_Filter>>>;
};

export enum Category_OrderBy {
  Id = "id",
  NumClosedConditions = "numClosedConditions",
  NumConditions = "numConditions",
  NumOpenConditions = "numOpenConditions",
}

export type Claim = {
  __typename?: "Claim";
  amount: Scalars["BigInt"]["output"];
  createdBlock: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  question: Question;
  user: Scalars["Bytes"]["output"];
};

export type Claim_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Claim_Filter>>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Claim_Filter>>>;
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
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Claim_OrderBy {
  Amount = "amount",
  CreatedBlock = "createdBlock",
  Id = "id",
  Question = "question",
  QuestionAnswerFinalizedTimestamp = "question__answerFinalizedTimestamp",
  QuestionArbitrationOccurred = "question__arbitrationOccurred",
  QuestionArbitrationRequestedBy = "question__arbitrationRequestedBy",
  QuestionArbitrationRequestedTimestamp = "question__arbitrationRequestedTimestamp",
  QuestionArbitrator = "question__arbitrator",
  QuestionBounty = "question__bounty",
  QuestionContentHash = "question__contentHash",
  QuestionContract = "question__contract",
  QuestionCreatedBlock = "question__createdBlock",
  QuestionCreatedLogIndex = "question__createdLogIndex",
  QuestionCreatedTimestamp = "question__createdTimestamp",
  QuestionCumulativeBonds = "question__cumulativeBonds",
  QuestionCurrentAnswer = "question__currentAnswer",
  QuestionCurrentAnswerBond = "question__currentAnswerBond",
  QuestionCurrentAnswerTimestamp = "question__currentAnswerTimestamp",
  QuestionCurrentScheduledFinalizationTimestamp = "question__currentScheduledFinalizationTimestamp",
  QuestionData = "question__data",
  QuestionHistoryHash = "question__historyHash",
  QuestionId = "question__id",
  QuestionIsPendingArbitration = "question__isPendingArbitration",
  QuestionLastBond = "question__lastBond",
  QuestionMinBond = "question__minBond",
  QuestionOpeningTimestamp = "question__openingTimestamp",
  QuestionQCategory = "question__qCategory",
  QuestionQDescription = "question__qDescription",
  QuestionQJsonStr = "question__qJsonStr",
  QuestionQLang = "question__qLang",
  QuestionQTitle = "question__qTitle",
  QuestionQType = "question__qType",
  QuestionQuestionId = "question__questionId",
  QuestionTimeout = "question__timeout",
  QuestionUpdatedBlock = "question__updatedBlock",
  QuestionUpdatedTimestamp = "question__updatedTimestamp",
  QuestionUser = "question__user",
  User = "user",
}

export type FactoryDeployment = {
  __typename?: "FactoryDeployment";
  createdBlock: Scalars["BigInt"]["output"];
  createdTimestamp: Scalars["BigInt"]["output"];
  factory: Scalars["Bytes"]["output"];
  id: Scalars["ID"]["output"];
  realityETH: Scalars["Bytes"]["output"];
  token_address: Scalars["Bytes"]["output"];
  token_decimals: Scalars["BigInt"]["output"];
  token_symbol: Scalars["String"]["output"];
};

export type FactoryDeployment_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<FactoryDeployment_Filter>>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
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
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<FactoryDeployment_Filter>>>;
  realityETH?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  realityETH_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  realityETH_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  token_address?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  token_address_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  token_address_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  token_decimals?: InputMaybe<Scalars["BigInt"]["input"]>;
  token_decimals_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  token_decimals_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  token_decimals_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token_decimals_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  token_decimals_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  token_decimals_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  token_decimals_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token_symbol?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_contains?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_gt?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_gte?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token_symbol_lt?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_lte?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token_symbol_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token_symbol_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum FactoryDeployment_OrderBy {
  CreatedBlock = "createdBlock",
  CreatedTimestamp = "createdTimestamp",
  Factory = "factory",
  Id = "id",
  RealityEth = "realityETH",
  TokenAddress = "token_address",
  TokenDecimals = "token_decimals",
  TokenSymbol = "token_symbol",
}

export type Fund = {
  __typename?: "Fund";
  amount: Scalars["BigInt"]["output"];
  createdBlock: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  question: Question;
  user: Scalars["Bytes"]["output"];
};

export type Fund_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Fund_Filter>>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Fund_Filter>>>;
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
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Fund_OrderBy {
  Amount = "amount",
  CreatedBlock = "createdBlock",
  Id = "id",
  Question = "question",
  QuestionAnswerFinalizedTimestamp = "question__answerFinalizedTimestamp",
  QuestionArbitrationOccurred = "question__arbitrationOccurred",
  QuestionArbitrationRequestedBy = "question__arbitrationRequestedBy",
  QuestionArbitrationRequestedTimestamp = "question__arbitrationRequestedTimestamp",
  QuestionArbitrator = "question__arbitrator",
  QuestionBounty = "question__bounty",
  QuestionContentHash = "question__contentHash",
  QuestionContract = "question__contract",
  QuestionCreatedBlock = "question__createdBlock",
  QuestionCreatedLogIndex = "question__createdLogIndex",
  QuestionCreatedTimestamp = "question__createdTimestamp",
  QuestionCumulativeBonds = "question__cumulativeBonds",
  QuestionCurrentAnswer = "question__currentAnswer",
  QuestionCurrentAnswerBond = "question__currentAnswerBond",
  QuestionCurrentAnswerTimestamp = "question__currentAnswerTimestamp",
  QuestionCurrentScheduledFinalizationTimestamp = "question__currentScheduledFinalizationTimestamp",
  QuestionData = "question__data",
  QuestionHistoryHash = "question__historyHash",
  QuestionId = "question__id",
  QuestionIsPendingArbitration = "question__isPendingArbitration",
  QuestionLastBond = "question__lastBond",
  QuestionMinBond = "question__minBond",
  QuestionOpeningTimestamp = "question__openingTimestamp",
  QuestionQCategory = "question__qCategory",
  QuestionQDescription = "question__qDescription",
  QuestionQJsonStr = "question__qJsonStr",
  QuestionQLang = "question__qLang",
  QuestionQTitle = "question__qTitle",
  QuestionQType = "question__qType",
  QuestionQuestionId = "question__questionId",
  QuestionTimeout = "question__timeout",
  QuestionUpdatedBlock = "question__updatedBlock",
  QuestionUpdatedTimestamp = "question__updatedTimestamp",
  QuestionUser = "question__user",
  User = "user",
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = "asc",
  Desc = "desc",
}

export type Outcome = {
  __typename?: "Outcome";
  answer: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  question: Question;
};

export type Outcome_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Outcome_Filter>>>;
  answer?: InputMaybe<Scalars["String"]["input"]>;
  answer_contains?: InputMaybe<Scalars["String"]["input"]>;
  answer_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  answer_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  answer_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  answer_gt?: InputMaybe<Scalars["String"]["input"]>;
  answer_gte?: InputMaybe<Scalars["String"]["input"]>;
  answer_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  answer_lt?: InputMaybe<Scalars["String"]["input"]>;
  answer_lte?: InputMaybe<Scalars["String"]["input"]>;
  answer_not?: InputMaybe<Scalars["String"]["input"]>;
  answer_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  answer_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  answer_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  answer_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  answer_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  answer_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  answer_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  answer_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  answer_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Outcome_Filter>>>;
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

export enum Outcome_OrderBy {
  Answer = "answer",
  Id = "id",
  Question = "question",
  QuestionAnswerFinalizedTimestamp = "question__answerFinalizedTimestamp",
  QuestionArbitrationOccurred = "question__arbitrationOccurred",
  QuestionArbitrationRequestedBy = "question__arbitrationRequestedBy",
  QuestionArbitrationRequestedTimestamp = "question__arbitrationRequestedTimestamp",
  QuestionArbitrator = "question__arbitrator",
  QuestionBounty = "question__bounty",
  QuestionContentHash = "question__contentHash",
  QuestionContract = "question__contract",
  QuestionCreatedBlock = "question__createdBlock",
  QuestionCreatedLogIndex = "question__createdLogIndex",
  QuestionCreatedTimestamp = "question__createdTimestamp",
  QuestionCumulativeBonds = "question__cumulativeBonds",
  QuestionCurrentAnswer = "question__currentAnswer",
  QuestionCurrentAnswerBond = "question__currentAnswerBond",
  QuestionCurrentAnswerTimestamp = "question__currentAnswerTimestamp",
  QuestionCurrentScheduledFinalizationTimestamp = "question__currentScheduledFinalizationTimestamp",
  QuestionData = "question__data",
  QuestionHistoryHash = "question__historyHash",
  QuestionId = "question__id",
  QuestionIsPendingArbitration = "question__isPendingArbitration",
  QuestionLastBond = "question__lastBond",
  QuestionMinBond = "question__minBond",
  QuestionOpeningTimestamp = "question__openingTimestamp",
  QuestionQCategory = "question__qCategory",
  QuestionQDescription = "question__qDescription",
  QuestionQJsonStr = "question__qJsonStr",
  QuestionQLang = "question__qLang",
  QuestionQTitle = "question__qTitle",
  QuestionQType = "question__qType",
  QuestionQuestionId = "question__questionId",
  QuestionTimeout = "question__timeout",
  QuestionUpdatedBlock = "question__updatedBlock",
  QuestionUpdatedTimestamp = "question__updatedTimestamp",
  QuestionUser = "question__user",
}

export type Query = {
  __typename?: "Query";
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  answer?: Maybe<Answer>;
  answers: Array<Answer>;
  categories: Array<Category>;
  category?: Maybe<Category>;
  claim?: Maybe<Claim>;
  claims: Array<Claim>;
  factoryDeployment?: Maybe<FactoryDeployment>;
  factoryDeployments: Array<FactoryDeployment>;
  fund?: Maybe<Fund>;
  funds: Array<Fund>;
  outcome?: Maybe<Outcome>;
  outcomes: Array<Outcome>;
  question?: Maybe<Question>;
  questions: Array<Question>;
  response?: Maybe<Response>;
  responses: Array<Response>;
  template?: Maybe<Template>;
  templates: Array<Template>;
  userAction?: Maybe<UserAction>;
  userActions: Array<UserAction>;
  withdrawal?: Maybe<Withdrawal>;
  withdrawals: Array<Withdrawal>;
};

export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};

export type QueryAnswerArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryAnswersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Answer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Answer_Filter>;
};

export type QueryCategoriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Category_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Category_Filter>;
};

export type QueryCategoryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryClaimArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryClaimsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Claim_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Claim_Filter>;
};

export type QueryFactoryDeploymentArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryFactoryDeploymentsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<FactoryDeployment_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<FactoryDeployment_Filter>;
};

export type QueryFundArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryFundsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Fund_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Fund_Filter>;
};

export type QueryOutcomeArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryOutcomesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Outcome_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Outcome_Filter>;
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

export type QueryResponseArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryResponsesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Response_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Response_Filter>;
};

export type QueryTemplateArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTemplatesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Template_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Template_Filter>;
};

export type QueryUserActionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUserActionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<UserAction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UserAction_Filter>;
};

export type QueryWithdrawalArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryWithdrawalsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Withdrawal_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Withdrawal_Filter>;
};

export type Question = {
  __typename?: "Question";
  answerFinalizedTimestamp?: Maybe<Scalars["BigInt"]["output"]>;
  answers?: Maybe<Array<Answer>>;
  arbitrationOccurred: Scalars["Boolean"]["output"];
  arbitrationRequestedBy?: Maybe<Scalars["String"]["output"]>;
  arbitrationRequestedTimestamp?: Maybe<Scalars["BigInt"]["output"]>;
  arbitrator: Scalars["Bytes"]["output"];
  bounty: Scalars["BigInt"]["output"];
  contentHash?: Maybe<Scalars["Bytes"]["output"]>;
  contract: Scalars["Bytes"]["output"];
  createdBlock: Scalars["BigInt"]["output"];
  createdLogIndex: Scalars["BigInt"]["output"];
  createdTimestamp: Scalars["BigInt"]["output"];
  cumulativeBonds: Scalars["BigInt"]["output"];
  currentAnswer?: Maybe<Scalars["Bytes"]["output"]>;
  currentAnswerBond: Scalars["BigInt"]["output"];
  currentAnswerTimestamp?: Maybe<Scalars["BigInt"]["output"]>;
  currentScheduledFinalizationTimestamp: Scalars["BigInt"]["output"];
  data: Scalars["String"]["output"];
  historyHash?: Maybe<Scalars["Bytes"]["output"]>;
  id: Scalars["ID"]["output"];
  isPendingArbitration: Scalars["Boolean"]["output"];
  lastBond: Scalars["BigInt"]["output"];
  minBond: Scalars["BigInt"]["output"];
  openingTimestamp: Scalars["BigInt"]["output"];
  outcomes?: Maybe<Array<Outcome>>;
  qCategory?: Maybe<Scalars["String"]["output"]>;
  qDescription?: Maybe<Scalars["String"]["output"]>;
  qJsonStr?: Maybe<Scalars["String"]["output"]>;
  qLang?: Maybe<Scalars["String"]["output"]>;
  qTitle?: Maybe<Scalars["String"]["output"]>;
  qType?: Maybe<Scalars["String"]["output"]>;
  questionId: Scalars["Bytes"]["output"];
  reopenedBy?: Maybe<Question>;
  reopens?: Maybe<Question>;
  responses?: Maybe<Array<Response>>;
  template?: Maybe<Template>;
  timeout: Scalars["BigInt"]["output"];
  updatedBlock: Scalars["BigInt"]["output"];
  updatedTimestamp: Scalars["BigInt"]["output"];
  user: Scalars["Bytes"]["output"];
};

export type QuestionAnswersArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Answer_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Answer_Filter>;
};

export type QuestionOutcomesArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Outcome_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Outcome_Filter>;
};

export type QuestionResponsesArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Response_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Response_Filter>;
};

export type Question_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Question_Filter>>>;
  answerFinalizedTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  answerFinalizedTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  answerFinalizedTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  answerFinalizedTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  answerFinalizedTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  answerFinalizedTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  answerFinalizedTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  answerFinalizedTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  answers_?: InputMaybe<Answer_Filter>;
  arbitrationOccurred?: InputMaybe<Scalars["Boolean"]["input"]>;
  arbitrationOccurred_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  arbitrationOccurred_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  arbitrationOccurred_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  arbitrationRequestedBy?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_contains?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_gt?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_gte?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  arbitrationRequestedBy_lt?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_lte?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  arbitrationRequestedBy_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedBy_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  arbitrationRequestedTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  arbitrationRequestedTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  arbitrationRequestedTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  arbitrationRequestedTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  arbitrationRequestedTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  arbitrationRequestedTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  arbitrationRequestedTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  arbitrationRequestedTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
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
  bounty?: InputMaybe<Scalars["BigInt"]["input"]>;
  bounty_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bounty_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bounty_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  bounty_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bounty_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bounty_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  bounty_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  contentHash?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  contentHash_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contentHash_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  contract?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  contract_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdLogIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdLogIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdLogIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdLogIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdLogIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdLogIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdLogIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdLogIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  cumulativeBonds?: InputMaybe<Scalars["BigInt"]["input"]>;
  cumulativeBonds_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  cumulativeBonds_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  cumulativeBonds_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  cumulativeBonds_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  cumulativeBonds_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  cumulativeBonds_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  cumulativeBonds_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  currentAnswer?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswerBond?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerBond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerBond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerBond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  currentAnswerBond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerBond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerBond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerBond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  currentAnswerTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  currentAnswerTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentAnswerTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  currentAnswer_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  currentAnswer_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  currentAnswer_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  currentScheduledFinalizationTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentScheduledFinalizationTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentScheduledFinalizationTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentScheduledFinalizationTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  currentScheduledFinalizationTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentScheduledFinalizationTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentScheduledFinalizationTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  currentScheduledFinalizationTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  data?: InputMaybe<Scalars["String"]["input"]>;
  data_contains?: InputMaybe<Scalars["String"]["input"]>;
  data_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  data_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  data_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  data_gt?: InputMaybe<Scalars["String"]["input"]>;
  data_gte?: InputMaybe<Scalars["String"]["input"]>;
  data_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  data_lt?: InputMaybe<Scalars["String"]["input"]>;
  data_lte?: InputMaybe<Scalars["String"]["input"]>;
  data_not?: InputMaybe<Scalars["String"]["input"]>;
  data_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  data_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  data_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  data_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  data_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  data_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  data_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  data_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  data_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  historyHash?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  historyHash_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  isPendingArbitration?: InputMaybe<Scalars["Boolean"]["input"]>;
  isPendingArbitration_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isPendingArbitration_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  isPendingArbitration_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  lastBond?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lastBond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastBond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  minBond?: InputMaybe<Scalars["BigInt"]["input"]>;
  minBond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  minBond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  minBond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  minBond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  minBond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  minBond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  minBond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  openingTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  openingTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  openingTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Question_Filter>>>;
  outcomes_?: InputMaybe<Outcome_Filter>;
  qCategory?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_contains?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_gt?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_gte?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qCategory_lt?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_lte?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qCategory_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qCategory_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qDescription?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_contains?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_gt?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_gte?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qDescription_lt?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_lte?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qDescription_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qDescription_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_contains?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_gt?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_gte?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qJsonStr_lt?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_lte?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qJsonStr_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qJsonStr_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qLang?: InputMaybe<Scalars["String"]["input"]>;
  qLang_contains?: InputMaybe<Scalars["String"]["input"]>;
  qLang_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qLang_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qLang_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qLang_gt?: InputMaybe<Scalars["String"]["input"]>;
  qLang_gte?: InputMaybe<Scalars["String"]["input"]>;
  qLang_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qLang_lt?: InputMaybe<Scalars["String"]["input"]>;
  qLang_lte?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qLang_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qLang_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qLang_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qLang_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qTitle?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_contains?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_gt?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_gte?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qTitle_lt?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_lte?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qTitle_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qTitle_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qType?: InputMaybe<Scalars["String"]["input"]>;
  qType_contains?: InputMaybe<Scalars["String"]["input"]>;
  qType_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qType_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qType_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qType_gt?: InputMaybe<Scalars["String"]["input"]>;
  qType_gte?: InputMaybe<Scalars["String"]["input"]>;
  qType_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qType_lt?: InputMaybe<Scalars["String"]["input"]>;
  qType_lte?: InputMaybe<Scalars["String"]["input"]>;
  qType_not?: InputMaybe<Scalars["String"]["input"]>;
  qType_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  qType_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qType_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  qType_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qType_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  qType_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qType_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  qType_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  qType_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
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
  reopenedBy?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_?: InputMaybe<Question_Filter>;
  reopenedBy_contains?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_gt?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_gte?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  reopenedBy_lt?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_lte?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  reopenedBy_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  reopenedBy_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopens?: InputMaybe<Scalars["String"]["input"]>;
  reopens_?: InputMaybe<Question_Filter>;
  reopens_contains?: InputMaybe<Scalars["String"]["input"]>;
  reopens_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopens_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  reopens_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopens_gt?: InputMaybe<Scalars["String"]["input"]>;
  reopens_gte?: InputMaybe<Scalars["String"]["input"]>;
  reopens_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  reopens_lt?: InputMaybe<Scalars["String"]["input"]>;
  reopens_lte?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  reopens_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  reopens_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  reopens_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  reopens_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  responses_?: InputMaybe<Response_Filter>;
  template?: InputMaybe<Scalars["String"]["input"]>;
  template_?: InputMaybe<Template_Filter>;
  template_contains?: InputMaybe<Scalars["String"]["input"]>;
  template_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  template_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_gt?: InputMaybe<Scalars["String"]["input"]>;
  template_gte?: InputMaybe<Scalars["String"]["input"]>;
  template_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  template_lt?: InputMaybe<Scalars["String"]["input"]>;
  template_lte?: InputMaybe<Scalars["String"]["input"]>;
  template_not?: InputMaybe<Scalars["String"]["input"]>;
  template_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  template_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  template_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  template_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  template_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  template_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  timeout?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timeout_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timeout_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  updatedBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  updatedBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  updatedTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  updatedTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  updatedTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Question_OrderBy {
  AnswerFinalizedTimestamp = "answerFinalizedTimestamp",
  Answers = "answers",
  ArbitrationOccurred = "arbitrationOccurred",
  ArbitrationRequestedBy = "arbitrationRequestedBy",
  ArbitrationRequestedTimestamp = "arbitrationRequestedTimestamp",
  Arbitrator = "arbitrator",
  Bounty = "bounty",
  ContentHash = "contentHash",
  Contract = "contract",
  CreatedBlock = "createdBlock",
  CreatedLogIndex = "createdLogIndex",
  CreatedTimestamp = "createdTimestamp",
  CumulativeBonds = "cumulativeBonds",
  CurrentAnswer = "currentAnswer",
  CurrentAnswerBond = "currentAnswerBond",
  CurrentAnswerTimestamp = "currentAnswerTimestamp",
  CurrentScheduledFinalizationTimestamp = "currentScheduledFinalizationTimestamp",
  Data = "data",
  HistoryHash = "historyHash",
  Id = "id",
  IsPendingArbitration = "isPendingArbitration",
  LastBond = "lastBond",
  MinBond = "minBond",
  OpeningTimestamp = "openingTimestamp",
  Outcomes = "outcomes",
  QCategory = "qCategory",
  QDescription = "qDescription",
  QJsonStr = "qJsonStr",
  QLang = "qLang",
  QTitle = "qTitle",
  QType = "qType",
  QuestionId = "questionId",
  ReopenedBy = "reopenedBy",
  ReopenedByAnswerFinalizedTimestamp = "reopenedBy__answerFinalizedTimestamp",
  ReopenedByArbitrationOccurred = "reopenedBy__arbitrationOccurred",
  ReopenedByArbitrationRequestedBy = "reopenedBy__arbitrationRequestedBy",
  ReopenedByArbitrationRequestedTimestamp = "reopenedBy__arbitrationRequestedTimestamp",
  ReopenedByArbitrator = "reopenedBy__arbitrator",
  ReopenedByBounty = "reopenedBy__bounty",
  ReopenedByContentHash = "reopenedBy__contentHash",
  ReopenedByContract = "reopenedBy__contract",
  ReopenedByCreatedBlock = "reopenedBy__createdBlock",
  ReopenedByCreatedLogIndex = "reopenedBy__createdLogIndex",
  ReopenedByCreatedTimestamp = "reopenedBy__createdTimestamp",
  ReopenedByCumulativeBonds = "reopenedBy__cumulativeBonds",
  ReopenedByCurrentAnswer = "reopenedBy__currentAnswer",
  ReopenedByCurrentAnswerBond = "reopenedBy__currentAnswerBond",
  ReopenedByCurrentAnswerTimestamp = "reopenedBy__currentAnswerTimestamp",
  ReopenedByCurrentScheduledFinalizationTimestamp = "reopenedBy__currentScheduledFinalizationTimestamp",
  ReopenedByData = "reopenedBy__data",
  ReopenedByHistoryHash = "reopenedBy__historyHash",
  ReopenedById = "reopenedBy__id",
  ReopenedByIsPendingArbitration = "reopenedBy__isPendingArbitration",
  ReopenedByLastBond = "reopenedBy__lastBond",
  ReopenedByMinBond = "reopenedBy__minBond",
  ReopenedByOpeningTimestamp = "reopenedBy__openingTimestamp",
  ReopenedByQCategory = "reopenedBy__qCategory",
  ReopenedByQDescription = "reopenedBy__qDescription",
  ReopenedByQJsonStr = "reopenedBy__qJsonStr",
  ReopenedByQLang = "reopenedBy__qLang",
  ReopenedByQTitle = "reopenedBy__qTitle",
  ReopenedByQType = "reopenedBy__qType",
  ReopenedByQuestionId = "reopenedBy__questionId",
  ReopenedByTimeout = "reopenedBy__timeout",
  ReopenedByUpdatedBlock = "reopenedBy__updatedBlock",
  ReopenedByUpdatedTimestamp = "reopenedBy__updatedTimestamp",
  ReopenedByUser = "reopenedBy__user",
  Reopens = "reopens",
  ReopensAnswerFinalizedTimestamp = "reopens__answerFinalizedTimestamp",
  ReopensArbitrationOccurred = "reopens__arbitrationOccurred",
  ReopensArbitrationRequestedBy = "reopens__arbitrationRequestedBy",
  ReopensArbitrationRequestedTimestamp = "reopens__arbitrationRequestedTimestamp",
  ReopensArbitrator = "reopens__arbitrator",
  ReopensBounty = "reopens__bounty",
  ReopensContentHash = "reopens__contentHash",
  ReopensContract = "reopens__contract",
  ReopensCreatedBlock = "reopens__createdBlock",
  ReopensCreatedLogIndex = "reopens__createdLogIndex",
  ReopensCreatedTimestamp = "reopens__createdTimestamp",
  ReopensCumulativeBonds = "reopens__cumulativeBonds",
  ReopensCurrentAnswer = "reopens__currentAnswer",
  ReopensCurrentAnswerBond = "reopens__currentAnswerBond",
  ReopensCurrentAnswerTimestamp = "reopens__currentAnswerTimestamp",
  ReopensCurrentScheduledFinalizationTimestamp = "reopens__currentScheduledFinalizationTimestamp",
  ReopensData = "reopens__data",
  ReopensHistoryHash = "reopens__historyHash",
  ReopensId = "reopens__id",
  ReopensIsPendingArbitration = "reopens__isPendingArbitration",
  ReopensLastBond = "reopens__lastBond",
  ReopensMinBond = "reopens__minBond",
  ReopensOpeningTimestamp = "reopens__openingTimestamp",
  ReopensQCategory = "reopens__qCategory",
  ReopensQDescription = "reopens__qDescription",
  ReopensQJsonStr = "reopens__qJsonStr",
  ReopensQLang = "reopens__qLang",
  ReopensQTitle = "reopens__qTitle",
  ReopensQType = "reopens__qType",
  ReopensQuestionId = "reopens__questionId",
  ReopensTimeout = "reopens__timeout",
  ReopensUpdatedBlock = "reopens__updatedBlock",
  ReopensUpdatedTimestamp = "reopens__updatedTimestamp",
  ReopensUser = "reopens__user",
  Responses = "responses",
  Template = "template",
  TemplateContract = "template__contract",
  TemplateCreatedBlock = "template__createdBlock",
  TemplateId = "template__id",
  TemplateQuestionText = "template__questionText",
  TemplateTemplateId = "template__templateId",
  TemplateUser = "template__user",
  Timeout = "timeout",
  UpdatedBlock = "updatedBlock",
  UpdatedTimestamp = "updatedTimestamp",
  User = "user",
}

export type Response = {
  __typename?: "Response";
  answer?: Maybe<Scalars["Bytes"]["output"]>;
  bond: Scalars["BigInt"]["output"];
  commitmentId?: Maybe<Scalars["Bytes"]["output"]>;
  createdBlock: Scalars["BigInt"]["output"];
  historyHash: Scalars["Bytes"]["output"];
  id: Scalars["ID"]["output"];
  isCommitment: Scalars["Boolean"]["output"];
  isUnrevealed: Scalars["Boolean"]["output"];
  logIndex: Scalars["BigInt"]["output"];
  question: Question;
  revealedBlock?: Maybe<Scalars["BigInt"]["output"]>;
  timestamp: Scalars["BigInt"]["output"];
  user: Scalars["Bytes"]["output"];
};

export type Response_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Response_Filter>>>;
  answer?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  answer_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  answer_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  bond?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  bond_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  bond_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  commitmentId?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  commitmentId_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  commitmentId_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  historyHash?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  historyHash_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  historyHash_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  isCommitment?: InputMaybe<Scalars["Boolean"]["input"]>;
  isCommitment_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isCommitment_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  isCommitment_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isUnrevealed?: InputMaybe<Scalars["Boolean"]["input"]>;
  isUnrevealed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isUnrevealed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  isUnrevealed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  logIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  logIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Response_Filter>>>;
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
  revealedBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  revealedBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  revealedBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  revealedBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  revealedBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  revealedBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  revealedBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  revealedBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Response_OrderBy {
  Answer = "answer",
  Bond = "bond",
  CommitmentId = "commitmentId",
  CreatedBlock = "createdBlock",
  HistoryHash = "historyHash",
  Id = "id",
  IsCommitment = "isCommitment",
  IsUnrevealed = "isUnrevealed",
  LogIndex = "logIndex",
  Question = "question",
  QuestionAnswerFinalizedTimestamp = "question__answerFinalizedTimestamp",
  QuestionArbitrationOccurred = "question__arbitrationOccurred",
  QuestionArbitrationRequestedBy = "question__arbitrationRequestedBy",
  QuestionArbitrationRequestedTimestamp = "question__arbitrationRequestedTimestamp",
  QuestionArbitrator = "question__arbitrator",
  QuestionBounty = "question__bounty",
  QuestionContentHash = "question__contentHash",
  QuestionContract = "question__contract",
  QuestionCreatedBlock = "question__createdBlock",
  QuestionCreatedLogIndex = "question__createdLogIndex",
  QuestionCreatedTimestamp = "question__createdTimestamp",
  QuestionCumulativeBonds = "question__cumulativeBonds",
  QuestionCurrentAnswer = "question__currentAnswer",
  QuestionCurrentAnswerBond = "question__currentAnswerBond",
  QuestionCurrentAnswerTimestamp = "question__currentAnswerTimestamp",
  QuestionCurrentScheduledFinalizationTimestamp = "question__currentScheduledFinalizationTimestamp",
  QuestionData = "question__data",
  QuestionHistoryHash = "question__historyHash",
  QuestionId = "question__id",
  QuestionIsPendingArbitration = "question__isPendingArbitration",
  QuestionLastBond = "question__lastBond",
  QuestionMinBond = "question__minBond",
  QuestionOpeningTimestamp = "question__openingTimestamp",
  QuestionQCategory = "question__qCategory",
  QuestionQDescription = "question__qDescription",
  QuestionQJsonStr = "question__qJsonStr",
  QuestionQLang = "question__qLang",
  QuestionQTitle = "question__qTitle",
  QuestionQType = "question__qType",
  QuestionQuestionId = "question__questionId",
  QuestionTimeout = "question__timeout",
  QuestionUpdatedBlock = "question__updatedBlock",
  QuestionUpdatedTimestamp = "question__updatedTimestamp",
  QuestionUser = "question__user",
  RevealedBlock = "revealedBlock",
  Timestamp = "timestamp",
  User = "user",
}

export type Template = {
  __typename?: "Template";
  contract: Scalars["Bytes"]["output"];
  createdBlock: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  questionText?: Maybe<Scalars["String"]["output"]>;
  templateId: Scalars["BigInt"]["output"];
  user: Scalars["Bytes"]["output"];
};

export type Template_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Template_Filter>>>;
  contract?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  contract_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contract_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Template_Filter>>>;
  questionText?: InputMaybe<Scalars["String"]["input"]>;
  questionText_contains?: InputMaybe<Scalars["String"]["input"]>;
  questionText_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  questionText_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  questionText_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  questionText_gt?: InputMaybe<Scalars["String"]["input"]>;
  questionText_gte?: InputMaybe<Scalars["String"]["input"]>;
  questionText_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  questionText_lt?: InputMaybe<Scalars["String"]["input"]>;
  questionText_lte?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  questionText_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  questionText_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  questionText_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  questionText_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  templateId?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  templateId_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  templateId_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Template_OrderBy {
  Contract = "contract",
  CreatedBlock = "createdBlock",
  Id = "id",
  QuestionText = "questionText",
  TemplateId = "templateId",
  User = "user",
}

export type UserAction = {
  __typename?: "UserAction";
  actionType: Scalars["String"]["output"];
  claim?: Maybe<Claim>;
  createdBlock: Scalars["BigInt"]["output"];
  createdTimestamp: Scalars["BigInt"]["output"];
  fund?: Maybe<Fund>;
  id: Scalars["ID"]["output"];
  question?: Maybe<Question>;
  response?: Maybe<Response>;
  template?: Maybe<Template>;
  user: Scalars["Bytes"]["output"];
  withdrawal?: Maybe<Withdrawal>;
};

export type UserAction_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  actionType?: InputMaybe<Scalars["String"]["input"]>;
  actionType_contains?: InputMaybe<Scalars["String"]["input"]>;
  actionType_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  actionType_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  actionType_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  actionType_gt?: InputMaybe<Scalars["String"]["input"]>;
  actionType_gte?: InputMaybe<Scalars["String"]["input"]>;
  actionType_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  actionType_lt?: InputMaybe<Scalars["String"]["input"]>;
  actionType_lte?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  actionType_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  actionType_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  actionType_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  actionType_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  and?: InputMaybe<Array<InputMaybe<UserAction_Filter>>>;
  claim?: InputMaybe<Scalars["String"]["input"]>;
  claim_?: InputMaybe<Claim_Filter>;
  claim_contains?: InputMaybe<Scalars["String"]["input"]>;
  claim_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  claim_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  claim_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  claim_gt?: InputMaybe<Scalars["String"]["input"]>;
  claim_gte?: InputMaybe<Scalars["String"]["input"]>;
  claim_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  claim_lt?: InputMaybe<Scalars["String"]["input"]>;
  claim_lte?: InputMaybe<Scalars["String"]["input"]>;
  claim_not?: InputMaybe<Scalars["String"]["input"]>;
  claim_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  claim_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  claim_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  claim_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  claim_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  claim_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  claim_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  claim_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  claim_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  fund?: InputMaybe<Scalars["String"]["input"]>;
  fund_?: InputMaybe<Fund_Filter>;
  fund_contains?: InputMaybe<Scalars["String"]["input"]>;
  fund_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fund_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  fund_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fund_gt?: InputMaybe<Scalars["String"]["input"]>;
  fund_gte?: InputMaybe<Scalars["String"]["input"]>;
  fund_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  fund_lt?: InputMaybe<Scalars["String"]["input"]>;
  fund_lte?: InputMaybe<Scalars["String"]["input"]>;
  fund_not?: InputMaybe<Scalars["String"]["input"]>;
  fund_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  fund_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fund_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  fund_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fund_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  fund_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  fund_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fund_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  fund_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<UserAction_Filter>>>;
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
  response?: InputMaybe<Scalars["String"]["input"]>;
  response_?: InputMaybe<Response_Filter>;
  response_contains?: InputMaybe<Scalars["String"]["input"]>;
  response_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  response_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  response_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  response_gt?: InputMaybe<Scalars["String"]["input"]>;
  response_gte?: InputMaybe<Scalars["String"]["input"]>;
  response_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  response_lt?: InputMaybe<Scalars["String"]["input"]>;
  response_lte?: InputMaybe<Scalars["String"]["input"]>;
  response_not?: InputMaybe<Scalars["String"]["input"]>;
  response_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  response_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  response_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  response_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  response_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  response_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  response_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  response_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  response_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template?: InputMaybe<Scalars["String"]["input"]>;
  template_?: InputMaybe<Template_Filter>;
  template_contains?: InputMaybe<Scalars["String"]["input"]>;
  template_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  template_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_gt?: InputMaybe<Scalars["String"]["input"]>;
  template_gte?: InputMaybe<Scalars["String"]["input"]>;
  template_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  template_lt?: InputMaybe<Scalars["String"]["input"]>;
  template_lte?: InputMaybe<Scalars["String"]["input"]>;
  template_not?: InputMaybe<Scalars["String"]["input"]>;
  template_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  template_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  template_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  template_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  template_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  template_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  template_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  withdrawal?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_?: InputMaybe<Withdrawal_Filter>;
  withdrawal_contains?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_gt?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_gte?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  withdrawal_lt?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_lte?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  withdrawal_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  withdrawal_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum UserAction_OrderBy {
  ActionType = "actionType",
  Claim = "claim",
  ClaimAmount = "claim__amount",
  ClaimCreatedBlock = "claim__createdBlock",
  ClaimId = "claim__id",
  ClaimUser = "claim__user",
  CreatedBlock = "createdBlock",
  CreatedTimestamp = "createdTimestamp",
  Fund = "fund",
  FundAmount = "fund__amount",
  FundCreatedBlock = "fund__createdBlock",
  FundId = "fund__id",
  FundUser = "fund__user",
  Id = "id",
  Question = "question",
  QuestionAnswerFinalizedTimestamp = "question__answerFinalizedTimestamp",
  QuestionArbitrationOccurred = "question__arbitrationOccurred",
  QuestionArbitrationRequestedBy = "question__arbitrationRequestedBy",
  QuestionArbitrationRequestedTimestamp = "question__arbitrationRequestedTimestamp",
  QuestionArbitrator = "question__arbitrator",
  QuestionBounty = "question__bounty",
  QuestionContentHash = "question__contentHash",
  QuestionContract = "question__contract",
  QuestionCreatedBlock = "question__createdBlock",
  QuestionCreatedLogIndex = "question__createdLogIndex",
  QuestionCreatedTimestamp = "question__createdTimestamp",
  QuestionCumulativeBonds = "question__cumulativeBonds",
  QuestionCurrentAnswer = "question__currentAnswer",
  QuestionCurrentAnswerBond = "question__currentAnswerBond",
  QuestionCurrentAnswerTimestamp = "question__currentAnswerTimestamp",
  QuestionCurrentScheduledFinalizationTimestamp = "question__currentScheduledFinalizationTimestamp",
  QuestionData = "question__data",
  QuestionHistoryHash = "question__historyHash",
  QuestionId = "question__id",
  QuestionIsPendingArbitration = "question__isPendingArbitration",
  QuestionLastBond = "question__lastBond",
  QuestionMinBond = "question__minBond",
  QuestionOpeningTimestamp = "question__openingTimestamp",
  QuestionQCategory = "question__qCategory",
  QuestionQDescription = "question__qDescription",
  QuestionQJsonStr = "question__qJsonStr",
  QuestionQLang = "question__qLang",
  QuestionQTitle = "question__qTitle",
  QuestionQType = "question__qType",
  QuestionQuestionId = "question__questionId",
  QuestionTimeout = "question__timeout",
  QuestionUpdatedBlock = "question__updatedBlock",
  QuestionUpdatedTimestamp = "question__updatedTimestamp",
  QuestionUser = "question__user",
  Response = "response",
  ResponseAnswer = "response__answer",
  ResponseBond = "response__bond",
  ResponseCommitmentId = "response__commitmentId",
  ResponseCreatedBlock = "response__createdBlock",
  ResponseHistoryHash = "response__historyHash",
  ResponseId = "response__id",
  ResponseIsCommitment = "response__isCommitment",
  ResponseIsUnrevealed = "response__isUnrevealed",
  ResponseLogIndex = "response__logIndex",
  ResponseRevealedBlock = "response__revealedBlock",
  ResponseTimestamp = "response__timestamp",
  ResponseUser = "response__user",
  Template = "template",
  TemplateContract = "template__contract",
  TemplateCreatedBlock = "template__createdBlock",
  TemplateId = "template__id",
  TemplateQuestionText = "template__questionText",
  TemplateTemplateId = "template__templateId",
  TemplateUser = "template__user",
  User = "user",
  Withdrawal = "withdrawal",
  WithdrawalAmount = "withdrawal__amount",
  WithdrawalCreatedBlock = "withdrawal__createdBlock",
  WithdrawalId = "withdrawal__id",
  WithdrawalUser = "withdrawal__user",
}

export type Withdrawal = {
  __typename?: "Withdrawal";
  amount: Scalars["BigInt"]["output"];
  createdBlock: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  user: Scalars["Bytes"]["output"];
};

export type Withdrawal_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Withdrawal_Filter>>>;
  createdBlock?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdBlock_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Withdrawal_Filter>>>;
  user?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  user_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  user_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Withdrawal_OrderBy {
  Amount = "amount",
  CreatedBlock = "createdBlock",
  Id = "id",
  User = "user",
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

export type ClaimsQueryQueryVariables = Exact<{
  user: Scalars["Bytes"]["input"];
}>;

export type ClaimsQueryQuery = {
  __typename?: "Query";
  claims: Array<{ __typename?: "Claim"; question: { __typename?: "Question"; id: string } }>;
};

export type UserActionsQueryQueryVariables = Exact<{
  user: Scalars["Bytes"]["input"];
  questionIds?: InputMaybe<Array<Scalars["String"]["input"]> | Scalars["String"]["input"]>;
}>;

export type UserActionsQueryQuery = {
  __typename?: "Query";
  userActions: Array<{
    __typename?: "UserAction";
    question?: { __typename?: "Question"; questionId: `0x${string}` } | null;
  }>;
};

export type QuestionsQueryQueryVariables = Exact<{
  questionIds?: InputMaybe<Array<Scalars["Bytes"]["input"]> | Scalars["Bytes"]["input"]>;
  answerFinalizedTimestamp: Scalars["BigInt"]["input"];
}>;

export type QuestionsQueryQuery = {
  __typename?: "Query";
  questions: Array<{
    __typename?: "Question";
    questionId: `0x${string}`;
    historyHash?: `0x${string}` | null;
    currentAnswer?: `0x${string}` | null;
    bounty: string;
    responses?: Array<{
      __typename?: "Response";
      commitmentId?: `0x${string}` | null;
      answer?: `0x${string}` | null;
      user: `0x${string}`;
      bond: string;
      historyHash: `0x${string}`;
    }> | null;
  }>;
};

export const ClaimsQueryDocument = gql`
    query ClaimsQuery($user: Bytes!) {
  claims(first: 1000, where: {user: $user}) {
    question {
      id
    }
  }
}
    `;
export const UserActionsQueryDocument = gql`
    query UserActionsQuery($user: Bytes!, $questionIds: [String!]) {
  userActions(
    where: {user: $user, question_not_in: $questionIds, actionType: "AnswerQuestion"}
  ) {
    question {
      questionId
    }
  }
}
    `;
export const QuestionsQueryDocument = gql`
    query QuestionsQuery($questionIds: [Bytes!], $answerFinalizedTimestamp: BigInt!) {
  questions(
    where: {questionId_in: $questionIds, isPendingArbitration: false, answerFinalizedTimestamp_lt: $answerFinalizedTimestamp, currentAnswer_not: null}
    orderBy: answerFinalizedTimestamp
    orderDirection: desc
  ) {
    questionId
    historyHash
    currentAnswer
    bounty
    responses {
      commitmentId
      answer
      user
      bond
      historyHash
    }
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
    ClaimsQuery(
      variables: ClaimsQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimsQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimsQueryQuery>(ClaimsQueryDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "ClaimsQuery",
        "query",
        variables,
      );
    },
    UserActionsQuery(
      variables: UserActionsQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UserActionsQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UserActionsQueryQuery>(UserActionsQueryDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "UserActionsQuery",
        "query",
        variables,
      );
    },
    QuestionsQuery(
      variables: QuestionsQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<QuestionsQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<QuestionsQueryQuery>(QuestionsQueryDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "QuestionsQuery",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
