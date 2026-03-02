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

export type BlockChangedFilter = {
  number_gte: Scalars["Int"]["input"];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars["Bytes"]["input"]>;
  number?: InputMaybe<Scalars["Int"]["input"]>;
  number_gte?: InputMaybe<Scalars["Int"]["input"]>;
};

export type Bundle = {
  __typename?: "Bundle";
  ethPriceUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
};

export type Bundle_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Bundle_Filter>>>;
  ethPriceUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  ethPriceUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  ethPriceUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  ethPriceUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  ethPriceUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  ethPriceUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  ethPriceUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  ethPriceUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Bundle_Filter>>>;
};

export enum Bundle_OrderBy {
  EthPriceUsd = "ethPriceUSD",
  Id = "id",
}

export type Burn = {
  __typename?: "Burn";
  amount: Scalars["BigInt"]["output"];
  amount0: Scalars["BigDecimal"]["output"];
  amount1: Scalars["BigDecimal"]["output"];
  amountUSD?: Maybe<Scalars["BigDecimal"]["output"]>;
  id: Scalars["ID"]["output"];
  logIndex?: Maybe<Scalars["BigInt"]["output"]>;
  origin: Scalars["Bytes"]["output"];
  owner?: Maybe<Scalars["Bytes"]["output"]>;
  pool: Pool;
  tickLower: Scalars["BigInt"]["output"];
  tickUpper: Scalars["BigInt"]["output"];
  timestamp: Scalars["BigInt"]["output"];
  token0: Token;
  token1: Token;
  transaction: Transaction;
};

export type Burn_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Burn_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  logIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  logIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Burn_Filter>>>;
  origin?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  origin_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickLower_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickUpper?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickUpper_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token0?: InputMaybe<Scalars["String"]["input"]>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_gt?: InputMaybe<Scalars["String"]["input"]>;
  token0_gte?: InputMaybe<Scalars["String"]["input"]>;
  token0_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_lt?: InputMaybe<Scalars["String"]["input"]>;
  token0_lte?: InputMaybe<Scalars["String"]["input"]>;
  token0_not?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1?: InputMaybe<Scalars["String"]["input"]>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_gt?: InputMaybe<Scalars["String"]["input"]>;
  token1_gte?: InputMaybe<Scalars["String"]["input"]>;
  token1_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_lt?: InputMaybe<Scalars["String"]["input"]>;
  token1_lte?: InputMaybe<Scalars["String"]["input"]>;
  token1_not?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum Burn_OrderBy {
  Amount = "amount",
  Amount0 = "amount0",
  Amount1 = "amount1",
  AmountUsd = "amountUSD",
  Id = "id",
  LogIndex = "logIndex",
  Origin = "origin",
  Owner = "owner",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  TickLower = "tickLower",
  TickUpper = "tickUpper",
  Timestamp = "timestamp",
  Token0 = "token0",
  Token0Decimals = "token0__decimals",
  Token0DerivedEth = "token0__derivedETH",
  Token0FeesUsd = "token0__feesUSD",
  Token0Id = "token0__id",
  Token0Name = "token0__name",
  Token0PoolCount = "token0__poolCount",
  Token0Symbol = "token0__symbol",
  Token0TotalSupply = "token0__totalSupply",
  Token0TotalValueLocked = "token0__totalValueLocked",
  Token0TotalValueLockedUsd = "token0__totalValueLockedUSD",
  Token0TotalValueLockedUsdUntracked = "token0__totalValueLockedUSDUntracked",
  Token0TxCount = "token0__txCount",
  Token0UntrackedVolumeUsd = "token0__untrackedVolumeUSD",
  Token0Volume = "token0__volume",
  Token0VolumeUsd = "token0__volumeUSD",
  Token1 = "token1",
  Token1Decimals = "token1__decimals",
  Token1DerivedEth = "token1__derivedETH",
  Token1FeesUsd = "token1__feesUSD",
  Token1Id = "token1__id",
  Token1Name = "token1__name",
  Token1PoolCount = "token1__poolCount",
  Token1Symbol = "token1__symbol",
  Token1TotalSupply = "token1__totalSupply",
  Token1TotalValueLocked = "token1__totalValueLocked",
  Token1TotalValueLockedUsd = "token1__totalValueLockedUSD",
  Token1TotalValueLockedUsdUntracked = "token1__totalValueLockedUSDUntracked",
  Token1TxCount = "token1__txCount",
  Token1UntrackedVolumeUsd = "token1__untrackedVolumeUSD",
  Token1Volume = "token1__volume",
  Token1VolumeUsd = "token1__volumeUSD",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
}

export type Collect = {
  __typename?: "Collect";
  amount0: Scalars["BigDecimal"]["output"];
  amount1: Scalars["BigDecimal"]["output"];
  amountUSD?: Maybe<Scalars["BigDecimal"]["output"]>;
  id: Scalars["ID"]["output"];
  logIndex?: Maybe<Scalars["BigInt"]["output"]>;
  owner?: Maybe<Scalars["Bytes"]["output"]>;
  pool: Pool;
  tickLower: Scalars["BigInt"]["output"];
  tickUpper: Scalars["BigInt"]["output"];
  timestamp: Scalars["BigInt"]["output"];
  transaction: Transaction;
};

export type Collect_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Collect_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  logIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  logIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Collect_Filter>>>;
  owner?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickLower_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickUpper?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickUpper_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum Collect_OrderBy {
  Amount0 = "amount0",
  Amount1 = "amount1",
  AmountUsd = "amountUSD",
  Id = "id",
  LogIndex = "logIndex",
  Owner = "owner",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  TickLower = "tickLower",
  TickUpper = "tickUpper",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
}

export type Factory = {
  __typename?: "Factory";
  id: Scalars["ID"]["output"];
  owner: Scalars["ID"]["output"];
  poolCount: Scalars["BigInt"]["output"];
  totalFeesETH: Scalars["BigDecimal"]["output"];
  totalFeesUSD: Scalars["BigDecimal"]["output"];
  totalValueLockedETH: Scalars["BigDecimal"]["output"];
  totalValueLockedETHUntracked: Scalars["BigDecimal"]["output"];
  totalValueLockedUSD: Scalars["BigDecimal"]["output"];
  totalValueLockedUSDUntracked: Scalars["BigDecimal"]["output"];
  totalVolumeETH: Scalars["BigDecimal"]["output"];
  totalVolumeUSD: Scalars["BigDecimal"]["output"];
  txCount: Scalars["BigInt"]["output"];
  untrackedVolumeUSD: Scalars["BigDecimal"]["output"];
};

export type Factory_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
  owner?: InputMaybe<Scalars["ID"]["input"]>;
  owner_gt?: InputMaybe<Scalars["ID"]["input"]>;
  owner_gte?: InputMaybe<Scalars["ID"]["input"]>;
  owner_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  owner_lt?: InputMaybe<Scalars["ID"]["input"]>;
  owner_lte?: InputMaybe<Scalars["ID"]["input"]>;
  owner_not?: InputMaybe<Scalars["ID"]["input"]>;
  owner_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  poolCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  poolCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  totalFeesETH?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesETH_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesETH_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesETH_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalFeesETH_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesETH_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesETH_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalFeesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalFeesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalFeesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedETH?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedETHUntracked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETHUntracked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedETH_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedETH_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSDUntracked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalVolumeETH?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeETH_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeETH_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalVolumeETH_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeETH_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeETH_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  txCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  untrackedVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum Factory_OrderBy {
  Id = "id",
  Owner = "owner",
  PoolCount = "poolCount",
  TotalFeesEth = "totalFeesETH",
  TotalFeesUsd = "totalFeesUSD",
  TotalValueLockedEth = "totalValueLockedETH",
  TotalValueLockedEthUntracked = "totalValueLockedETHUntracked",
  TotalValueLockedUsd = "totalValueLockedUSD",
  TotalValueLockedUsdUntracked = "totalValueLockedUSDUntracked",
  TotalVolumeEth = "totalVolumeETH",
  TotalVolumeUsd = "totalVolumeUSD",
  TxCount = "txCount",
  UntrackedVolumeUsd = "untrackedVolumeUSD",
}

export type Flash = {
  __typename?: "Flash";
  amount0: Scalars["BigDecimal"]["output"];
  amount0Paid: Scalars["BigDecimal"]["output"];
  amount1: Scalars["BigDecimal"]["output"];
  amount1Paid: Scalars["BigDecimal"]["output"];
  amountUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  logIndex?: Maybe<Scalars["BigInt"]["output"]>;
  pool: Pool;
  recipient: Scalars["Bytes"]["output"];
  sender: Scalars["Bytes"]["output"];
  timestamp: Scalars["BigInt"]["output"];
  transaction: Transaction;
};

export type Flash_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0Paid_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0Paid_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1Paid_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1Paid_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Flash_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  logIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  logIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Flash_Filter>>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  recipient?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  recipient_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  sender?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  sender_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum Flash_OrderBy {
  Amount0 = "amount0",
  Amount0Paid = "amount0Paid",
  Amount1 = "amount1",
  Amount1Paid = "amount1Paid",
  AmountUsd = "amountUSD",
  Id = "id",
  LogIndex = "logIndex",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Recipient = "recipient",
  Sender = "sender",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
}

export type Mint = {
  __typename?: "Mint";
  amount: Scalars["BigInt"]["output"];
  amount0: Scalars["BigDecimal"]["output"];
  amount1: Scalars["BigDecimal"]["output"];
  amountUSD?: Maybe<Scalars["BigDecimal"]["output"]>;
  id: Scalars["ID"]["output"];
  logIndex?: Maybe<Scalars["BigInt"]["output"]>;
  origin: Scalars["Bytes"]["output"];
  owner: Scalars["Bytes"]["output"];
  pool: Pool;
  sender?: Maybe<Scalars["Bytes"]["output"]>;
  tickLower: Scalars["BigInt"]["output"];
  tickUpper: Scalars["BigInt"]["output"];
  timestamp: Scalars["BigInt"]["output"];
  token0: Token;
  token1: Token;
  transaction: Transaction;
};

export type Mint_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Mint_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  logIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  logIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Mint_Filter>>>;
  origin?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  origin_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  sender?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  sender_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  tickLower?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickLower_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickLower_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickUpper?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickUpper_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickUpper_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token0?: InputMaybe<Scalars["String"]["input"]>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_gt?: InputMaybe<Scalars["String"]["input"]>;
  token0_gte?: InputMaybe<Scalars["String"]["input"]>;
  token0_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_lt?: InputMaybe<Scalars["String"]["input"]>;
  token0_lte?: InputMaybe<Scalars["String"]["input"]>;
  token0_not?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1?: InputMaybe<Scalars["String"]["input"]>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_gt?: InputMaybe<Scalars["String"]["input"]>;
  token1_gte?: InputMaybe<Scalars["String"]["input"]>;
  token1_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_lt?: InputMaybe<Scalars["String"]["input"]>;
  token1_lte?: InputMaybe<Scalars["String"]["input"]>;
  token1_not?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum Mint_OrderBy {
  Amount = "amount",
  Amount0 = "amount0",
  Amount1 = "amount1",
  AmountUsd = "amountUSD",
  Id = "id",
  LogIndex = "logIndex",
  Origin = "origin",
  Owner = "owner",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Sender = "sender",
  TickLower = "tickLower",
  TickUpper = "tickUpper",
  Timestamp = "timestamp",
  Token0 = "token0",
  Token0Decimals = "token0__decimals",
  Token0DerivedEth = "token0__derivedETH",
  Token0FeesUsd = "token0__feesUSD",
  Token0Id = "token0__id",
  Token0Name = "token0__name",
  Token0PoolCount = "token0__poolCount",
  Token0Symbol = "token0__symbol",
  Token0TotalSupply = "token0__totalSupply",
  Token0TotalValueLocked = "token0__totalValueLocked",
  Token0TotalValueLockedUsd = "token0__totalValueLockedUSD",
  Token0TotalValueLockedUsdUntracked = "token0__totalValueLockedUSDUntracked",
  Token0TxCount = "token0__txCount",
  Token0UntrackedVolumeUsd = "token0__untrackedVolumeUSD",
  Token0Volume = "token0__volume",
  Token0VolumeUsd = "token0__volumeUSD",
  Token1 = "token1",
  Token1Decimals = "token1__decimals",
  Token1DerivedEth = "token1__derivedETH",
  Token1FeesUsd = "token1__feesUSD",
  Token1Id = "token1__id",
  Token1Name = "token1__name",
  Token1PoolCount = "token1__poolCount",
  Token1Symbol = "token1__symbol",
  Token1TotalSupply = "token1__totalSupply",
  Token1TotalValueLocked = "token1__totalValueLocked",
  Token1TotalValueLockedUsd = "token1__totalValueLockedUSD",
  Token1TotalValueLockedUsdUntracked = "token1__totalValueLockedUSDUntracked",
  Token1TxCount = "token1__txCount",
  Token1UntrackedVolumeUsd = "token1__untrackedVolumeUSD",
  Token1Volume = "token1__volume",
  Token1VolumeUsd = "token1__volumeUSD",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = "asc",
  Desc = "desc",
}

export type Pool = {
  __typename?: "Pool";
  burns: Array<Burn>;
  collectedFeesToken0: Scalars["BigDecimal"]["output"];
  collectedFeesToken1: Scalars["BigDecimal"]["output"];
  collectedFeesUSD: Scalars["BigDecimal"]["output"];
  collects: Array<Collect>;
  createdAtBlockNumber: Scalars["BigInt"]["output"];
  createdAtTimestamp: Scalars["BigInt"]["output"];
  feeGrowthGlobal0X128: Scalars["BigInt"]["output"];
  feeGrowthGlobal1X128: Scalars["BigInt"]["output"];
  feeTier: Scalars["BigInt"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  liquidity: Scalars["BigInt"]["output"];
  liquidityProviderCount: Scalars["BigInt"]["output"];
  mints: Array<Mint>;
  observationIndex: Scalars["BigInt"]["output"];
  poolDayData: Array<PoolDayData>;
  poolHourData: Array<PoolHourData>;
  sqrtPrice: Scalars["BigInt"]["output"];
  swaps: Array<Swap>;
  tick?: Maybe<Scalars["BigInt"]["output"]>;
  ticks: Array<Tick>;
  token0: Token;
  token0Price: Scalars["BigDecimal"]["output"];
  token1: Token;
  token1Price: Scalars["BigDecimal"]["output"];
  totalValueLockedETH: Scalars["BigDecimal"]["output"];
  totalValueLockedToken0: Scalars["BigDecimal"]["output"];
  totalValueLockedToken1: Scalars["BigDecimal"]["output"];
  totalValueLockedUSD: Scalars["BigDecimal"]["output"];
  totalValueLockedUSDUntracked: Scalars["BigDecimal"]["output"];
  txCount: Scalars["BigInt"]["output"];
  untrackedVolumeUSD: Scalars["BigDecimal"]["output"];
  volumeToken0: Scalars["BigDecimal"]["output"];
  volumeToken1: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type PoolBurnsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Burn_Filter>;
};

export type PoolCollectsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Collect_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Collect_Filter>;
};

export type PoolMintsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Mint_Filter>;
};

export type PoolPoolDayDataArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<PoolDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<PoolDayData_Filter>;
};

export type PoolPoolHourDataArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<PoolHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<PoolHourData_Filter>;
};

export type PoolSwapsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Swap_Filter>;
};

export type PoolTicksArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Tick_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Tick_Filter>;
};

export type PoolDayData = {
  __typename?: "PoolDayData";
  close: Scalars["BigDecimal"]["output"];
  date: Scalars["Int"]["output"];
  feeGrowthGlobal0X128: Scalars["BigInt"]["output"];
  feeGrowthGlobal1X128: Scalars["BigInt"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  high: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  liquidity: Scalars["BigInt"]["output"];
  low: Scalars["BigDecimal"]["output"];
  open: Scalars["BigDecimal"]["output"];
  pool: Pool;
  sqrtPrice: Scalars["BigInt"]["output"];
  tick?: Maybe<Scalars["BigInt"]["output"]>;
  token0Price: Scalars["BigDecimal"]["output"];
  token1Price: Scalars["BigDecimal"]["output"];
  tvlUSD: Scalars["BigDecimal"]["output"];
  txCount: Scalars["BigInt"]["output"];
  volumeToken0: Scalars["BigDecimal"]["output"];
  volumeToken1: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type PoolDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolDayData_Filter>>>;
  close?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  close_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  date?: InputMaybe<Scalars["Int"]["input"]>;
  date_gt?: InputMaybe<Scalars["Int"]["input"]>;
  date_gte?: InputMaybe<Scalars["Int"]["input"]>;
  date_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  date_lt?: InputMaybe<Scalars["Int"]["input"]>;
  date_lte?: InputMaybe<Scalars["Int"]["input"]>;
  date_not?: InputMaybe<Scalars["Int"]["input"]>;
  date_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  feeGrowthGlobal0X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal0X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal1X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal1X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidity?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidity_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  low?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  low_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<PoolDayData_Filter>>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  sqrtPrice?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  sqrtPrice_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token0Price?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token0Price_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token1Price?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token1Price_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  tvlUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  tvlUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  txCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  volumeToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum PoolDayData_OrderBy {
  Close = "close",
  Date = "date",
  FeeGrowthGlobal0X128 = "feeGrowthGlobal0X128",
  FeeGrowthGlobal1X128 = "feeGrowthGlobal1X128",
  FeesUsd = "feesUSD",
  High = "high",
  Id = "id",
  Liquidity = "liquidity",
  Low = "low",
  Open = "open",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  SqrtPrice = "sqrtPrice",
  Tick = "tick",
  Token0Price = "token0Price",
  Token1Price = "token1Price",
  TvlUsd = "tvlUSD",
  TxCount = "txCount",
  VolumeToken0 = "volumeToken0",
  VolumeToken1 = "volumeToken1",
  VolumeUsd = "volumeUSD",
}

export type PoolHourData = {
  __typename?: "PoolHourData";
  close: Scalars["BigDecimal"]["output"];
  feeGrowthGlobal0X128: Scalars["BigInt"]["output"];
  feeGrowthGlobal1X128: Scalars["BigInt"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  high: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  liquidity: Scalars["BigInt"]["output"];
  low: Scalars["BigDecimal"]["output"];
  open: Scalars["BigDecimal"]["output"];
  periodStartUnix: Scalars["Int"]["output"];
  pool: Pool;
  sqrtPrice: Scalars["BigInt"]["output"];
  tick?: Maybe<Scalars["BigInt"]["output"]>;
  token0Price: Scalars["BigDecimal"]["output"];
  token1Price: Scalars["BigDecimal"]["output"];
  tvlUSD: Scalars["BigDecimal"]["output"];
  txCount: Scalars["BigInt"]["output"];
  volumeToken0: Scalars["BigDecimal"]["output"];
  volumeToken1: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type PoolHourData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PoolHourData_Filter>>>;
  close?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  close_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feeGrowthGlobal0X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal0X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal1X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal1X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidity?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidity_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  low?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  low_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<PoolHourData_Filter>>>;
  periodStartUnix?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_gt?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_gte?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  periodStartUnix_lt?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_lte?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_not?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  sqrtPrice?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  sqrtPrice_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token0Price?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token0Price_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token1Price?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token1Price_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  tvlUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  tvlUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  txCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  volumeToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum PoolHourData_OrderBy {
  Close = "close",
  FeeGrowthGlobal0X128 = "feeGrowthGlobal0X128",
  FeeGrowthGlobal1X128 = "feeGrowthGlobal1X128",
  FeesUsd = "feesUSD",
  High = "high",
  Id = "id",
  Liquidity = "liquidity",
  Low = "low",
  Open = "open",
  PeriodStartUnix = "periodStartUnix",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  SqrtPrice = "sqrtPrice",
  Tick = "tick",
  Token0Price = "token0Price",
  Token1Price = "token1Price",
  TvlUsd = "tvlUSD",
  TxCount = "txCount",
  VolumeToken0 = "volumeToken0",
  VolumeToken1 = "volumeToken1",
  VolumeUsd = "volumeUSD",
}

export type Pool_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  burns_?: InputMaybe<Burn_Filter>;
  collectedFeesToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collects_?: InputMaybe<Collect_Filter>;
  createdAtBlockNumber?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdAtBlockNumber_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdAtTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdAtTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal0X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal0X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal0X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal1X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthGlobal1X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthGlobal1X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeTier?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeTier_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeTier_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeTier_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeTier_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeTier_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeTier_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeTier_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidity?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityProviderCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidity_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidity_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  mints_?: InputMaybe<Mint_Filter>;
  observationIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  observationIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  observationIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  observationIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  observationIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  observationIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  observationIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  observationIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  poolDayData_?: InputMaybe<PoolDayData_Filter>;
  poolHourData_?: InputMaybe<PoolHourData_Filter>;
  sqrtPrice?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  sqrtPrice_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPrice_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  swaps_?: InputMaybe<Swap_Filter>;
  tick?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  ticks_?: InputMaybe<Tick_Filter>;
  token0?: InputMaybe<Scalars["String"]["input"]>;
  token0Price?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token0Price_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token0Price_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_gt?: InputMaybe<Scalars["String"]["input"]>;
  token0_gte?: InputMaybe<Scalars["String"]["input"]>;
  token0_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_lt?: InputMaybe<Scalars["String"]["input"]>;
  token0_lte?: InputMaybe<Scalars["String"]["input"]>;
  token0_not?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1?: InputMaybe<Scalars["String"]["input"]>;
  token1Price?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token1Price_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  token1Price_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_gt?: InputMaybe<Scalars["String"]["input"]>;
  token1_gte?: InputMaybe<Scalars["String"]["input"]>;
  token1_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_lt?: InputMaybe<Scalars["String"]["input"]>;
  token1_lte?: InputMaybe<Scalars["String"]["input"]>;
  token1_not?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  totalValueLockedETH?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedETH_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSDUntracked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  txCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  untrackedVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum Pool_OrderBy {
  Burns = "burns",
  CollectedFeesToken0 = "collectedFeesToken0",
  CollectedFeesToken1 = "collectedFeesToken1",
  CollectedFeesUsd = "collectedFeesUSD",
  Collects = "collects",
  CreatedAtBlockNumber = "createdAtBlockNumber",
  CreatedAtTimestamp = "createdAtTimestamp",
  FeeGrowthGlobal0X128 = "feeGrowthGlobal0X128",
  FeeGrowthGlobal1X128 = "feeGrowthGlobal1X128",
  FeeTier = "feeTier",
  FeesUsd = "feesUSD",
  Id = "id",
  Liquidity = "liquidity",
  LiquidityProviderCount = "liquidityProviderCount",
  Mints = "mints",
  ObservationIndex = "observationIndex",
  PoolDayData = "poolDayData",
  PoolHourData = "poolHourData",
  SqrtPrice = "sqrtPrice",
  Swaps = "swaps",
  Tick = "tick",
  Ticks = "ticks",
  Token0 = "token0",
  Token0Price = "token0Price",
  Token0Decimals = "token0__decimals",
  Token0DerivedEth = "token0__derivedETH",
  Token0FeesUsd = "token0__feesUSD",
  Token0Id = "token0__id",
  Token0Name = "token0__name",
  Token0PoolCount = "token0__poolCount",
  Token0Symbol = "token0__symbol",
  Token0TotalSupply = "token0__totalSupply",
  Token0TotalValueLocked = "token0__totalValueLocked",
  Token0TotalValueLockedUsd = "token0__totalValueLockedUSD",
  Token0TotalValueLockedUsdUntracked = "token0__totalValueLockedUSDUntracked",
  Token0TxCount = "token0__txCount",
  Token0UntrackedVolumeUsd = "token0__untrackedVolumeUSD",
  Token0Volume = "token0__volume",
  Token0VolumeUsd = "token0__volumeUSD",
  Token1 = "token1",
  Token1Price = "token1Price",
  Token1Decimals = "token1__decimals",
  Token1DerivedEth = "token1__derivedETH",
  Token1FeesUsd = "token1__feesUSD",
  Token1Id = "token1__id",
  Token1Name = "token1__name",
  Token1PoolCount = "token1__poolCount",
  Token1Symbol = "token1__symbol",
  Token1TotalSupply = "token1__totalSupply",
  Token1TotalValueLocked = "token1__totalValueLocked",
  Token1TotalValueLockedUsd = "token1__totalValueLockedUSD",
  Token1TotalValueLockedUsdUntracked = "token1__totalValueLockedUSDUntracked",
  Token1TxCount = "token1__txCount",
  Token1UntrackedVolumeUsd = "token1__untrackedVolumeUSD",
  Token1Volume = "token1__volume",
  Token1VolumeUsd = "token1__volumeUSD",
  TotalValueLockedEth = "totalValueLockedETH",
  TotalValueLockedToken0 = "totalValueLockedToken0",
  TotalValueLockedToken1 = "totalValueLockedToken1",
  TotalValueLockedUsd = "totalValueLockedUSD",
  TotalValueLockedUsdUntracked = "totalValueLockedUSDUntracked",
  TxCount = "txCount",
  UntrackedVolumeUsd = "untrackedVolumeUSD",
  VolumeToken0 = "volumeToken0",
  VolumeToken1 = "volumeToken1",
  VolumeUsd = "volumeUSD",
}

export type Position = {
  __typename?: "Position";
  collectedFeesToken0: Scalars["BigDecimal"]["output"];
  collectedFeesToken1: Scalars["BigDecimal"]["output"];
  depositedToken0: Scalars["BigDecimal"]["output"];
  depositedToken1: Scalars["BigDecimal"]["output"];
  feeGrowthInside0LastX128: Scalars["BigInt"]["output"];
  feeGrowthInside1LastX128: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  liquidity: Scalars["BigInt"]["output"];
  owner: Scalars["Bytes"]["output"];
  pool: Pool;
  tickLower: Tick;
  tickUpper: Tick;
  token0: Token;
  token1: Token;
  transaction: Transaction;
  withdrawnToken0: Scalars["BigDecimal"]["output"];
  withdrawnToken1: Scalars["BigDecimal"]["output"];
};

export type PositionSnapshot = {
  __typename?: "PositionSnapshot";
  blockNumber: Scalars["BigInt"]["output"];
  collectedFeesToken0: Scalars["BigDecimal"]["output"];
  collectedFeesToken1: Scalars["BigDecimal"]["output"];
  depositedToken0: Scalars["BigDecimal"]["output"];
  depositedToken1: Scalars["BigDecimal"]["output"];
  feeGrowthInside0LastX128: Scalars["BigInt"]["output"];
  feeGrowthInside1LastX128: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  liquidity: Scalars["BigInt"]["output"];
  owner: Scalars["Bytes"]["output"];
  pool: Pool;
  position: Position;
  timestamp: Scalars["BigInt"]["output"];
  transaction: Transaction;
  withdrawnToken0: Scalars["BigDecimal"]["output"];
  withdrawnToken1: Scalars["BigDecimal"]["output"];
};

export type PositionSnapshot_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PositionSnapshot_Filter>>>;
  blockNumber?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  blockNumber_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  collectedFeesToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feeGrowthInside0LastX128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthInside0LastX128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthInside1LastX128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthInside1LastX128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidity?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidity_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<PositionSnapshot_Filter>>>;
  owner?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  position?: InputMaybe<Scalars["String"]["input"]>;
  position_?: InputMaybe<Position_Filter>;
  position_contains?: InputMaybe<Scalars["String"]["input"]>;
  position_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  position_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  position_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  position_gt?: InputMaybe<Scalars["String"]["input"]>;
  position_gte?: InputMaybe<Scalars["String"]["input"]>;
  position_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  position_lt?: InputMaybe<Scalars["String"]["input"]>;
  position_lte?: InputMaybe<Scalars["String"]["input"]>;
  position_not?: InputMaybe<Scalars["String"]["input"]>;
  position_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  position_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  position_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  position_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  position_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  position_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  position_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  position_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  position_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawnToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  withdrawnToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  withdrawnToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  withdrawnToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum PositionSnapshot_OrderBy {
  BlockNumber = "blockNumber",
  CollectedFeesToken0 = "collectedFeesToken0",
  CollectedFeesToken1 = "collectedFeesToken1",
  DepositedToken0 = "depositedToken0",
  DepositedToken1 = "depositedToken1",
  FeeGrowthInside0LastX128 = "feeGrowthInside0LastX128",
  FeeGrowthInside1LastX128 = "feeGrowthInside1LastX128",
  Id = "id",
  Liquidity = "liquidity",
  Owner = "owner",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Position = "position",
  PositionCollectedFeesToken0 = "position__collectedFeesToken0",
  PositionCollectedFeesToken1 = "position__collectedFeesToken1",
  PositionDepositedToken0 = "position__depositedToken0",
  PositionDepositedToken1 = "position__depositedToken1",
  PositionFeeGrowthInside0LastX128 = "position__feeGrowthInside0LastX128",
  PositionFeeGrowthInside1LastX128 = "position__feeGrowthInside1LastX128",
  PositionId = "position__id",
  PositionLiquidity = "position__liquidity",
  PositionOwner = "position__owner",
  PositionWithdrawnToken0 = "position__withdrawnToken0",
  PositionWithdrawnToken1 = "position__withdrawnToken1",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  WithdrawnToken0 = "withdrawnToken0",
  WithdrawnToken1 = "withdrawnToken1",
}

export type Position_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Position_Filter>>>;
  collectedFeesToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  depositedToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  depositedToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feeGrowthInside0LastX128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthInside0LastX128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside0LastX128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthInside1LastX128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthInside1LastX128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthInside1LastX128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidity?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidity_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidity_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Position_Filter>>>;
  owner?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  owner_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  owner_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_?: InputMaybe<Tick_Filter>;
  tickLower_contains?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_gt?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_gte?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tickLower_lt?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_lte?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tickLower_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tickLower_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_?: InputMaybe<Tick_Filter>;
  tickUpper_contains?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_gt?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_gte?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tickUpper_lt?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_lte?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tickUpper_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tickUpper_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0?: InputMaybe<Scalars["String"]["input"]>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_gt?: InputMaybe<Scalars["String"]["input"]>;
  token0_gte?: InputMaybe<Scalars["String"]["input"]>;
  token0_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_lt?: InputMaybe<Scalars["String"]["input"]>;
  token0_lte?: InputMaybe<Scalars["String"]["input"]>;
  token0_not?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1?: InputMaybe<Scalars["String"]["input"]>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_gt?: InputMaybe<Scalars["String"]["input"]>;
  token1_gte?: InputMaybe<Scalars["String"]["input"]>;
  token1_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_lt?: InputMaybe<Scalars["String"]["input"]>;
  token1_lte?: InputMaybe<Scalars["String"]["input"]>;
  token1_not?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  withdrawnToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  withdrawnToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  withdrawnToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  withdrawnToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  withdrawnToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum Position_OrderBy {
  CollectedFeesToken0 = "collectedFeesToken0",
  CollectedFeesToken1 = "collectedFeesToken1",
  DepositedToken0 = "depositedToken0",
  DepositedToken1 = "depositedToken1",
  FeeGrowthInside0LastX128 = "feeGrowthInside0LastX128",
  FeeGrowthInside1LastX128 = "feeGrowthInside1LastX128",
  Id = "id",
  Liquidity = "liquidity",
  Owner = "owner",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  TickLower = "tickLower",
  TickLowerCollectedFeesToken0 = "tickLower__collectedFeesToken0",
  TickLowerCollectedFeesToken1 = "tickLower__collectedFeesToken1",
  TickLowerCollectedFeesUsd = "tickLower__collectedFeesUSD",
  TickLowerCreatedAtBlockNumber = "tickLower__createdAtBlockNumber",
  TickLowerCreatedAtTimestamp = "tickLower__createdAtTimestamp",
  TickLowerFeeGrowthOutside0X128 = "tickLower__feeGrowthOutside0X128",
  TickLowerFeeGrowthOutside1X128 = "tickLower__feeGrowthOutside1X128",
  TickLowerFeesUsd = "tickLower__feesUSD",
  TickLowerId = "tickLower__id",
  TickLowerLiquidityGross = "tickLower__liquidityGross",
  TickLowerLiquidityNet = "tickLower__liquidityNet",
  TickLowerLiquidityProviderCount = "tickLower__liquidityProviderCount",
  TickLowerPoolAddress = "tickLower__poolAddress",
  TickLowerPrice0 = "tickLower__price0",
  TickLowerPrice1 = "tickLower__price1",
  TickLowerTickIdx = "tickLower__tickIdx",
  TickLowerUntrackedVolumeUsd = "tickLower__untrackedVolumeUSD",
  TickLowerVolumeToken0 = "tickLower__volumeToken0",
  TickLowerVolumeToken1 = "tickLower__volumeToken1",
  TickLowerVolumeUsd = "tickLower__volumeUSD",
  TickUpper = "tickUpper",
  TickUpperCollectedFeesToken0 = "tickUpper__collectedFeesToken0",
  TickUpperCollectedFeesToken1 = "tickUpper__collectedFeesToken1",
  TickUpperCollectedFeesUsd = "tickUpper__collectedFeesUSD",
  TickUpperCreatedAtBlockNumber = "tickUpper__createdAtBlockNumber",
  TickUpperCreatedAtTimestamp = "tickUpper__createdAtTimestamp",
  TickUpperFeeGrowthOutside0X128 = "tickUpper__feeGrowthOutside0X128",
  TickUpperFeeGrowthOutside1X128 = "tickUpper__feeGrowthOutside1X128",
  TickUpperFeesUsd = "tickUpper__feesUSD",
  TickUpperId = "tickUpper__id",
  TickUpperLiquidityGross = "tickUpper__liquidityGross",
  TickUpperLiquidityNet = "tickUpper__liquidityNet",
  TickUpperLiquidityProviderCount = "tickUpper__liquidityProviderCount",
  TickUpperPoolAddress = "tickUpper__poolAddress",
  TickUpperPrice0 = "tickUpper__price0",
  TickUpperPrice1 = "tickUpper__price1",
  TickUpperTickIdx = "tickUpper__tickIdx",
  TickUpperUntrackedVolumeUsd = "tickUpper__untrackedVolumeUSD",
  TickUpperVolumeToken0 = "tickUpper__volumeToken0",
  TickUpperVolumeToken1 = "tickUpper__volumeToken1",
  TickUpperVolumeUsd = "tickUpper__volumeUSD",
  Token0 = "token0",
  Token0Decimals = "token0__decimals",
  Token0DerivedEth = "token0__derivedETH",
  Token0FeesUsd = "token0__feesUSD",
  Token0Id = "token0__id",
  Token0Name = "token0__name",
  Token0PoolCount = "token0__poolCount",
  Token0Symbol = "token0__symbol",
  Token0TotalSupply = "token0__totalSupply",
  Token0TotalValueLocked = "token0__totalValueLocked",
  Token0TotalValueLockedUsd = "token0__totalValueLockedUSD",
  Token0TotalValueLockedUsdUntracked = "token0__totalValueLockedUSDUntracked",
  Token0TxCount = "token0__txCount",
  Token0UntrackedVolumeUsd = "token0__untrackedVolumeUSD",
  Token0Volume = "token0__volume",
  Token0VolumeUsd = "token0__volumeUSD",
  Token1 = "token1",
  Token1Decimals = "token1__decimals",
  Token1DerivedEth = "token1__derivedETH",
  Token1FeesUsd = "token1__feesUSD",
  Token1Id = "token1__id",
  Token1Name = "token1__name",
  Token1PoolCount = "token1__poolCount",
  Token1Symbol = "token1__symbol",
  Token1TotalSupply = "token1__totalSupply",
  Token1TotalValueLocked = "token1__totalValueLocked",
  Token1TotalValueLockedUsd = "token1__totalValueLockedUSD",
  Token1TotalValueLockedUsdUntracked = "token1__totalValueLockedUSDUntracked",
  Token1TxCount = "token1__txCount",
  Token1UntrackedVolumeUsd = "token1__untrackedVolumeUSD",
  Token1Volume = "token1__volume",
  Token1VolumeUsd = "token1__volumeUSD",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  WithdrawnToken0 = "withdrawnToken0",
  WithdrawnToken1 = "withdrawnToken1",
}

export type Query = {
  __typename?: "Query";
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  bundle?: Maybe<Bundle>;
  bundles: Array<Bundle>;
  burn?: Maybe<Burn>;
  burns: Array<Burn>;
  collect?: Maybe<Collect>;
  collects: Array<Collect>;
  factories: Array<Factory>;
  factory?: Maybe<Factory>;
  flash?: Maybe<Flash>;
  flashes: Array<Flash>;
  mint?: Maybe<Mint>;
  mints: Array<Mint>;
  pool?: Maybe<Pool>;
  poolDayData?: Maybe<PoolDayData>;
  poolDayDatas: Array<PoolDayData>;
  poolHourData?: Maybe<PoolHourData>;
  poolHourDatas: Array<PoolHourData>;
  pools: Array<Pool>;
  position?: Maybe<Position>;
  positionSnapshot?: Maybe<PositionSnapshot>;
  positionSnapshots: Array<PositionSnapshot>;
  positions: Array<Position>;
  swap?: Maybe<Swap>;
  swaps: Array<Swap>;
  tick?: Maybe<Tick>;
  tickDayData?: Maybe<TickDayData>;
  tickDayDatas: Array<TickDayData>;
  tickHourData?: Maybe<TickHourData>;
  tickHourDatas: Array<TickHourData>;
  ticks: Array<Tick>;
  token?: Maybe<Token>;
  tokenDayData?: Maybe<TokenDayData>;
  tokenDayDatas: Array<TokenDayData>;
  tokenHourData?: Maybe<TokenHourData>;
  tokenHourDatas: Array<TokenHourData>;
  tokens: Array<Token>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  uniswapDayData?: Maybe<UniswapDayData>;
  uniswapDayDatas: Array<UniswapDayData>;
};

export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};

export type QueryBundleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBundlesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Bundle_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bundle_Filter>;
};

export type QueryBurnArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBurnsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Burn_Filter>;
};

export type QueryCollectArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryCollectsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Collect_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Collect_Filter>;
};

export type QueryFactoriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Factory_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Factory_Filter>;
};

export type QueryFactoryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryFlashArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryFlashesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Flash_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Flash_Filter>;
};

export type QueryMintArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMintsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Mint_Filter>;
};

export type QueryPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<PoolDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolDayData_Filter>;
};

export type QueryPoolHourDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolHourDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<PoolHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PoolHourData_Filter>;
};

export type QueryPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
};

export type QueryPositionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPositionSnapshotArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPositionSnapshotsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<PositionSnapshot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PositionSnapshot_Filter>;
};

export type QueryPositionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Position_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Position_Filter>;
};

export type QuerySwapArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QuerySwapsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Swap_Filter>;
};

export type QueryTickArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTickDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTickDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<TickDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TickDayData_Filter>;
};

export type QueryTickHourDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTickHourDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<TickHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TickHourData_Filter>;
};

export type QueryTicksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Tick_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Tick_Filter>;
};

export type QueryTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTokenDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTokenDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<TokenDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TokenDayData_Filter>;
};

export type QueryTokenHourDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTokenHourDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<TokenHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TokenHourData_Filter>;
};

export type QueryTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Token_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Token_Filter>;
};

export type QueryTransactionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTransactionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Transaction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transaction_Filter>;
};

export type QueryUniswapDayDataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUniswapDayDatasArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<UniswapDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UniswapDayData_Filter>;
};

export type Swap = {
  __typename?: "Swap";
  amount0: Scalars["BigDecimal"]["output"];
  amount1: Scalars["BigDecimal"]["output"];
  amountUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  logIndex?: Maybe<Scalars["BigInt"]["output"]>;
  origin: Scalars["Bytes"]["output"];
  pool: Pool;
  recipient: Scalars["Bytes"]["output"];
  sender: Scalars["Bytes"]["output"];
  sqrtPriceX96: Scalars["BigInt"]["output"];
  tick: Scalars["BigInt"]["output"];
  timestamp: Scalars["BigInt"]["output"];
  token0: Token;
  token1: Token;
  transaction: Transaction;
};

export type Swap_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amount1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amount1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  amountUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  amountUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  logIndex?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  logIndex_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  logIndex_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Swap_Filter>>>;
  origin?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  origin_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  origin_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  recipient?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  recipient_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  recipient_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  sender?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  sender_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  sender_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  sqrtPriceX96?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPriceX96_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPriceX96_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPriceX96_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  sqrtPriceX96_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPriceX96_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPriceX96_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  sqrtPriceX96_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tick_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tick_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  token0?: InputMaybe<Scalars["String"]["input"]>;
  token0_?: InputMaybe<Token_Filter>;
  token0_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_gt?: InputMaybe<Scalars["String"]["input"]>;
  token0_gte?: InputMaybe<Scalars["String"]["input"]>;
  token0_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_lt?: InputMaybe<Scalars["String"]["input"]>;
  token0_lte?: InputMaybe<Scalars["String"]["input"]>;
  token0_not?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token0_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token0_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1?: InputMaybe<Scalars["String"]["input"]>;
  token1_?: InputMaybe<Token_Filter>;
  token1_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_gt?: InputMaybe<Scalars["String"]["input"]>;
  token1_gte?: InputMaybe<Scalars["String"]["input"]>;
  token1_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_lt?: InputMaybe<Scalars["String"]["input"]>;
  token1_lte?: InputMaybe<Scalars["String"]["input"]>;
  token1_not?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token1_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token1_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction?: InputMaybe<Scalars["String"]["input"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_gte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]["input"]>;
  transaction_lte?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum Swap_OrderBy {
  Amount0 = "amount0",
  Amount1 = "amount1",
  AmountUsd = "amountUSD",
  Id = "id",
  LogIndex = "logIndex",
  Origin = "origin",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Recipient = "recipient",
  Sender = "sender",
  SqrtPriceX96 = "sqrtPriceX96",
  Tick = "tick",
  Timestamp = "timestamp",
  Token0 = "token0",
  Token0Decimals = "token0__decimals",
  Token0DerivedEth = "token0__derivedETH",
  Token0FeesUsd = "token0__feesUSD",
  Token0Id = "token0__id",
  Token0Name = "token0__name",
  Token0PoolCount = "token0__poolCount",
  Token0Symbol = "token0__symbol",
  Token0TotalSupply = "token0__totalSupply",
  Token0TotalValueLocked = "token0__totalValueLocked",
  Token0TotalValueLockedUsd = "token0__totalValueLockedUSD",
  Token0TotalValueLockedUsdUntracked = "token0__totalValueLockedUSDUntracked",
  Token0TxCount = "token0__txCount",
  Token0UntrackedVolumeUsd = "token0__untrackedVolumeUSD",
  Token0Volume = "token0__volume",
  Token0VolumeUsd = "token0__volumeUSD",
  Token1 = "token1",
  Token1Decimals = "token1__decimals",
  Token1DerivedEth = "token1__derivedETH",
  Token1FeesUsd = "token1__feesUSD",
  Token1Id = "token1__id",
  Token1Name = "token1__name",
  Token1PoolCount = "token1__poolCount",
  Token1Symbol = "token1__symbol",
  Token1TotalSupply = "token1__totalSupply",
  Token1TotalValueLocked = "token1__totalValueLocked",
  Token1TotalValueLockedUsd = "token1__totalValueLockedUSD",
  Token1TotalValueLockedUsdUntracked = "token1__totalValueLockedUSDUntracked",
  Token1TxCount = "token1__txCount",
  Token1UntrackedVolumeUsd = "token1__untrackedVolumeUSD",
  Token1Volume = "token1__volume",
  Token1VolumeUsd = "token1__volumeUSD",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
}

export type Tick = {
  __typename?: "Tick";
  collectedFeesToken0: Scalars["BigDecimal"]["output"];
  collectedFeesToken1: Scalars["BigDecimal"]["output"];
  collectedFeesUSD: Scalars["BigDecimal"]["output"];
  createdAtBlockNumber: Scalars["BigInt"]["output"];
  createdAtTimestamp: Scalars["BigInt"]["output"];
  feeGrowthOutside0X128: Scalars["BigInt"]["output"];
  feeGrowthOutside1X128: Scalars["BigInt"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  liquidityGross: Scalars["BigInt"]["output"];
  liquidityNet: Scalars["BigInt"]["output"];
  liquidityProviderCount: Scalars["BigInt"]["output"];
  pool: Pool;
  poolAddress?: Maybe<Scalars["String"]["output"]>;
  price0: Scalars["BigDecimal"]["output"];
  price1: Scalars["BigDecimal"]["output"];
  tickIdx: Scalars["BigInt"]["output"];
  untrackedVolumeUSD: Scalars["BigDecimal"]["output"];
  volumeToken0: Scalars["BigDecimal"]["output"];
  volumeToken1: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type TickDayData = {
  __typename?: "TickDayData";
  date: Scalars["Int"]["output"];
  feeGrowthOutside0X128: Scalars["BigInt"]["output"];
  feeGrowthOutside1X128: Scalars["BigInt"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  liquidityGross: Scalars["BigInt"]["output"];
  liquidityNet: Scalars["BigInt"]["output"];
  pool: Pool;
  tick: Tick;
  volumeToken0: Scalars["BigDecimal"]["output"];
  volumeToken1: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type TickDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TickDayData_Filter>>>;
  date?: InputMaybe<Scalars["Int"]["input"]>;
  date_gt?: InputMaybe<Scalars["Int"]["input"]>;
  date_gte?: InputMaybe<Scalars["Int"]["input"]>;
  date_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  date_lt?: InputMaybe<Scalars["Int"]["input"]>;
  date_lte?: InputMaybe<Scalars["Int"]["input"]>;
  date_not?: InputMaybe<Scalars["Int"]["input"]>;
  date_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  feeGrowthOutside0X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside0X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside1X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside1X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidityGross?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityGross_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityNet?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityNet_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<TickDayData_Filter>>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick?: InputMaybe<Scalars["String"]["input"]>;
  tick_?: InputMaybe<Tick_Filter>;
  tick_contains?: InputMaybe<Scalars["String"]["input"]>;
  tick_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_gt?: InputMaybe<Scalars["String"]["input"]>;
  tick_gte?: InputMaybe<Scalars["String"]["input"]>;
  tick_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tick_lt?: InputMaybe<Scalars["String"]["input"]>;
  tick_lte?: InputMaybe<Scalars["String"]["input"]>;
  tick_not?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tick_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  volumeToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum TickDayData_OrderBy {
  Date = "date",
  FeeGrowthOutside0X128 = "feeGrowthOutside0X128",
  FeeGrowthOutside1X128 = "feeGrowthOutside1X128",
  FeesUsd = "feesUSD",
  Id = "id",
  LiquidityGross = "liquidityGross",
  LiquidityNet = "liquidityNet",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Tick = "tick",
  TickCollectedFeesToken0 = "tick__collectedFeesToken0",
  TickCollectedFeesToken1 = "tick__collectedFeesToken1",
  TickCollectedFeesUsd = "tick__collectedFeesUSD",
  TickCreatedAtBlockNumber = "tick__createdAtBlockNumber",
  TickCreatedAtTimestamp = "tick__createdAtTimestamp",
  TickFeeGrowthOutside0X128 = "tick__feeGrowthOutside0X128",
  TickFeeGrowthOutside1X128 = "tick__feeGrowthOutside1X128",
  TickFeesUsd = "tick__feesUSD",
  TickId = "tick__id",
  TickLiquidityGross = "tick__liquidityGross",
  TickLiquidityNet = "tick__liquidityNet",
  TickLiquidityProviderCount = "tick__liquidityProviderCount",
  TickPoolAddress = "tick__poolAddress",
  TickPrice0 = "tick__price0",
  TickPrice1 = "tick__price1",
  TickTickIdx = "tick__tickIdx",
  TickUntrackedVolumeUsd = "tick__untrackedVolumeUSD",
  TickVolumeToken0 = "tick__volumeToken0",
  TickVolumeToken1 = "tick__volumeToken1",
  TickVolumeUsd = "tick__volumeUSD",
  VolumeToken0 = "volumeToken0",
  VolumeToken1 = "volumeToken1",
  VolumeUsd = "volumeUSD",
}

export type TickHourData = {
  __typename?: "TickHourData";
  feesUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  liquidityGross: Scalars["BigInt"]["output"];
  liquidityNet: Scalars["BigInt"]["output"];
  periodStartUnix: Scalars["Int"]["output"];
  pool: Pool;
  tick: Tick;
  volumeToken0: Scalars["BigDecimal"]["output"];
  volumeToken1: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type TickHourData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TickHourData_Filter>>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidityGross?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityGross_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityNet?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityNet_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<TickHourData_Filter>>>;
  periodStartUnix?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_gt?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_gte?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  periodStartUnix_lt?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_lte?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_not?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick?: InputMaybe<Scalars["String"]["input"]>;
  tick_?: InputMaybe<Tick_Filter>;
  tick_contains?: InputMaybe<Scalars["String"]["input"]>;
  tick_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_gt?: InputMaybe<Scalars["String"]["input"]>;
  tick_gte?: InputMaybe<Scalars["String"]["input"]>;
  tick_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tick_lt?: InputMaybe<Scalars["String"]["input"]>;
  tick_lte?: InputMaybe<Scalars["String"]["input"]>;
  tick_not?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tick_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tick_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  tick_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  volumeToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum TickHourData_OrderBy {
  FeesUsd = "feesUSD",
  Id = "id",
  LiquidityGross = "liquidityGross",
  LiquidityNet = "liquidityNet",
  PeriodStartUnix = "periodStartUnix",
  Pool = "pool",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Tick = "tick",
  TickCollectedFeesToken0 = "tick__collectedFeesToken0",
  TickCollectedFeesToken1 = "tick__collectedFeesToken1",
  TickCollectedFeesUsd = "tick__collectedFeesUSD",
  TickCreatedAtBlockNumber = "tick__createdAtBlockNumber",
  TickCreatedAtTimestamp = "tick__createdAtTimestamp",
  TickFeeGrowthOutside0X128 = "tick__feeGrowthOutside0X128",
  TickFeeGrowthOutside1X128 = "tick__feeGrowthOutside1X128",
  TickFeesUsd = "tick__feesUSD",
  TickId = "tick__id",
  TickLiquidityGross = "tick__liquidityGross",
  TickLiquidityNet = "tick__liquidityNet",
  TickLiquidityProviderCount = "tick__liquidityProviderCount",
  TickPoolAddress = "tick__poolAddress",
  TickPrice0 = "tick__price0",
  TickPrice1 = "tick__price1",
  TickTickIdx = "tick__tickIdx",
  TickUntrackedVolumeUsd = "tick__untrackedVolumeUSD",
  TickVolumeToken0 = "tick__volumeToken0",
  TickVolumeToken1 = "tick__volumeToken1",
  TickVolumeUsd = "tick__volumeUSD",
  VolumeToken0 = "volumeToken0",
  VolumeToken1 = "volumeToken1",
  VolumeUsd = "volumeUSD",
}

export type Tick_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Tick_Filter>>>;
  collectedFeesToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  collectedFeesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  collectedFeesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  createdAtBlockNumber?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdAtBlockNumber_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtBlockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdAtTimestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  createdAtTimestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  createdAtTimestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside0X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside0X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside0X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside1X128?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeGrowthOutside1X128_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeGrowthOutside1X128_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  liquidityGross?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityGross_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityGross_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityNet?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityNet_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityNet_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityProviderCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  liquidityProviderCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  liquidityProviderCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Tick_Filter>>>;
  pool?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_contains?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_gt?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_gte?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  poolAddress_lt?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_lte?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  poolAddress_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  poolAddress_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_?: InputMaybe<Pool_Filter>;
  pool_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_gt?: InputMaybe<Scalars["String"]["input"]>;
  pool_gte?: InputMaybe<Scalars["String"]["input"]>;
  pool_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_lt?: InputMaybe<Scalars["String"]["input"]>;
  pool_lte?: InputMaybe<Scalars["String"]["input"]>;
  pool_not?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  pool_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  pool_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  price0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  price0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  price1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  price1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  price1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  tickIdx?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickIdx_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickIdx_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickIdx_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  tickIdx_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickIdx_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickIdx_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  tickIdx_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  untrackedVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken0_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken0_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeToken1_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeToken1_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum Tick_OrderBy {
  CollectedFeesToken0 = "collectedFeesToken0",
  CollectedFeesToken1 = "collectedFeesToken1",
  CollectedFeesUsd = "collectedFeesUSD",
  CreatedAtBlockNumber = "createdAtBlockNumber",
  CreatedAtTimestamp = "createdAtTimestamp",
  FeeGrowthOutside0X128 = "feeGrowthOutside0X128",
  FeeGrowthOutside1X128 = "feeGrowthOutside1X128",
  FeesUsd = "feesUSD",
  Id = "id",
  LiquidityGross = "liquidityGross",
  LiquidityNet = "liquidityNet",
  LiquidityProviderCount = "liquidityProviderCount",
  Pool = "pool",
  PoolAddress = "poolAddress",
  PoolCollectedFeesToken0 = "pool__collectedFeesToken0",
  PoolCollectedFeesToken1 = "pool__collectedFeesToken1",
  PoolCollectedFeesUsd = "pool__collectedFeesUSD",
  PoolCreatedAtBlockNumber = "pool__createdAtBlockNumber",
  PoolCreatedAtTimestamp = "pool__createdAtTimestamp",
  PoolFeeGrowthGlobal0X128 = "pool__feeGrowthGlobal0X128",
  PoolFeeGrowthGlobal1X128 = "pool__feeGrowthGlobal1X128",
  PoolFeeTier = "pool__feeTier",
  PoolFeesUsd = "pool__feesUSD",
  PoolId = "pool__id",
  PoolLiquidity = "pool__liquidity",
  PoolLiquidityProviderCount = "pool__liquidityProviderCount",
  PoolObservationIndex = "pool__observationIndex",
  PoolSqrtPrice = "pool__sqrtPrice",
  PoolTick = "pool__tick",
  PoolToken0Price = "pool__token0Price",
  PoolToken1Price = "pool__token1Price",
  PoolTotalValueLockedEth = "pool__totalValueLockedETH",
  PoolTotalValueLockedToken0 = "pool__totalValueLockedToken0",
  PoolTotalValueLockedToken1 = "pool__totalValueLockedToken1",
  PoolTotalValueLockedUsd = "pool__totalValueLockedUSD",
  PoolTotalValueLockedUsdUntracked = "pool__totalValueLockedUSDUntracked",
  PoolTxCount = "pool__txCount",
  PoolUntrackedVolumeUsd = "pool__untrackedVolumeUSD",
  PoolVolumeToken0 = "pool__volumeToken0",
  PoolVolumeToken1 = "pool__volumeToken1",
  PoolVolumeUsd = "pool__volumeUSD",
  Price0 = "price0",
  Price1 = "price1",
  TickIdx = "tickIdx",
  UntrackedVolumeUsd = "untrackedVolumeUSD",
  VolumeToken0 = "volumeToken0",
  VolumeToken1 = "volumeToken1",
  VolumeUsd = "volumeUSD",
}

export type Token = {
  __typename?: "Token";
  decimals: Scalars["BigInt"]["output"];
  derivedETH: Scalars["BigDecimal"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  poolCount: Scalars["BigInt"]["output"];
  symbol: Scalars["String"]["output"];
  tokenDayData: Array<TokenDayData>;
  totalSupply: Scalars["BigInt"]["output"];
  totalValueLocked: Scalars["BigDecimal"]["output"];
  totalValueLockedUSD: Scalars["BigDecimal"]["output"];
  totalValueLockedUSDUntracked: Scalars["BigDecimal"]["output"];
  txCount: Scalars["BigInt"]["output"];
  untrackedVolumeUSD: Scalars["BigDecimal"]["output"];
  volume: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
  whitelistPools: Array<Pool>;
};

export type TokenTokenDayDataArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<TokenDayData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<TokenDayData_Filter>;
};

export type TokenWhitelistPoolsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Pool_Filter>;
};

export type TokenDayData = {
  __typename?: "TokenDayData";
  close: Scalars["BigDecimal"]["output"];
  date: Scalars["Int"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  high: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  low: Scalars["BigDecimal"]["output"];
  open: Scalars["BigDecimal"]["output"];
  priceUSD: Scalars["BigDecimal"]["output"];
  token: Token;
  totalValueLocked: Scalars["BigDecimal"]["output"];
  totalValueLockedUSD: Scalars["BigDecimal"]["output"];
  untrackedVolumeUSD: Scalars["BigDecimal"]["output"];
  volume: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type TokenDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenDayData_Filter>>>;
  close?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  close_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  date?: InputMaybe<Scalars["Int"]["input"]>;
  date_gt?: InputMaybe<Scalars["Int"]["input"]>;
  date_gte?: InputMaybe<Scalars["Int"]["input"]>;
  date_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  date_lt?: InputMaybe<Scalars["Int"]["input"]>;
  date_lte?: InputMaybe<Scalars["Int"]["input"]>;
  date_not?: InputMaybe<Scalars["Int"]["input"]>;
  date_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  low?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  low_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<TokenDayData_Filter>>>;
  priceUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  priceUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token?: InputMaybe<Scalars["String"]["input"]>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars["String"]["input"]>;
  token_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_gt?: InputMaybe<Scalars["String"]["input"]>;
  token_gte?: InputMaybe<Scalars["String"]["input"]>;
  token_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token_lt?: InputMaybe<Scalars["String"]["input"]>;
  token_lte?: InputMaybe<Scalars["String"]["input"]>;
  token_not?: InputMaybe<Scalars["String"]["input"]>;
  token_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  totalValueLocked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLocked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLocked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum TokenDayData_OrderBy {
  Close = "close",
  Date = "date",
  FeesUsd = "feesUSD",
  High = "high",
  Id = "id",
  Low = "low",
  Open = "open",
  PriceUsd = "priceUSD",
  Token = "token",
  TokenDecimals = "token__decimals",
  TokenDerivedEth = "token__derivedETH",
  TokenFeesUsd = "token__feesUSD",
  TokenId = "token__id",
  TokenName = "token__name",
  TokenPoolCount = "token__poolCount",
  TokenSymbol = "token__symbol",
  TokenTotalSupply = "token__totalSupply",
  TokenTotalValueLocked = "token__totalValueLocked",
  TokenTotalValueLockedUsd = "token__totalValueLockedUSD",
  TokenTotalValueLockedUsdUntracked = "token__totalValueLockedUSDUntracked",
  TokenTxCount = "token__txCount",
  TokenUntrackedVolumeUsd = "token__untrackedVolumeUSD",
  TokenVolume = "token__volume",
  TokenVolumeUsd = "token__volumeUSD",
  TotalValueLocked = "totalValueLocked",
  TotalValueLockedUsd = "totalValueLockedUSD",
  UntrackedVolumeUsd = "untrackedVolumeUSD",
  Volume = "volume",
  VolumeUsd = "volumeUSD",
}

export type TokenHourData = {
  __typename?: "TokenHourData";
  close: Scalars["BigDecimal"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  high: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  low: Scalars["BigDecimal"]["output"];
  open: Scalars["BigDecimal"]["output"];
  periodStartUnix: Scalars["Int"]["output"];
  priceUSD: Scalars["BigDecimal"]["output"];
  token: Token;
  totalValueLocked: Scalars["BigDecimal"]["output"];
  totalValueLockedUSD: Scalars["BigDecimal"]["output"];
  untrackedVolumeUSD: Scalars["BigDecimal"]["output"];
  volume: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
};

export type TokenHourData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TokenHourData_Filter>>>;
  close?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  close_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  close_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  high_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  high_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  low?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  low_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  low_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  open_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  open_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<TokenHourData_Filter>>>;
  periodStartUnix?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_gt?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_gte?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  periodStartUnix_lt?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_lte?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_not?: InputMaybe<Scalars["Int"]["input"]>;
  periodStartUnix_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  priceUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  priceUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  priceUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  token?: InputMaybe<Scalars["String"]["input"]>;
  token_?: InputMaybe<Token_Filter>;
  token_contains?: InputMaybe<Scalars["String"]["input"]>;
  token_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_gt?: InputMaybe<Scalars["String"]["input"]>;
  token_gte?: InputMaybe<Scalars["String"]["input"]>;
  token_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token_lt?: InputMaybe<Scalars["String"]["input"]>;
  token_lte?: InputMaybe<Scalars["String"]["input"]>;
  token_not?: InputMaybe<Scalars["String"]["input"]>;
  token_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  token_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  token_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  token_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  token_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  token_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  totalValueLocked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLocked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLocked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum TokenHourData_OrderBy {
  Close = "close",
  FeesUsd = "feesUSD",
  High = "high",
  Id = "id",
  Low = "low",
  Open = "open",
  PeriodStartUnix = "periodStartUnix",
  PriceUsd = "priceUSD",
  Token = "token",
  TokenDecimals = "token__decimals",
  TokenDerivedEth = "token__derivedETH",
  TokenFeesUsd = "token__feesUSD",
  TokenId = "token__id",
  TokenName = "token__name",
  TokenPoolCount = "token__poolCount",
  TokenSymbol = "token__symbol",
  TokenTotalSupply = "token__totalSupply",
  TokenTotalValueLocked = "token__totalValueLocked",
  TokenTotalValueLockedUsd = "token__totalValueLockedUSD",
  TokenTotalValueLockedUsdUntracked = "token__totalValueLockedUSDUntracked",
  TokenTxCount = "token__txCount",
  TokenUntrackedVolumeUsd = "token__untrackedVolumeUSD",
  TokenVolume = "token__volume",
  TokenVolumeUsd = "token__volumeUSD",
  TotalValueLocked = "totalValueLocked",
  TotalValueLockedUsd = "totalValueLockedUSD",
  UntrackedVolumeUsd = "untrackedVolumeUSD",
  Volume = "volume",
  VolumeUsd = "volumeUSD",
}

export type Token_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  decimals?: InputMaybe<Scalars["BigInt"]["input"]>;
  decimals_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  decimals_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  decimals_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  decimals_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  decimals_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  decimals_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  decimals_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  derivedETH?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  derivedETH_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  derivedETH_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  derivedETH_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  derivedETH_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  derivedETH_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  derivedETH_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  derivedETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  name_contains?: InputMaybe<Scalars["String"]["input"]>;
  name_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  name_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  name_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  name_gt?: InputMaybe<Scalars["String"]["input"]>;
  name_gte?: InputMaybe<Scalars["String"]["input"]>;
  name_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  name_lt?: InputMaybe<Scalars["String"]["input"]>;
  name_lte?: InputMaybe<Scalars["String"]["input"]>;
  name_not?: InputMaybe<Scalars["String"]["input"]>;
  name_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  name_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  name_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  name_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  name_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  name_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  name_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  name_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  name_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<Token_Filter>>>;
  poolCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  poolCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  poolCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  symbol?: InputMaybe<Scalars["String"]["input"]>;
  symbol_contains?: InputMaybe<Scalars["String"]["input"]>;
  symbol_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  symbol_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  symbol_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  symbol_gt?: InputMaybe<Scalars["String"]["input"]>;
  symbol_gte?: InputMaybe<Scalars["String"]["input"]>;
  symbol_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  symbol_lt?: InputMaybe<Scalars["String"]["input"]>;
  symbol_lte?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  symbol_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  symbol_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  symbol_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  symbol_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  tokenDayData_?: InputMaybe<TokenDayData_Filter>;
  totalSupply?: InputMaybe<Scalars["BigInt"]["input"]>;
  totalSupply_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  totalSupply_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  totalSupply_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  totalSupply_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  totalSupply_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  totalSupply_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  totalSupply_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  totalValueLocked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSDUntracked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSDUntracked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLockedUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLockedUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLocked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  totalValueLocked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  totalValueLocked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  txCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  untrackedVolumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  untrackedVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  untrackedVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volume_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volume_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  whitelistPools?: InputMaybe<Array<Scalars["String"]["input"]>>;
  whitelistPools_?: InputMaybe<Pool_Filter>;
  whitelistPools_contains?: InputMaybe<Array<Scalars["String"]["input"]>>;
  whitelistPools_contains_nocase?: InputMaybe<Array<Scalars["String"]["input"]>>;
  whitelistPools_not?: InputMaybe<Array<Scalars["String"]["input"]>>;
  whitelistPools_not_contains?: InputMaybe<Array<Scalars["String"]["input"]>>;
  whitelistPools_not_contains_nocase?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export enum Token_OrderBy {
  Decimals = "decimals",
  DerivedEth = "derivedETH",
  FeesUsd = "feesUSD",
  Id = "id",
  Name = "name",
  PoolCount = "poolCount",
  Symbol = "symbol",
  TokenDayData = "tokenDayData",
  TotalSupply = "totalSupply",
  TotalValueLocked = "totalValueLocked",
  TotalValueLockedUsd = "totalValueLockedUSD",
  TotalValueLockedUsdUntracked = "totalValueLockedUSDUntracked",
  TxCount = "txCount",
  UntrackedVolumeUsd = "untrackedVolumeUSD",
  Volume = "volume",
  VolumeUsd = "volumeUSD",
  WhitelistPools = "whitelistPools",
}

export type Transaction = {
  __typename?: "Transaction";
  blockNumber: Scalars["BigInt"]["output"];
  burns: Array<Maybe<Burn>>;
  collects: Array<Maybe<Collect>>;
  flashed: Array<Maybe<Flash>>;
  gasPrice: Scalars["BigInt"]["output"];
  gasUsed: Scalars["BigInt"]["output"];
  id: Scalars["ID"]["output"];
  mints: Array<Maybe<Mint>>;
  swaps: Array<Maybe<Swap>>;
  timestamp: Scalars["BigInt"]["output"];
};

export type TransactionBurnsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Burn_Filter>;
};

export type TransactionCollectsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Collect_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Collect_Filter>;
};

export type TransactionFlashedArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Flash_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Flash_Filter>;
};

export type TransactionMintsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Mint_Filter>;
};

export type TransactionSwapsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Swap_Filter>;
};

export type Transaction_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Transaction_Filter>>>;
  blockNumber?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  blockNumber_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  blockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  burns_?: InputMaybe<Burn_Filter>;
  collects_?: InputMaybe<Collect_Filter>;
  flashed_?: InputMaybe<Flash_Filter>;
  gasPrice?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasPrice_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasPrice_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasPrice_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  gasPrice_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasPrice_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasPrice_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasPrice_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  gasUsed?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasUsed_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasUsed_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasUsed_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  gasUsed_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasUsed_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasUsed_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  gasUsed_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  mints_?: InputMaybe<Mint_Filter>;
  or?: InputMaybe<Array<InputMaybe<Transaction_Filter>>>;
  swaps_?: InputMaybe<Swap_Filter>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
};

export enum Transaction_OrderBy {
  BlockNumber = "blockNumber",
  Burns = "burns",
  Collects = "collects",
  Flashed = "flashed",
  GasPrice = "gasPrice",
  GasUsed = "gasUsed",
  Id = "id",
  Mints = "mints",
  Swaps = "swaps",
  Timestamp = "timestamp",
}

export type UniswapDayData = {
  __typename?: "UniswapDayData";
  date: Scalars["Int"]["output"];
  feesUSD: Scalars["BigDecimal"]["output"];
  id: Scalars["ID"]["output"];
  tvlUSD: Scalars["BigDecimal"]["output"];
  txCount: Scalars["BigInt"]["output"];
  volumeETH: Scalars["BigDecimal"]["output"];
  volumeUSD: Scalars["BigDecimal"]["output"];
  volumeUSDUntracked: Scalars["BigDecimal"]["output"];
};

export type UniswapDayData_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<UniswapDayData_Filter>>>;
  date?: InputMaybe<Scalars["Int"]["input"]>;
  date_gt?: InputMaybe<Scalars["Int"]["input"]>;
  date_gte?: InputMaybe<Scalars["Int"]["input"]>;
  date_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  date_lt?: InputMaybe<Scalars["Int"]["input"]>;
  date_lte?: InputMaybe<Scalars["Int"]["input"]>;
  date_not?: InputMaybe<Scalars["Int"]["input"]>;
  date_not_in?: InputMaybe<Array<Scalars["Int"]["input"]>>;
  feesUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  feesUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  feesUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<UniswapDayData_Filter>>>;
  tvlUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  tvlUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  tvlUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  txCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  txCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  volumeETH?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeETH_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeETH_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeETH_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeETH_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeETH_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSDUntracked_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSDUntracked_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]["input"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]["input"]>>;
};

export enum UniswapDayData_OrderBy {
  Date = "date",
  FeesUsd = "feesUSD",
  Id = "id",
  TvlUsd = "tvlUSD",
  TxCount = "txCount",
  VolumeEth = "volumeETH",
  VolumeUsd = "volumeUSD",
  VolumeUsdUntracked = "volumeUSDUntracked",
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
   *
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

export type GetPoolsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Pool_Filter>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetPoolsQuery = {
  __typename?: "Query";
  pools: Array<{
    __typename: "Pool";
    id: string;
    feeTier: string;
    liquidity: string;
    sqrtPrice: string;
    tick?: string | null;
    token0Price: string;
    token1Price: string;
    volumeToken0: string;
    volumeToken1: string;
    volumeUSD: string;
    txCount: string;
    totalValueLockedToken0: string;
    totalValueLockedToken1: string;
    totalValueLockedUSD: string;
    totalValueLockedUSDUntracked: string;
    untrackedVolumeUSD: string;
    feesUSD: string;
    token0: { __typename: "Token"; id: string; symbol: string; name: string; decimals: string };
    token1: { __typename: "Token"; id: string; symbol: string; name: string; decimals: string };
  }>;
};

export type GetPoolHourDatasQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<PoolHourData_Filter>;
  orderBy?: InputMaybe<PoolHourData_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetPoolHourDatasQuery = {
  __typename?: "Query";
  poolHourDatas: Array<{
    __typename?: "PoolHourData";
    token0Price: string;
    token1Price: string;
    periodStartUnix: number;
    sqrtPrice: string;
    liquidity: string;
    pool: {
      __typename?: "Pool";
      id: string;
      liquidity: string;
      token0: { __typename?: "Token"; id: string; name: string };
      token1: { __typename?: "Token"; id: string; name: string };
    };
  }>;
};

export type GetSwapsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Swap_Filter>;
  orderBy?: InputMaybe<Swap_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetSwapsQuery = {
  __typename?: "Query";
  swaps: Array<{
    __typename?: "Swap";
    id: string;
    sender: `0x${string}`;
    recipient: `0x${string}`;
    amount0: string;
    amount1: string;
    timestamp: string;
    tick: string;
    token0: { __typename?: "Token"; id: string; symbol: string; decimals: string };
    token1: { __typename?: "Token"; id: string; symbol: string; decimals: string };
    transaction: { __typename?: "Transaction"; id: string; blockNumber: string };
    pool: {
      __typename?: "Pool";
      id: string;
      liquidity: string;
      token0: { __typename?: "Token"; id: string; name: string };
      token1: { __typename?: "Token"; id: string; name: string };
    };
  }>;
};

export type GetMintsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Mint_Filter>;
  orderBy?: InputMaybe<Mint_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetMintsQuery = {
  __typename?: "Query";
  mints: Array<{
    __typename?: "Mint";
    id: string;
    owner: `0x${string}`;
    amount0: string;
    amount1: string;
    timestamp: string;
    token0: { __typename?: "Token"; id: string; symbol: string; decimals: string };
    token1: { __typename?: "Token"; id: string; symbol: string; decimals: string };
    transaction: { __typename?: "Transaction"; id: string; blockNumber: string };
  }>;
};

export type GetBurnsQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Burn_Filter>;
  orderBy?: InputMaybe<Burn_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetBurnsQuery = {
  __typename?: "Query";
  burns: Array<{
    __typename?: "Burn";
    id: string;
    owner?: `0x${string}` | null;
    amount0: string;
    amount1: string;
    timestamp: string;
    token0: { __typename?: "Token"; id: string; symbol: string; decimals: string };
    token1: { __typename?: "Token"; id: string; symbol: string; decimals: string };
    transaction: { __typename?: "Transaction"; id: string; blockNumber: string };
  }>;
};

export type GetTicksQueryVariables = Exact<{
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Tick_Filter>;
  orderBy?: InputMaybe<Tick_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetTicksQuery = {
  __typename?: "Query";
  ticks: Array<{ __typename?: "Tick"; tickIdx: string; liquidityNet: string }>;
};

export const GetPoolsDocument = gql`
    query GetPools($skip: Int = 0, $first: Int, $orderBy: Pool_orderBy, $orderDirection: OrderDirection, $where: Pool_filter, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  pools(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    id
    feeTier
    liquidity
    sqrtPrice
    tick
    token0 {
      id
      symbol
      name
      decimals
      __typename
    }
    token1 {
      id
      symbol
      name
      decimals
      __typename
    }
    token0Price
    token1Price
    volumeToken0
    volumeToken1
    volumeUSD
    txCount
    totalValueLockedToken0
    totalValueLockedToken1
    totalValueLockedUSD
    totalValueLockedUSDUntracked
    untrackedVolumeUSD
    feesUSD
    __typename
  }
}
    `;
export const GetPoolHourDatasDocument = gql`
    query GetPoolHourDatas($skip: Int = 0, $first: Int, $where: PoolHourData_filter, $orderBy: PoolHourData_orderBy, $orderDirection: OrderDirection, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  poolHourDatas(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    token0Price
    token1Price
    periodStartUnix
    sqrtPrice
    liquidity
    pool {
      id
      liquidity
      token0 {
        id
        name
      }
      token1 {
        id
        name
      }
    }
  }
}
    `;
export const GetSwapsDocument = gql`
    query GetSwaps($skip: Int = 0, $first: Int, $where: Swap_filter, $orderBy: Swap_orderBy, $orderDirection: OrderDirection, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  swaps(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    id
    sender
    recipient
    amount0
    amount1
    token0 {
      id
      symbol
      decimals
    }
    token1 {
      id
      symbol
      decimals
    }
    timestamp
    transaction {
      id
      blockNumber
    }
    tick
    pool {
      id
      liquidity
      token0 {
        id
        name
      }
      token1 {
        id
        name
      }
    }
  }
}
    `;
export const GetMintsDocument = gql`
    query GetMints($skip: Int = 0, $first: Int, $where: Mint_filter, $orderBy: Mint_orderBy, $orderDirection: OrderDirection, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  mints(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    id
    owner
    amount0
    amount1
    token0 {
      id
      symbol
      decimals
    }
    token1 {
      id
      symbol
      decimals
    }
    timestamp
    transaction {
      id
      blockNumber
    }
  }
}
    `;
export const GetBurnsDocument = gql`
    query GetBurns($skip: Int = 0, $first: Int, $where: Burn_filter, $orderBy: Burn_orderBy, $orderDirection: OrderDirection, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  burns(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    id
    owner
    amount0
    amount1
    token0 {
      id
      symbol
      decimals
    }
    token1 {
      id
      symbol
      decimals
    }
    timestamp
    transaction {
      id
      blockNumber
    }
  }
}
    `;
export const GetTicksDocument = gql`
    query GetTicks($skip: Int = 0, $first: Int, $where: Tick_filter, $orderBy: Tick_orderBy, $orderDirection: OrderDirection, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  ticks(
    skip: $skip
    first: $first
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
    subgraphError: $subgraphError
  ) {
    tickIdx
    liquidityNet
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
    GetPools(variables?: GetPoolsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetPoolsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetPoolsQuery>(GetPoolsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetPools",
        "query",
        variables,
      );
    },
    GetPoolHourDatas(
      variables?: GetPoolHourDatasQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetPoolHourDatasQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetPoolHourDatasQuery>(GetPoolHourDatasDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetPoolHourDatas",
        "query",
        variables,
      );
    },
    GetSwaps(variables?: GetSwapsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetSwapsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetSwapsQuery>(GetSwapsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetSwaps",
        "query",
        variables,
      );
    },
    GetMints(variables?: GetMintsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetMintsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetMintsQuery>(GetMintsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetMints",
        "query",
        variables,
      );
    },
    GetBurns(variables?: GetBurnsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetBurnsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetBurnsQuery>(GetBurnsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetBurns",
        "query",
        variables,
      );
    },
    GetTicks(variables?: GetTicksQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<GetTicksQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetTicksQuery>(GetTicksDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetTicks",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
