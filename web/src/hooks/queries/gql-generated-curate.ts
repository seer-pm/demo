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

export type Arbitrator = {
  __typename?: "Arbitrator";
  /** The address of the arbitrator */
  id: Scalars["ID"]["output"];
};

export type Arbitrator_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Arbitrator_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Arbitrator_Filter>>>;
};

export enum Arbitrator_OrderBy {
  Id = "id",
}

export type BlockChangedFilter = {
  number_gte: Scalars["Int"]["input"];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars["Bytes"]["input"]>;
  number?: InputMaybe<Scalars["Int"]["input"]>;
  number_gte?: InputMaybe<Scalars["Int"]["input"]>;
};

export type Evidence = {
  __typename?: "Evidence";
  /** The URI of the evidence file. */
  URI: Scalars["String"]["output"];
  /** The arbitrator's address. */
  arbitrator: Scalars["Bytes"]["output"];
  /** The evidence group */
  evidenceGroup: EvidenceGroup;
  /** evidenceGroupId@tcrAddress-number */
  id: Scalars["ID"]["output"];
  metadata?: Maybe<EvidenceMetadata>;
  /** This is the <number>th evidence submitted (starting at 0) for <request>. */
  number: Scalars["BigInt"]["output"];
  /** The address of the party that sent this piece of evidence. */
  party: Scalars["Bytes"]["output"];
  /** When was this evidence posted */
  timestamp: Scalars["BigInt"]["output"];
  /** Tx hash of the evidence submission */
  txHash: Scalars["Bytes"]["output"];
};

export type EvidenceGroup = {
  __typename?: "EvidenceGroup";
  /** Evidences posted to this evidenceGroupId */
  evidences: Array<Evidence>;
  /** evidenceGroupId@tcrAddress */
  id: Scalars["ID"]["output"];
  /** Number of evidences posted in this group */
  numberOfEvidence: Scalars["BigInt"]["output"];
};

export type EvidenceGroupEvidencesArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Evidence_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Evidence_Filter>;
};

export type EvidenceGroup_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<EvidenceGroup_Filter>>>;
  evidences_?: InputMaybe<Evidence_Filter>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  numberOfEvidence?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfEvidence_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfEvidence_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfEvidence_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfEvidence_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfEvidence_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfEvidence_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfEvidence_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<EvidenceGroup_Filter>>>;
};

export enum EvidenceGroup_OrderBy {
  Evidences = "evidences",
  Id = "id",
  NumberOfEvidence = "numberOfEvidence",
}

export type EvidenceMetadata = {
  __typename?: "EvidenceMetadata";
  /** Description of the evidence */
  description?: Maybe<Scalars["String"]["output"]>;
  /** File extension of the attached file */
  fileTypeExtension?: Maybe<Scalars["String"]["output"]>;
  /** URI of the attached file */
  fileURI?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  /** Name of the evidence */
  name?: Maybe<Scalars["String"]["output"]>;
  /** Title of the evidence */
  title?: Maybe<Scalars["String"]["output"]>;
};

export type EvidenceMetadata_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<EvidenceMetadata_Filter>>>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  description_contains?: InputMaybe<Scalars["String"]["input"]>;
  description_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  description_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_gt?: InputMaybe<Scalars["String"]["input"]>;
  description_gte?: InputMaybe<Scalars["String"]["input"]>;
  description_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  description_lt?: InputMaybe<Scalars["String"]["input"]>;
  description_lte?: InputMaybe<Scalars["String"]["input"]>;
  description_not?: InputMaybe<Scalars["String"]["input"]>;
  description_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  description_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  description_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  description_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  description_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  description_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_contains?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_gt?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_gte?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  fileTypeExtension_lt?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_lte?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  fileTypeExtension_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  fileTypeExtension_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileURI?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_contains?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_gt?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_gte?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  fileURI_lt?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_lte?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  fileURI_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  fileURI_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
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
  or?: InputMaybe<Array<InputMaybe<EvidenceMetadata_Filter>>>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  title_contains?: InputMaybe<Scalars["String"]["input"]>;
  title_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  title_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_gt?: InputMaybe<Scalars["String"]["input"]>;
  title_gte?: InputMaybe<Scalars["String"]["input"]>;
  title_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  title_lt?: InputMaybe<Scalars["String"]["input"]>;
  title_lte?: InputMaybe<Scalars["String"]["input"]>;
  title_not?: InputMaybe<Scalars["String"]["input"]>;
  title_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  title_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  title_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  title_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  title_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  title_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum EvidenceMetadata_OrderBy {
  Description = "description",
  FileTypeExtension = "fileTypeExtension",
  FileUri = "fileURI",
  Id = "id",
  Name = "name",
  Title = "title",
}

export type Evidence_Filter = {
  URI?: InputMaybe<Scalars["String"]["input"]>;
  URI_contains?: InputMaybe<Scalars["String"]["input"]>;
  URI_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_gt?: InputMaybe<Scalars["String"]["input"]>;
  URI_gte?: InputMaybe<Scalars["String"]["input"]>;
  URI_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  URI_lt?: InputMaybe<Scalars["String"]["input"]>;
  URI_lte?: InputMaybe<Scalars["String"]["input"]>;
  URI_not?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  URI_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Evidence_Filter>>>;
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
  evidenceGroup?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_?: InputMaybe<EvidenceGroup_Filter>;
  evidenceGroup_contains?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_gt?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_gte?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  evidenceGroup_lt?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_lte?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  evidenceGroup_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  metadata_?: InputMaybe<EvidenceMetadata_Filter>;
  metadata_contains?: InputMaybe<Scalars["String"]["input"]>;
  metadata_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_gt?: InputMaybe<Scalars["String"]["input"]>;
  metadata_gte?: InputMaybe<Scalars["String"]["input"]>;
  metadata_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metadata_lt?: InputMaybe<Scalars["String"]["input"]>;
  metadata_lte?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metadata_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  number?: InputMaybe<Scalars["BigInt"]["input"]>;
  number_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  number_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  number_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  number_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  number_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  number_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  number_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Evidence_Filter>>>;
  party?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  party_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  party_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  txHash?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHash_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHash_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Evidence_OrderBy {
  Uri = "URI",
  Arbitrator = "arbitrator",
  EvidenceGroup = "evidenceGroup",
  EvidenceGroupId = "evidenceGroup__id",
  EvidenceGroupNumberOfEvidence = "evidenceGroup__numberOfEvidence",
  Id = "id",
  Metadata = "metadata",
  MetadataDescription = "metadata__description",
  MetadataFileTypeExtension = "metadata__fileTypeExtension",
  MetadataFileUri = "metadata__fileURI",
  MetadataId = "metadata__id",
  MetadataName = "metadata__name",
  MetadataTitle = "metadata__title",
  Number = "number",
  Party = "party",
  Timestamp = "timestamp",
  TxHash = "txHash",
}

export type HasPaidAppealFee = {
  __typename?: "HasPaidAppealFee";
  /** <itemID>-<requestID>-<roundID>-<side> */
  id: Scalars["ID"]["output"];
  item: Item;
  request: Request;
  round: Round;
  /** Side the fund is in favor of */
  side: Scalars["BigInt"]["output"];
  /** Timestamp of the event */
  timestamp: Scalars["BigInt"]["output"];
};

export type HasPaidAppealFee_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<HasPaidAppealFee_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  item?: InputMaybe<Scalars["String"]["input"]>;
  item_?: InputMaybe<Item_Filter>;
  item_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_gt?: InputMaybe<Scalars["String"]["input"]>;
  item_gte?: InputMaybe<Scalars["String"]["input"]>;
  item_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_lt?: InputMaybe<Scalars["String"]["input"]>;
  item_lte?: InputMaybe<Scalars["String"]["input"]>;
  item_not?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<HasPaidAppealFee_Filter>>>;
  request?: InputMaybe<Scalars["String"]["input"]>;
  request_?: InputMaybe<Request_Filter>;
  request_contains?: InputMaybe<Scalars["String"]["input"]>;
  request_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  request_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_gt?: InputMaybe<Scalars["String"]["input"]>;
  request_gte?: InputMaybe<Scalars["String"]["input"]>;
  request_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  request_lt?: InputMaybe<Scalars["String"]["input"]>;
  request_lte?: InputMaybe<Scalars["String"]["input"]>;
  request_not?: InputMaybe<Scalars["String"]["input"]>;
  request_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  request_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  request_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  request_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  request_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  request_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round?: InputMaybe<Scalars["String"]["input"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]["input"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_gt?: InputMaybe<Scalars["String"]["input"]>;
  round_gte?: InputMaybe<Scalars["String"]["input"]>;
  round_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  round_lt?: InputMaybe<Scalars["String"]["input"]>;
  round_lte?: InputMaybe<Scalars["String"]["input"]>;
  round_not?: InputMaybe<Scalars["String"]["input"]>;
  round_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  side_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  timestamp_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
};

export enum HasPaidAppealFee_OrderBy {
  Id = "id",
  Item = "item",
  ItemData = "item__data",
  ItemDisputed = "item__disputed",
  ItemId = "item__id",
  ItemItemId = "item__itemID",
  ItemLatestChallenger = "item__latestChallenger",
  ItemLatestRequestResolutionTime = "item__latestRequestResolutionTime",
  ItemLatestRequestSubmissionTime = "item__latestRequestSubmissionTime",
  ItemLatestRequester = "item__latestRequester",
  ItemNumberOfRequests = "item__numberOfRequests",
  ItemRegistryAddress = "item__registryAddress",
  ItemStatus = "item__status",
  Request = "request",
  RequestArbitrator = "request__arbitrator",
  RequestArbitratorExtraData = "request__arbitratorExtraData",
  RequestChallenger = "request__challenger",
  RequestCreationTx = "request__creationTx",
  RequestDeposit = "request__deposit",
  RequestDisputeId = "request__disputeID",
  RequestDisputeOutcome = "request__disputeOutcome",
  RequestDisputed = "request__disputed",
  RequestFinalRuling = "request__finalRuling",
  RequestId = "request__id",
  RequestNumberOfRounds = "request__numberOfRounds",
  RequestRegistryAddress = "request__registryAddress",
  RequestRequestType = "request__requestType",
  RequestRequester = "request__requester",
  RequestResolutionTime = "request__resolutionTime",
  RequestResolutionTx = "request__resolutionTx",
  RequestResolved = "request__resolved",
  RequestSubmissionTime = "request__submissionTime",
  Round = "round",
  RoundAmountPaidChallenger = "round__amountPaidChallenger",
  RoundAmountPaidRequester = "round__amountPaidRequester",
  RoundAppealPeriodEnd = "round__appealPeriodEnd",
  RoundAppealPeriodStart = "round__appealPeriodStart",
  RoundAppealed = "round__appealed",
  RoundAppealedAt = "round__appealedAt",
  RoundCreationTime = "round__creationTime",
  RoundFeeRewards = "round__feeRewards",
  RoundHasPaidChallenger = "round__hasPaidChallenger",
  RoundHasPaidRequester = "round__hasPaidRequester",
  RoundId = "round__id",
  RoundRuling = "round__ruling",
  RoundRulingTime = "round__rulingTime",
  RoundTxHashAppealDecision = "round__txHashAppealDecision",
  RoundTxHashAppealPossible = "round__txHashAppealPossible",
  Side = "side",
  Timestamp = "timestamp",
}

export type Item = {
  __typename?: "Item";
  /** The data describing the item. */
  data: Scalars["Bytes"]["output"];
  /** Whether the item is currently disputed. */
  disputed: Scalars["Boolean"]["output"];
  /** The id of the item in the subgraph entity. Format: <itemID>@<listaddress_lowercase> */
  id: Scalars["ID"]["output"];
  /** The ID of the item in the registry. Also the keccak256 hash of the data. */
  itemID: Scalars["Bytes"]["output"];
  /** The account that challenged the latest request, if any. */
  latestChallenger: Scalars["Bytes"]["output"];
  /** The time the latest request was resolved. */
  latestRequestResolutionTime: Scalars["BigInt"]["output"];
  /** Time when the latest request was made. */
  latestRequestSubmissionTime: Scalars["BigInt"]["output"];
  /** The account that made the latest request to the item. */
  latestRequester: Scalars["Bytes"]["output"];
  /** The total number of requests for this item. */
  numberOfRequests: Scalars["BigInt"]["output"];
  /** The registry where this item was submitted. */
  registry: Registry;
  /** The address of the registry this item was submitted. Redundant with registry field to allow use in conditionals. */
  registryAddress: Scalars["Bytes"]["output"];
  /** List of status change requests made for the item in the form requests[requestID]. */
  requests: Array<Request>;
  /** The current status of the item. */
  status: Status;
};

export type ItemRequestsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Request_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Request_Filter>;
};

export type ItemProp = {
  __typename?: "ItemProp";
  description: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  isIdentifier: Scalars["Boolean"]["output"];
  item: LItemMetadata;
  label: Scalars["String"]["output"];
  type: Scalars["String"]["output"];
  value?: Maybe<Scalars["String"]["output"]>;
};

export type ItemProp_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ItemProp_Filter>>>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  description_contains?: InputMaybe<Scalars["String"]["input"]>;
  description_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  description_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_gt?: InputMaybe<Scalars["String"]["input"]>;
  description_gte?: InputMaybe<Scalars["String"]["input"]>;
  description_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  description_lt?: InputMaybe<Scalars["String"]["input"]>;
  description_lte?: InputMaybe<Scalars["String"]["input"]>;
  description_not?: InputMaybe<Scalars["String"]["input"]>;
  description_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  description_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  description_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  description_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  description_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  description_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  isIdentifier?: InputMaybe<Scalars["Boolean"]["input"]>;
  isIdentifier_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isIdentifier_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  isIdentifier_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  item?: InputMaybe<Scalars["String"]["input"]>;
  item_?: InputMaybe<LItemMetadata_Filter>;
  item_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_gt?: InputMaybe<Scalars["String"]["input"]>;
  item_gte?: InputMaybe<Scalars["String"]["input"]>;
  item_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_lt?: InputMaybe<Scalars["String"]["input"]>;
  item_lte?: InputMaybe<Scalars["String"]["input"]>;
  item_not?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  label?: InputMaybe<Scalars["String"]["input"]>;
  label_contains?: InputMaybe<Scalars["String"]["input"]>;
  label_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  label_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  label_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  label_gt?: InputMaybe<Scalars["String"]["input"]>;
  label_gte?: InputMaybe<Scalars["String"]["input"]>;
  label_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  label_lt?: InputMaybe<Scalars["String"]["input"]>;
  label_lte?: InputMaybe<Scalars["String"]["input"]>;
  label_not?: InputMaybe<Scalars["String"]["input"]>;
  label_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  label_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  label_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  label_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  label_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  label_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  label_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  label_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  label_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<ItemProp_Filter>>>;
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
  value?: InputMaybe<Scalars["String"]["input"]>;
  value_contains?: InputMaybe<Scalars["String"]["input"]>;
  value_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  value_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  value_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  value_gt?: InputMaybe<Scalars["String"]["input"]>;
  value_gte?: InputMaybe<Scalars["String"]["input"]>;
  value_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  value_lt?: InputMaybe<Scalars["String"]["input"]>;
  value_lte?: InputMaybe<Scalars["String"]["input"]>;
  value_not?: InputMaybe<Scalars["String"]["input"]>;
  value_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  value_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  value_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  value_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  value_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  value_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  value_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  value_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  value_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum ItemProp_OrderBy {
  Description = "description",
  Id = "id",
  IsIdentifier = "isIdentifier",
  Item = "item",
  ItemId = "item__id",
  ItemKey0 = "item__key0",
  ItemKey1 = "item__key1",
  ItemKey2 = "item__key2",
  ItemKey3 = "item__key3",
  ItemKey4 = "item__key4",
  ItemKeywords = "item__keywords",
  Label = "label",
  Type = "type",
  Value = "value",
}

export type Item_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Item_Filter>>>;
  data?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  data_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  data_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  disputed?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  disputed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  itemID?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  itemID_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestChallenger?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestChallenger_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestRequestResolutionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequestResolutionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequestSubmissionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequestSubmissionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequester?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestRequester_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  numberOfRequests?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRequests_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Item_Filter>>>;
  registry?: InputMaybe<Scalars["String"]["input"]>;
  registryAddress?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registryAddress_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registry_?: InputMaybe<Registry_Filter>;
  registry_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_gt?: InputMaybe<Scalars["String"]["input"]>;
  registry_gte?: InputMaybe<Scalars["String"]["input"]>;
  registry_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_lt?: InputMaybe<Scalars["String"]["input"]>;
  registry_lte?: InputMaybe<Scalars["String"]["input"]>;
  registry_not?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  requests_?: InputMaybe<Request_Filter>;
  status?: InputMaybe<Status>;
  status_in?: InputMaybe<Array<Status>>;
  status_not?: InputMaybe<Status>;
  status_not_in?: InputMaybe<Array<Status>>;
};

export enum Item_OrderBy {
  Data = "data",
  Disputed = "disputed",
  Id = "id",
  ItemId = "itemID",
  LatestChallenger = "latestChallenger",
  LatestRequestResolutionTime = "latestRequestResolutionTime",
  LatestRequestSubmissionTime = "latestRequestSubmissionTime",
  LatestRequester = "latestRequester",
  NumberOfRequests = "numberOfRequests",
  Registry = "registry",
  RegistryAddress = "registryAddress",
  RegistryConnectedTcr = "registry__connectedTCR",
  RegistryId = "registry__id",
  RegistryMetaEvidenceCount = "registry__metaEvidenceCount",
  RegistryNumberOfItems = "registry__numberOfItems",
  Requests = "requests",
  Status = "status",
}

export type LArbitrator = {
  __typename?: "LArbitrator";
  /** The address of the arbitrator */
  id: Scalars["ID"]["output"];
};

export type LArbitrator_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LArbitrator_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<LArbitrator_Filter>>>;
};

export enum LArbitrator_OrderBy {
  Id = "id",
}

export type LContribution = {
  __typename?: "LContribution";
  /** The address that made the contribution. */
  contributor: Scalars["Bytes"]["output"];
  /** The contribution ID. */
  id: Scalars["ID"]["output"];
  /** The round the contribution was made to. */
  round: LRound;
  /** To which side the contribution was made. */
  side: Scalars["BigInt"]["output"];
  /** Whether there are any withdrawable contributions. */
  withdrawable: Scalars["Boolean"]["output"];
};

export type LContribution_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LContribution_Filter>>>;
  contributor?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  contributor_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  contributor_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<LContribution_Filter>>>;
  round?: InputMaybe<Scalars["String"]["input"]>;
  round_?: InputMaybe<LRound_Filter>;
  round_contains?: InputMaybe<Scalars["String"]["input"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_gt?: InputMaybe<Scalars["String"]["input"]>;
  round_gte?: InputMaybe<Scalars["String"]["input"]>;
  round_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  round_lt?: InputMaybe<Scalars["String"]["input"]>;
  round_lte?: InputMaybe<Scalars["String"]["input"]>;
  round_not?: InputMaybe<Scalars["String"]["input"]>;
  round_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  round_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  side?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  side_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  side_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  withdrawable?: InputMaybe<Scalars["Boolean"]["input"]>;
  withdrawable_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  withdrawable_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  withdrawable_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
};

export enum LContribution_OrderBy {
  Contributor = "contributor",
  Id = "id",
  Round = "round",
  RoundAmountPaidChallenger = "round__amountPaidChallenger",
  RoundAmountPaidRequester = "round__amountPaidRequester",
  RoundAppealPeriodEnd = "round__appealPeriodEnd",
  RoundAppealPeriodStart = "round__appealPeriodStart",
  RoundAppealed = "round__appealed",
  RoundAppealedAt = "round__appealedAt",
  RoundCreationTime = "round__creationTime",
  RoundFeeRewards = "round__feeRewards",
  RoundHasPaidChallenger = "round__hasPaidChallenger",
  RoundHasPaidRequester = "round__hasPaidRequester",
  RoundId = "round__id",
  RoundLastFundedChallenger = "round__lastFundedChallenger",
  RoundLastFundedRequester = "round__lastFundedRequester",
  RoundNumberOfContributions = "round__numberOfContributions",
  RoundRuling = "round__ruling",
  RoundRulingTime = "round__rulingTime",
  RoundTxHashAppealDecision = "round__txHashAppealDecision",
  RoundTxHashAppealPossible = "round__txHashAppealPossible",
  Side = "side",
  Withdrawable = "withdrawable",
}

export type LItem = {
  __typename?: "LItem";
  /** The data describing the item. */
  data: Scalars["String"]["output"];
  /** Whether the item is currently disputed. */
  disputed: Scalars["Boolean"]["output"];
  /** The id of the item in the subgraph entity. Format: <itemID>@<listaddress_lowercase> */
  id: Scalars["ID"]["output"];
  /** The ID of the item in the registry. Also the keccak256 hash of the data. */
  itemID: Scalars["Bytes"]["output"];
  /** The account that challenged the latest request, if any. */
  latestChallenger: Scalars["Bytes"]["output"];
  /** The time the latest request was resolved. */
  latestRequestResolutionTime: Scalars["BigInt"]["output"];
  /** Time when the latest request was made. */
  latestRequestSubmissionTime: Scalars["BigInt"]["output"];
  /** The account that made the latest request to the item. */
  latestRequester: Scalars["Bytes"]["output"];
  metadata?: Maybe<LItemMetadata>;
  /** The total number of requests for this item. */
  numberOfRequests: Scalars["BigInt"]["output"];
  /** The registry where this item was submitted. */
  registry: LRegistry;
  /** The address of the registry this item was submitted. Redundant with registry field to allow use in conditionals. */
  registryAddress: Scalars["Bytes"]["output"];
  /** List of status change requests made for the item in the form requests[requestID]. */
  requests: Array<LRequest>;
  /** The current status of the item. */
  status: Status;
};

export type LItemRequestsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRequest_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<LRequest_Filter>;
};

export type LItemMetadata = {
  __typename?: "LItemMetadata";
  /** ipfs cid - Litem ID */
  id: Scalars["ID"]["output"];
  /** The item this metadata belongs to */
  item: LItem;
  /** First indexable value of the json file. */
  key0?: Maybe<Scalars["String"]["output"]>;
  /** Second indexable value of the json file. */
  key1?: Maybe<Scalars["String"]["output"]>;
  /** Third indexable value of the json file. */
  key2?: Maybe<Scalars["String"]["output"]>;
  /** Fourth indexable value of the json file. */
  key3?: Maybe<Scalars["String"]["output"]>;
  /** Fifth indexable value of the json file. */
  key4?: Maybe<Scalars["String"]["output"]>;
  /** The item identifiers combined as a single string. */
  keywords?: Maybe<Scalars["String"]["output"]>;
  /** The parsed data describing the item. */
  props: Array<ItemProp>;
};

export type LItemMetadataPropsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ItemProp_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<ItemProp_Filter>;
};

export type LItemMetadata_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LItemMetadata_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  item_?: InputMaybe<LItem_Filter>;
  key0?: InputMaybe<Scalars["String"]["input"]>;
  key0_contains?: InputMaybe<Scalars["String"]["input"]>;
  key0_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key0_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key0_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key0_gt?: InputMaybe<Scalars["String"]["input"]>;
  key0_gte?: InputMaybe<Scalars["String"]["input"]>;
  key0_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key0_lt?: InputMaybe<Scalars["String"]["input"]>;
  key0_lte?: InputMaybe<Scalars["String"]["input"]>;
  key0_not?: InputMaybe<Scalars["String"]["input"]>;
  key0_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  key0_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key0_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key0_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key0_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key0_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key0_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key0_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key0_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key1?: InputMaybe<Scalars["String"]["input"]>;
  key1_contains?: InputMaybe<Scalars["String"]["input"]>;
  key1_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key1_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key1_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key1_gt?: InputMaybe<Scalars["String"]["input"]>;
  key1_gte?: InputMaybe<Scalars["String"]["input"]>;
  key1_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key1_lt?: InputMaybe<Scalars["String"]["input"]>;
  key1_lte?: InputMaybe<Scalars["String"]["input"]>;
  key1_not?: InputMaybe<Scalars["String"]["input"]>;
  key1_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  key1_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key1_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key1_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key1_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key1_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key1_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key1_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key1_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key2?: InputMaybe<Scalars["String"]["input"]>;
  key2_contains?: InputMaybe<Scalars["String"]["input"]>;
  key2_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key2_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key2_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key2_gt?: InputMaybe<Scalars["String"]["input"]>;
  key2_gte?: InputMaybe<Scalars["String"]["input"]>;
  key2_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key2_lt?: InputMaybe<Scalars["String"]["input"]>;
  key2_lte?: InputMaybe<Scalars["String"]["input"]>;
  key2_not?: InputMaybe<Scalars["String"]["input"]>;
  key2_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  key2_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key2_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key2_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key2_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key2_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key2_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key2_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key2_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key3?: InputMaybe<Scalars["String"]["input"]>;
  key3_contains?: InputMaybe<Scalars["String"]["input"]>;
  key3_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key3_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key3_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key3_gt?: InputMaybe<Scalars["String"]["input"]>;
  key3_gte?: InputMaybe<Scalars["String"]["input"]>;
  key3_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key3_lt?: InputMaybe<Scalars["String"]["input"]>;
  key3_lte?: InputMaybe<Scalars["String"]["input"]>;
  key3_not?: InputMaybe<Scalars["String"]["input"]>;
  key3_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  key3_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key3_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key3_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key3_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key3_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key3_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key3_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key3_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key4?: InputMaybe<Scalars["String"]["input"]>;
  key4_contains?: InputMaybe<Scalars["String"]["input"]>;
  key4_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key4_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key4_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key4_gt?: InputMaybe<Scalars["String"]["input"]>;
  key4_gte?: InputMaybe<Scalars["String"]["input"]>;
  key4_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key4_lt?: InputMaybe<Scalars["String"]["input"]>;
  key4_lte?: InputMaybe<Scalars["String"]["input"]>;
  key4_not?: InputMaybe<Scalars["String"]["input"]>;
  key4_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  key4_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key4_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  key4_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key4_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  key4_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key4_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  key4_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  key4_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  keywords?: InputMaybe<Scalars["String"]["input"]>;
  keywords_contains?: InputMaybe<Scalars["String"]["input"]>;
  keywords_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  keywords_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  keywords_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  keywords_gt?: InputMaybe<Scalars["String"]["input"]>;
  keywords_gte?: InputMaybe<Scalars["String"]["input"]>;
  keywords_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  keywords_lt?: InputMaybe<Scalars["String"]["input"]>;
  keywords_lte?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  keywords_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  keywords_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  keywords_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  keywords_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<LItemMetadata_Filter>>>;
  props_?: InputMaybe<ItemProp_Filter>;
};

export enum LItemMetadata_OrderBy {
  Id = "id",
  Item = "item",
  ItemData = "item__data",
  ItemDisputed = "item__disputed",
  ItemId = "item__id",
  ItemItemId = "item__itemID",
  ItemLatestChallenger = "item__latestChallenger",
  ItemLatestRequestResolutionTime = "item__latestRequestResolutionTime",
  ItemLatestRequestSubmissionTime = "item__latestRequestSubmissionTime",
  ItemLatestRequester = "item__latestRequester",
  ItemNumberOfRequests = "item__numberOfRequests",
  ItemRegistryAddress = "item__registryAddress",
  ItemStatus = "item__status",
  Key0 = "key0",
  Key1 = "key1",
  Key2 = "key2",
  Key3 = "key3",
  Key4 = "key4",
  Keywords = "keywords",
  Props = "props",
}

export type LItem_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LItem_Filter>>>;
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
  disputed?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  disputed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  itemID?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  itemID_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  itemID_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestChallenger?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestChallenger_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestChallenger_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestRequestResolutionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequestResolutionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestResolutionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequestSubmissionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequestSubmissionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  latestRequestSubmissionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  latestRequester?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  latestRequester_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  latestRequester_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  metadata_?: InputMaybe<LItemMetadata_Filter>;
  metadata_contains?: InputMaybe<Scalars["String"]["input"]>;
  metadata_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_gt?: InputMaybe<Scalars["String"]["input"]>;
  metadata_gte?: InputMaybe<Scalars["String"]["input"]>;
  metadata_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metadata_lt?: InputMaybe<Scalars["String"]["input"]>;
  metadata_lte?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metadata_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  numberOfRequests?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRequests_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRequests_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<LItem_Filter>>>;
  registry?: InputMaybe<Scalars["String"]["input"]>;
  registryAddress?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registryAddress_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registry_?: InputMaybe<LRegistry_Filter>;
  registry_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_gt?: InputMaybe<Scalars["String"]["input"]>;
  registry_gte?: InputMaybe<Scalars["String"]["input"]>;
  registry_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_lt?: InputMaybe<Scalars["String"]["input"]>;
  registry_lte?: InputMaybe<Scalars["String"]["input"]>;
  registry_not?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  requests_?: InputMaybe<LRequest_Filter>;
  status?: InputMaybe<Status>;
  status_in?: InputMaybe<Array<Status>>;
  status_not?: InputMaybe<Status>;
  status_not_in?: InputMaybe<Array<Status>>;
};

export enum LItem_OrderBy {
  Data = "data",
  Disputed = "disputed",
  Id = "id",
  ItemId = "itemID",
  LatestChallenger = "latestChallenger",
  LatestRequestResolutionTime = "latestRequestResolutionTime",
  LatestRequestSubmissionTime = "latestRequestSubmissionTime",
  LatestRequester = "latestRequester",
  Metadata = "metadata",
  MetadataId = "metadata__id",
  MetadataKey0 = "metadata__key0",
  MetadataKey1 = "metadata__key1",
  MetadataKey2 = "metadata__key2",
  MetadataKey3 = "metadata__key3",
  MetadataKey4 = "metadata__key4",
  MetadataKeywords = "metadata__keywords",
  NumberOfRequests = "numberOfRequests",
  Registry = "registry",
  RegistryAddress = "registryAddress",
  RegistryConnectedTcr = "registry__connectedTCR",
  RegistryId = "registry__id",
  RegistryMetaEvidenceCount = "registry__metaEvidenceCount",
  RegistryNumberOfAbsent = "registry__numberOfAbsent",
  RegistryNumberOfChallengedClearing = "registry__numberOfChallengedClearing",
  RegistryNumberOfChallengedRegistrations = "registry__numberOfChallengedRegistrations",
  RegistryNumberOfClearingRequested = "registry__numberOfClearingRequested",
  RegistryNumberOfRegistered = "registry__numberOfRegistered",
  RegistryNumberOfRegistrationRequested = "registry__numberOfRegistrationRequested",
  Requests = "requests",
  Status = "status",
}

export type LRegistry = {
  __typename?: "LRegistry";
  /** The current removal meta evidence */
  clearingMetaEvidence: MetaEvidence;
  /** Connected TCR. Can be the 0 address. In practice, will never be null. */
  connectedTCR?: Maybe<Scalars["Bytes"]["output"]>;
  /** The registry address */
  id: Scalars["ID"]["output"];
  /** The items submitted to this list */
  items: Array<LItem>;
  /** The number of MetaEvidence event logs emitted. */
  metaEvidenceCount: Scalars["BigInt"]["output"];
  metadata?: Maybe<LRegistryMetadata>;
  /** The total number of items in absent state. */
  numberOfAbsent: Scalars["BigInt"]["output"];
  /** The total number of items in the challenged removal state. */
  numberOfChallengedClearing: Scalars["BigInt"]["output"];
  /** The total number of items in the challenged registration state. */
  numberOfChallengedRegistrations: Scalars["BigInt"]["output"];
  numberOfClearingRequested: Scalars["BigInt"]["output"];
  /** The total number of items in registered state. */
  numberOfRegistered: Scalars["BigInt"]["output"];
  /** The total number of items in the registration requested state. */
  numberOfRegistrationRequested: Scalars["BigInt"]["output"];
  /** The current registration meta evidence */
  registrationMetaEvidence: MetaEvidence;
  /** The requests submitted to this list */
  requests: Array<LRequest>;
};

export type LRegistryItemsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LItem_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<LItem_Filter>;
};

export type LRegistryRequestsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRequest_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<LRequest_Filter>;
};

export type LRegistryMetadata = {
  __typename?: "LRegistryMetadata";
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isConnectedTCR?: Maybe<Scalars["Boolean"]["output"]>;
  isTCRofTcrs?: Maybe<Scalars["Boolean"]["output"]>;
  itemName?: Maybe<Scalars["String"]["output"]>;
  itemNamePlural?: Maybe<Scalars["String"]["output"]>;
  parentTCRAddress?: Maybe<Scalars["String"]["output"]>;
  registry?: Maybe<LRegistry>;
  relTcrDisabled?: Maybe<Scalars["Boolean"]["output"]>;
  requireRemovalEvidence?: Maybe<Scalars["Boolean"]["output"]>;
  title?: Maybe<Scalars["String"]["output"]>;
};

export type LRegistryMetadata_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LRegistryMetadata_Filter>>>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  description_contains?: InputMaybe<Scalars["String"]["input"]>;
  description_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  description_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_gt?: InputMaybe<Scalars["String"]["input"]>;
  description_gte?: InputMaybe<Scalars["String"]["input"]>;
  description_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  description_lt?: InputMaybe<Scalars["String"]["input"]>;
  description_lte?: InputMaybe<Scalars["String"]["input"]>;
  description_not?: InputMaybe<Scalars["String"]["input"]>;
  description_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  description_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  description_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  description_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  description_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  description_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  description_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  isConnectedTCR?: InputMaybe<Scalars["Boolean"]["input"]>;
  isConnectedTCR_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isConnectedTCR_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  isConnectedTCR_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isTCRofTcrs?: InputMaybe<Scalars["Boolean"]["input"]>;
  isTCRofTcrs_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  isTCRofTcrs_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  isTCRofTcrs_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  itemName?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_contains?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_gt?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_gte?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  itemNamePlural_lt?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_lte?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  itemNamePlural_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  itemNamePlural_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemName_contains?: InputMaybe<Scalars["String"]["input"]>;
  itemName_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemName_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  itemName_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemName_gt?: InputMaybe<Scalars["String"]["input"]>;
  itemName_gte?: InputMaybe<Scalars["String"]["input"]>;
  itemName_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  itemName_lt?: InputMaybe<Scalars["String"]["input"]>;
  itemName_lte?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  itemName_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  itemName_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  itemName_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  itemName_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  or?: InputMaybe<Array<InputMaybe<LRegistryMetadata_Filter>>>;
  parentTCRAddress?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_contains?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_gt?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_gte?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  parentTCRAddress_lt?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_lte?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  parentTCRAddress_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  parentTCRAddress_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_?: InputMaybe<LRegistry_Filter>;
  relTcrDisabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  relTcrDisabled_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  relTcrDisabled_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  relTcrDisabled_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  requireRemovalEvidence?: InputMaybe<Scalars["Boolean"]["input"]>;
  requireRemovalEvidence_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  requireRemovalEvidence_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  requireRemovalEvidence_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  title?: InputMaybe<Scalars["String"]["input"]>;
  title_contains?: InputMaybe<Scalars["String"]["input"]>;
  title_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  title_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_gt?: InputMaybe<Scalars["String"]["input"]>;
  title_gte?: InputMaybe<Scalars["String"]["input"]>;
  title_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  title_lt?: InputMaybe<Scalars["String"]["input"]>;
  title_lte?: InputMaybe<Scalars["String"]["input"]>;
  title_not?: InputMaybe<Scalars["String"]["input"]>;
  title_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  title_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  title_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  title_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  title_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  title_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  title_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
};

export enum LRegistryMetadata_OrderBy {
  Description = "description",
  Id = "id",
  IsConnectedTcr = "isConnectedTCR",
  IsTcRofTcrs = "isTCRofTcrs",
  ItemName = "itemName",
  ItemNamePlural = "itemNamePlural",
  ParentTcrAddress = "parentTCRAddress",
  Registry = "registry",
  RegistryConnectedTcr = "registry__connectedTCR",
  RegistryId = "registry__id",
  RegistryMetaEvidenceCount = "registry__metaEvidenceCount",
  RegistryNumberOfAbsent = "registry__numberOfAbsent",
  RegistryNumberOfChallengedClearing = "registry__numberOfChallengedClearing",
  RegistryNumberOfChallengedRegistrations = "registry__numberOfChallengedRegistrations",
  RegistryNumberOfClearingRequested = "registry__numberOfClearingRequested",
  RegistryNumberOfRegistered = "registry__numberOfRegistered",
  RegistryNumberOfRegistrationRequested = "registry__numberOfRegistrationRequested",
  RelTcrDisabled = "relTcrDisabled",
  RequireRemovalEvidence = "requireRemovalEvidence",
  Title = "title",
}

export type LRegistry_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LRegistry_Filter>>>;
  clearingMetaEvidence?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_?: InputMaybe<MetaEvidence_Filter>;
  clearingMetaEvidence_contains?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_gt?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_gte?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  clearingMetaEvidence_lt?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_lte?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  clearingMetaEvidence_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  connectedTCR?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  connectedTCR_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  items_?: InputMaybe<LItem_Filter>;
  metaEvidenceCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  metaEvidenceCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  metadata_?: InputMaybe<LRegistryMetadata_Filter>;
  metadata_contains?: InputMaybe<Scalars["String"]["input"]>;
  metadata_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_gt?: InputMaybe<Scalars["String"]["input"]>;
  metadata_gte?: InputMaybe<Scalars["String"]["input"]>;
  metadata_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metadata_lt?: InputMaybe<Scalars["String"]["input"]>;
  metadata_lte?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metadata_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metadata_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metadata_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  numberOfAbsent?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfAbsent_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfAbsent_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfAbsent_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfAbsent_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfAbsent_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfAbsent_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfAbsent_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfChallengedClearing?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedClearing_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedClearing_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedClearing_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfChallengedClearing_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedClearing_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedClearing_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedClearing_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfChallengedRegistrations?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedRegistrations_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedRegistrations_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedRegistrations_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfChallengedRegistrations_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedRegistrations_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedRegistrations_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfChallengedRegistrations_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfClearingRequested?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfClearingRequested_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfClearingRequested_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfClearingRequested_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfClearingRequested_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfClearingRequested_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfClearingRequested_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfClearingRequested_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRegistered?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistered_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistered_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistered_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRegistered_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistered_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistered_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistered_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRegistrationRequested?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistrationRequested_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistrationRequested_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistrationRequested_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRegistrationRequested_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistrationRequested_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistrationRequested_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRegistrationRequested_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<LRegistry_Filter>>>;
  registrationMetaEvidence?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_?: InputMaybe<MetaEvidence_Filter>;
  registrationMetaEvidence_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_gt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_gte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidence_lt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_lte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidence_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  requests_?: InputMaybe<LRequest_Filter>;
};

export enum LRegistry_OrderBy {
  ClearingMetaEvidence = "clearingMetaEvidence",
  ClearingMetaEvidenceUri = "clearingMetaEvidence__URI",
  ClearingMetaEvidenceId = "clearingMetaEvidence__id",
  ConnectedTcr = "connectedTCR",
  Id = "id",
  Items = "items",
  MetaEvidenceCount = "metaEvidenceCount",
  Metadata = "metadata",
  MetadataDescription = "metadata__description",
  MetadataId = "metadata__id",
  MetadataIsConnectedTcr = "metadata__isConnectedTCR",
  MetadataIsTcRofTcrs = "metadata__isTCRofTcrs",
  MetadataItemName = "metadata__itemName",
  MetadataItemNamePlural = "metadata__itemNamePlural",
  MetadataParentTcrAddress = "metadata__parentTCRAddress",
  MetadataRelTcrDisabled = "metadata__relTcrDisabled",
  MetadataRequireRemovalEvidence = "metadata__requireRemovalEvidence",
  MetadataTitle = "metadata__title",
  NumberOfAbsent = "numberOfAbsent",
  NumberOfChallengedClearing = "numberOfChallengedClearing",
  NumberOfChallengedRegistrations = "numberOfChallengedRegistrations",
  NumberOfClearingRequested = "numberOfClearingRequested",
  NumberOfRegistered = "numberOfRegistered",
  NumberOfRegistrationRequested = "numberOfRegistrationRequested",
  RegistrationMetaEvidence = "registrationMetaEvidence",
  RegistrationMetaEvidenceUri = "registrationMetaEvidence__URI",
  RegistrationMetaEvidenceId = "registrationMetaEvidence__id",
  Requests = "requests",
}

export type LRequest = {
  __typename?: "LRequest";
  /** The arbitrator trusted to solve disputes for this request. */
  arbitrator: Scalars["Bytes"]["output"];
  /** The extra data for the trusted arbitrator of this request. */
  arbitratorExtraData: Scalars["Bytes"]["output"];
  /** The address of the party that challenged the request */
  challenger: Scalars["Bytes"]["output"];
  /** The hash of the transaction that created this request. */
  creationTx: Scalars["Bytes"]["output"];
  /** The deposit that would be awarded to the challenger if challenge is successful */
  deposit: Scalars["BigInt"]["output"];
  /** ID of the dispute, if any. */
  disputeID: Scalars["BigInt"]["output"];
  /** The outcome of the dispute, if any. Note that unsuccessful appeal fundings can invert the arbitrator ruling (so this may differ from the ruling given by the arbitrator). */
  disputeOutcome: Ruling;
  /** True if a dispute was raised. */
  disputed: Scalars["Boolean"]["output"];
  /** The evidence group for this request. */
  evidenceGroup: EvidenceGroup;
  /** Only set if the request was settled by a dispute. Used by the twitter bot */
  finalRuling?: Maybe<Scalars["BigInt"]["output"]>;
  /** The item ID (which is the keccak256 hash of its data). */
  id: Scalars["ID"]["output"];
  /** The item this request belongs to. */
  item: LItem;
  /** The URI to the meta evidence used for this request. */
  metaEvidence: MetaEvidence;
  /** The total number of rounds on this request. */
  numberOfRounds: Scalars["BigInt"]["output"];
  /** The registry where this request was submitted. */
  registry: LRegistry;
  /** The address of the registry this item was submitted. Redundant with registry field to allow use in conditionals. */
  registryAddress: Scalars["Bytes"]["output"];
  /** Whether it was requested to add or remove the item to/from the list. */
  requestType: Status;
  /** The address of the party that made a request */
  requester: Scalars["Bytes"]["output"];
  /** The time the request was resolved. */
  resolutionTime: Scalars["BigInt"]["output"];
  /** The hash of the transaction that solved this request. */
  resolutionTx?: Maybe<Scalars["Bytes"]["output"]>;
  /** True if the request was executed and/or any raised disputes were resolved. */
  resolved: Scalars["Boolean"]["output"];
  /** Tracks each round of a dispute in the form rounds[roundID]. */
  rounds: Array<LRound>;
  /** Time when the request was made. Used to track when the challenge period ends. */
  submissionTime: Scalars["BigInt"]["output"];
};

export type LRequestRoundsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRound_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<LRound_Filter>;
};

export type LRequest_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LRequest_Filter>>>;
  arbitrator?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitratorExtraData_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitrator_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitrator_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  challenger?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  challenger_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  creationTx?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  creationTx_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  deposit?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  deposit_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  disputeID?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  disputeID_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  disputeOutcome?: InputMaybe<Ruling>;
  disputeOutcome_in?: InputMaybe<Array<Ruling>>;
  disputeOutcome_not?: InputMaybe<Ruling>;
  disputeOutcome_not_in?: InputMaybe<Array<Ruling>>;
  disputed?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  disputed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  evidenceGroup?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_?: InputMaybe<EvidenceGroup_Filter>;
  evidenceGroup_contains?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_gt?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_gte?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  evidenceGroup_lt?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_lte?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  evidenceGroup_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  finalRuling?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  finalRuling_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  item?: InputMaybe<Scalars["String"]["input"]>;
  item_?: InputMaybe<LItem_Filter>;
  item_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_gt?: InputMaybe<Scalars["String"]["input"]>;
  item_gte?: InputMaybe<Scalars["String"]["input"]>;
  item_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_lt?: InputMaybe<Scalars["String"]["input"]>;
  item_lte?: InputMaybe<Scalars["String"]["input"]>;
  item_not?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_?: InputMaybe<MetaEvidence_Filter>;
  metaEvidence_contains?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_gt?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_gte?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metaEvidence_lt?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_lte?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metaEvidence_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  numberOfRounds?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRounds_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<LRequest_Filter>>>;
  registry?: InputMaybe<Scalars["String"]["input"]>;
  registryAddress?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registryAddress_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registry_?: InputMaybe<LRegistry_Filter>;
  registry_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_gt?: InputMaybe<Scalars["String"]["input"]>;
  registry_gte?: InputMaybe<Scalars["String"]["input"]>;
  registry_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_lt?: InputMaybe<Scalars["String"]["input"]>;
  registry_lte?: InputMaybe<Scalars["String"]["input"]>;
  registry_not?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  requestType?: InputMaybe<Status>;
  requestType_in?: InputMaybe<Array<Status>>;
  requestType_not?: InputMaybe<Status>;
  requestType_not_in?: InputMaybe<Array<Status>>;
  requester?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  requester_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  resolutionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  resolutionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  resolutionTx?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  resolutionTx_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  resolved?: InputMaybe<Scalars["Boolean"]["input"]>;
  resolved_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  resolved_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  resolved_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  rounds_?: InputMaybe<LRound_Filter>;
  submissionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  submissionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
};

export enum LRequest_OrderBy {
  Arbitrator = "arbitrator",
  ArbitratorExtraData = "arbitratorExtraData",
  Challenger = "challenger",
  CreationTx = "creationTx",
  Deposit = "deposit",
  DisputeId = "disputeID",
  DisputeOutcome = "disputeOutcome",
  Disputed = "disputed",
  EvidenceGroup = "evidenceGroup",
  EvidenceGroupId = "evidenceGroup__id",
  EvidenceGroupNumberOfEvidence = "evidenceGroup__numberOfEvidence",
  FinalRuling = "finalRuling",
  Id = "id",
  Item = "item",
  ItemData = "item__data",
  ItemDisputed = "item__disputed",
  ItemId = "item__id",
  ItemItemId = "item__itemID",
  ItemLatestChallenger = "item__latestChallenger",
  ItemLatestRequestResolutionTime = "item__latestRequestResolutionTime",
  ItemLatestRequestSubmissionTime = "item__latestRequestSubmissionTime",
  ItemLatestRequester = "item__latestRequester",
  ItemNumberOfRequests = "item__numberOfRequests",
  ItemRegistryAddress = "item__registryAddress",
  ItemStatus = "item__status",
  MetaEvidence = "metaEvidence",
  MetaEvidenceUri = "metaEvidence__URI",
  MetaEvidenceId = "metaEvidence__id",
  NumberOfRounds = "numberOfRounds",
  Registry = "registry",
  RegistryAddress = "registryAddress",
  RegistryConnectedTcr = "registry__connectedTCR",
  RegistryId = "registry__id",
  RegistryMetaEvidenceCount = "registry__metaEvidenceCount",
  RegistryNumberOfAbsent = "registry__numberOfAbsent",
  RegistryNumberOfChallengedClearing = "registry__numberOfChallengedClearing",
  RegistryNumberOfChallengedRegistrations = "registry__numberOfChallengedRegistrations",
  RegistryNumberOfClearingRequested = "registry__numberOfClearingRequested",
  RegistryNumberOfRegistered = "registry__numberOfRegistered",
  RegistryNumberOfRegistrationRequested = "registry__numberOfRegistrationRequested",
  RequestType = "requestType",
  Requester = "requester",
  ResolutionTime = "resolutionTime",
  ResolutionTx = "resolutionTx",
  Resolved = "resolved",
  Rounds = "rounds",
  SubmissionTime = "submissionTime",
}

export type LRound = {
  __typename?: "LRound";
  /** The total amount of appeal fees contributed to the challenger in this round. */
  amountPaidChallenger: Scalars["BigInt"]["output"];
  /** The total amount of appeal fees contributed to the requester in this round. */
  amountPaidRequester: Scalars["BigInt"]["output"];
  /** The time the appeal period ends, if in the appeal period. */
  appealPeriodEnd: Scalars["BigInt"]["output"];
  /** The time the appeal period starts, if in the appeal period. */
  appealPeriodStart: Scalars["BigInt"]["output"];
  /** Whether this round was appealed. */
  appealed: Scalars["Boolean"]["output"];
  /** When this round was appealed, if it was appealed */
  appealedAt?: Maybe<Scalars["BigInt"]["output"]>;
  /** The contributions made to this round. */
  contributions: Array<LContribution>;
  /** The moment the round was created. */
  creationTime: Scalars["BigInt"]["output"];
  /** Sum of reimbursable fees and stake rewards available to the parties that made contributions to the side that ultimately wins a dispute. */
  feeRewards: Scalars["BigInt"]["output"];
  /** Whether the challenger is fully funded. */
  hasPaidChallenger: Scalars["Boolean"]["output"];
  /** Whether the requester is fully funded. */
  hasPaidRequester: Scalars["Boolean"]["output"];
  id: Scalars["ID"]["output"];
  /** When was the last contribution for challenger (hack for curate bot) */
  lastFundedChallenger: Scalars["BigInt"]["output"];
  /** When was the last contribution for requester (hack for curate bot) */
  lastFundedRequester: Scalars["BigInt"]["output"];
  /** The number of contributions made to this round */
  numberOfContributions: Scalars["BigInt"]["output"];
  /** The request to which this round belongs. */
  request: LRequest;
  /** The ruling given by the arbitrator. */
  ruling: Ruling;
  /** The time the round received the ruling. */
  rulingTime: Scalars["BigInt"]["output"];
  /** The tx hash of the moment the round was appealed */
  txHashAppealDecision?: Maybe<Scalars["Bytes"]["output"]>;
  /** The tx hash of the moment appealing became possible */
  txHashAppealPossible?: Maybe<Scalars["Bytes"]["output"]>;
};

export type LRoundContributionsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LContribution_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<LContribution_Filter>;
};

export type LRound_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amountPaidChallenger?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amountPaidChallenger_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amountPaidRequester?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amountPaidRequester_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<LRound_Filter>>>;
  appealPeriodEnd?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealPeriodEnd_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealPeriodStart?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealPeriodStart_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealed?: InputMaybe<Scalars["Boolean"]["input"]>;
  appealedAt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealedAt_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  appealed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  appealed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  contributions_?: InputMaybe<LContribution_Filter>;
  creationTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  creationTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeRewards?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeRewards_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  hasPaidChallenger?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidChallenger_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasPaidChallenger_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidChallenger_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasPaidRequester?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidRequester_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasPaidRequester_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidRequester_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  lastFundedChallenger?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedChallenger_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedChallenger_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedChallenger_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lastFundedChallenger_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedChallenger_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedChallenger_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedChallenger_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lastFundedRequester?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedRequester_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedRequester_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedRequester_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  lastFundedRequester_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedRequester_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedRequester_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  lastFundedRequester_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfContributions?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfContributions_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfContributions_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfContributions_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfContributions_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfContributions_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfContributions_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfContributions_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<LRound_Filter>>>;
  request?: InputMaybe<Scalars["String"]["input"]>;
  request_?: InputMaybe<LRequest_Filter>;
  request_contains?: InputMaybe<Scalars["String"]["input"]>;
  request_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  request_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_gt?: InputMaybe<Scalars["String"]["input"]>;
  request_gte?: InputMaybe<Scalars["String"]["input"]>;
  request_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  request_lt?: InputMaybe<Scalars["String"]["input"]>;
  request_lte?: InputMaybe<Scalars["String"]["input"]>;
  request_not?: InputMaybe<Scalars["String"]["input"]>;
  request_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  request_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  request_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  request_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  request_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  request_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ruling?: InputMaybe<Ruling>;
  rulingTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  rulingTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  ruling_in?: InputMaybe<Array<Ruling>>;
  ruling_not?: InputMaybe<Ruling>;
  ruling_not_in?: InputMaybe<Array<Ruling>>;
  txHashAppealDecision?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHashAppealDecision_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHashAppealPossible?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHashAppealPossible_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum LRound_OrderBy {
  AmountPaidChallenger = "amountPaidChallenger",
  AmountPaidRequester = "amountPaidRequester",
  AppealPeriodEnd = "appealPeriodEnd",
  AppealPeriodStart = "appealPeriodStart",
  Appealed = "appealed",
  AppealedAt = "appealedAt",
  Contributions = "contributions",
  CreationTime = "creationTime",
  FeeRewards = "feeRewards",
  HasPaidChallenger = "hasPaidChallenger",
  HasPaidRequester = "hasPaidRequester",
  Id = "id",
  LastFundedChallenger = "lastFundedChallenger",
  LastFundedRequester = "lastFundedRequester",
  NumberOfContributions = "numberOfContributions",
  Request = "request",
  RequestArbitrator = "request__arbitrator",
  RequestArbitratorExtraData = "request__arbitratorExtraData",
  RequestChallenger = "request__challenger",
  RequestCreationTx = "request__creationTx",
  RequestDeposit = "request__deposit",
  RequestDisputeId = "request__disputeID",
  RequestDisputeOutcome = "request__disputeOutcome",
  RequestDisputed = "request__disputed",
  RequestFinalRuling = "request__finalRuling",
  RequestId = "request__id",
  RequestNumberOfRounds = "request__numberOfRounds",
  RequestRegistryAddress = "request__registryAddress",
  RequestRequestType = "request__requestType",
  RequestRequester = "request__requester",
  RequestResolutionTime = "request__resolutionTime",
  RequestResolutionTx = "request__resolutionTx",
  RequestResolved = "request__resolved",
  RequestSubmissionTime = "request__submissionTime",
  Ruling = "ruling",
  RulingTime = "rulingTime",
  TxHashAppealDecision = "txHashAppealDecision",
  TxHashAppealPossible = "txHashAppealPossible",
}

export type MetaEvidence = {
  __typename?: "MetaEvidence";
  /** The URI of the meta evidence file. */
  URI: Scalars["String"]["output"];
  /** The meta evidence ID. */
  id: Scalars["ID"]["output"];
};

export type MetaEvidence_Filter = {
  URI?: InputMaybe<Scalars["String"]["input"]>;
  URI_contains?: InputMaybe<Scalars["String"]["input"]>;
  URI_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_gt?: InputMaybe<Scalars["String"]["input"]>;
  URI_gte?: InputMaybe<Scalars["String"]["input"]>;
  URI_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  URI_lt?: InputMaybe<Scalars["String"]["input"]>;
  URI_lte?: InputMaybe<Scalars["String"]["input"]>;
  URI_not?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  URI_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  URI_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  URI_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<MetaEvidence_Filter>>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<MetaEvidence_Filter>>>;
};

export enum MetaEvidence_OrderBy {
  Uri = "URI",
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
  arbitrator?: Maybe<Arbitrator>;
  arbitrators: Array<Arbitrator>;
  evidence?: Maybe<Evidence>;
  evidenceGroup?: Maybe<EvidenceGroup>;
  evidenceGroups: Array<EvidenceGroup>;
  evidenceMetadata?: Maybe<EvidenceMetadata>;
  evidenceMetadata_collection: Array<EvidenceMetadata>;
  evidences: Array<Evidence>;
  hasPaidAppealFee?: Maybe<HasPaidAppealFee>;
  hasPaidAppealFees: Array<HasPaidAppealFee>;
  item?: Maybe<Item>;
  itemProp?: Maybe<ItemProp>;
  itemProps: Array<ItemProp>;
  itemSearch: Array<LItemMetadata>;
  items: Array<Item>;
  larbitrator?: Maybe<LArbitrator>;
  larbitrators: Array<LArbitrator>;
  lcontribution?: Maybe<LContribution>;
  lcontributions: Array<LContribution>;
  litem?: Maybe<LItem>;
  litemMetadata?: Maybe<LItemMetadata>;
  litemMetadata_collection: Array<LItemMetadata>;
  litems: Array<LItem>;
  lregistries: Array<LRegistry>;
  lregistry?: Maybe<LRegistry>;
  lregistryMetadata?: Maybe<LRegistryMetadata>;
  lregistryMetadata_collection: Array<LRegistryMetadata>;
  lrequest?: Maybe<LRequest>;
  lrequests: Array<LRequest>;
  lround?: Maybe<LRound>;
  lrounds: Array<LRound>;
  metaEvidence?: Maybe<MetaEvidence>;
  metaEvidences: Array<MetaEvidence>;
  registries: Array<Registry>;
  registry?: Maybe<Registry>;
  registrySearch: Array<LRegistryMetadata>;
  request?: Maybe<Request>;
  requests: Array<Request>;
  round?: Maybe<Round>;
  rounds: Array<Round>;
};

export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};

export type QueryArbitratorArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryArbitratorsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Arbitrator_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Arbitrator_Filter>;
};

export type QueryEvidenceArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryEvidenceGroupArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryEvidenceGroupsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<EvidenceGroup_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EvidenceGroup_Filter>;
};

export type QueryEvidenceMetadataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryEvidenceMetadata_CollectionArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<EvidenceMetadata_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EvidenceMetadata_Filter>;
};

export type QueryEvidencesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Evidence_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Evidence_Filter>;
};

export type QueryHasPaidAppealFeeArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryHasPaidAppealFeesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<HasPaidAppealFee_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<HasPaidAppealFee_Filter>;
};

export type QueryItemArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryItemPropArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryItemPropsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<ItemProp_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ItemProp_Filter>;
};

export type QueryItemSearchArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  text: Scalars["String"]["input"];
  where?: InputMaybe<LItemMetadata_Filter>;
};

export type QueryItemsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Item_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Item_Filter>;
};

export type QueryLarbitratorArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLarbitratorsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LArbitrator_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LArbitrator_Filter>;
};

export type QueryLcontributionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLcontributionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LContribution_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LContribution_Filter>;
};

export type QueryLitemArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLitemMetadataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLitemMetadata_CollectionArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LItemMetadata_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LItemMetadata_Filter>;
};

export type QueryLitemsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LItem_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LItem_Filter>;
};

export type QueryLregistriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRegistry_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LRegistry_Filter>;
};

export type QueryLregistryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLregistryMetadataArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLregistryMetadata_CollectionArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRegistryMetadata_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LRegistryMetadata_Filter>;
};

export type QueryLrequestArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLrequestsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRequest_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LRequest_Filter>;
};

export type QueryLroundArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLroundsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<LRound_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LRound_Filter>;
};

export type QueryMetaEvidenceArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMetaEvidencesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<MetaEvidence_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MetaEvidence_Filter>;
};

export type QueryRegistriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Registry_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Registry_Filter>;
};

export type QueryRegistryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRegistrySearchArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  text: Scalars["String"]["input"];
  where?: InputMaybe<LRegistryMetadata_Filter>;
};

export type QueryRequestArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRequestsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Request_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Request_Filter>;
};

export type QueryRoundArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"]["input"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRoundsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Round_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Round_Filter>;
};

export type Registry = {
  __typename?: "Registry";
  /** The current removal meta evidence */
  clearingMetaEvidence: MetaEvidence;
  /** Connected TCR. Can be the 0 address. In practice, will never be null. */
  connectedTCR?: Maybe<Scalars["Bytes"]["output"]>;
  /** The registry address */
  id: Scalars["ID"]["output"];
  /** The items submitted to this list */
  items: Array<Item>;
  /** The number of MetaEvidence event logs emitted. */
  metaEvidenceCount: Scalars["BigInt"]["output"];
  /** The number of items submitted to the list. */
  numberOfItems: Scalars["BigInt"]["output"];
  /** The current registration meta evidence */
  registrationMetaEvidence: MetaEvidence;
  /** The requests submitted to this list */
  requests: Array<Request>;
};

export type RegistryItemsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Item_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Item_Filter>;
};

export type RegistryRequestsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Request_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Request_Filter>;
};

export type Registry_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Registry_Filter>>>;
  clearingMetaEvidence?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_?: InputMaybe<MetaEvidence_Filter>;
  clearingMetaEvidence_contains?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_gt?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_gte?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  clearingMetaEvidence_lt?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_lte?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  clearingMetaEvidence_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  clearingMetaEvidence_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  connectedTCR?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  connectedTCR_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  connectedTCR_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  items_?: InputMaybe<Item_Filter>;
  metaEvidenceCount?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  metaEvidenceCount_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  metaEvidenceCount_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfItems?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfItems_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfItems_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfItems_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfItems_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfItems_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfItems_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfItems_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Registry_Filter>>>;
  registrationMetaEvidence?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_?: InputMaybe<MetaEvidence_Filter>;
  registrationMetaEvidence_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_gt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_gte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidence_lt?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_lte?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registrationMetaEvidence_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registrationMetaEvidence_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  requests_?: InputMaybe<Request_Filter>;
};

export enum Registry_OrderBy {
  ClearingMetaEvidence = "clearingMetaEvidence",
  ClearingMetaEvidenceUri = "clearingMetaEvidence__URI",
  ClearingMetaEvidenceId = "clearingMetaEvidence__id",
  ConnectedTcr = "connectedTCR",
  Id = "id",
  Items = "items",
  MetaEvidenceCount = "metaEvidenceCount",
  NumberOfItems = "numberOfItems",
  RegistrationMetaEvidence = "registrationMetaEvidence",
  RegistrationMetaEvidenceUri = "registrationMetaEvidence__URI",
  RegistrationMetaEvidenceId = "registrationMetaEvidence__id",
  Requests = "requests",
}

export type Request = {
  __typename?: "Request";
  /** The arbitrator trusted to solve disputes for this request. */
  arbitrator: Scalars["Bytes"]["output"];
  /** The extra data for the trusted arbitrator of this request. */
  arbitratorExtraData: Scalars["Bytes"]["output"];
  /** The address of the party that challenged the request */
  challenger: Scalars["Bytes"]["output"];
  /** The hash of the transaction that created this request. */
  creationTx: Scalars["Bytes"]["output"];
  /** The deposit that would be awarded to the challenger if challenge is successful */
  deposit: Scalars["BigInt"]["output"];
  /** ID of the dispute, if any. */
  disputeID: Scalars["BigInt"]["output"];
  /** The outcome of the dispute, if any. Note that unsuccessful appeal fundings can invert the arbitrator ruling (so this may differ from the ruling given by the arbitrator). */
  disputeOutcome: Ruling;
  /** True if a dispute was raised. */
  disputed: Scalars["Boolean"]["output"];
  /** The evidence group for this request. */
  evidenceGroup: EvidenceGroup;
  /** Only set if the request was settled by a dispute. Used by the twitter bot */
  finalRuling?: Maybe<Scalars["BigInt"]["output"]>;
  /** <itemID>-<requestId> */
  id: Scalars["ID"]["output"];
  /** The item this request belongs to. */
  item: Item;
  /** The URI to the meta evidence used for this request. */
  metaEvidence: MetaEvidence;
  /** The total number of rounds on this request. */
  numberOfRounds: Scalars["BigInt"]["output"];
  /** The registry where this request was submitted. */
  registry: Registry;
  /** The address of the registry this item was submitted. Redundant with registry field to allow use in conditionals. */
  registryAddress: Scalars["Bytes"]["output"];
  /** Whether it was requested to add or remove the item to/from the list. */
  requestType: Status;
  /** The address of the party that made a request */
  requester: Scalars["Bytes"]["output"];
  /** The time the request was resolved. */
  resolutionTime: Scalars["BigInt"]["output"];
  /** The hash of the transaction that solved this request. */
  resolutionTx?: Maybe<Scalars["Bytes"]["output"]>;
  /** True if the request was executed and/or any raised disputes were resolved. */
  resolved: Scalars["Boolean"]["output"];
  /** Tracks each round of a dispute in the form rounds[roundID]. */
  rounds: Array<Round>;
  /** Time when the request was made. Used to track when the challenge period ends. */
  submissionTime: Scalars["BigInt"]["output"];
};

export type RequestRoundsArgs = {
  first?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<Round_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  where?: InputMaybe<Round_Filter>;
};

export type Request_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Request_Filter>>>;
  arbitrator?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitratorExtraData_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitratorExtraData_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitrator_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  arbitrator_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  arbitrator_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  challenger?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  challenger_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  challenger_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  creationTx?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  creationTx_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  creationTx_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  deposit?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  deposit_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  deposit_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  disputeID?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  disputeID_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  disputeID_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  disputeOutcome?: InputMaybe<Ruling>;
  disputeOutcome_in?: InputMaybe<Array<Ruling>>;
  disputeOutcome_not?: InputMaybe<Ruling>;
  disputeOutcome_not_in?: InputMaybe<Array<Ruling>>;
  disputed?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  disputed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  disputed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  evidenceGroup?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_?: InputMaybe<EvidenceGroup_Filter>;
  evidenceGroup_contains?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_gt?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_gte?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  evidenceGroup_lt?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_lte?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  evidenceGroup_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  evidenceGroup_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  finalRuling?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  finalRuling_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  finalRuling_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  item?: InputMaybe<Scalars["String"]["input"]>;
  item_?: InputMaybe<Item_Filter>;
  item_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_gt?: InputMaybe<Scalars["String"]["input"]>;
  item_gte?: InputMaybe<Scalars["String"]["input"]>;
  item_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_lt?: InputMaybe<Scalars["String"]["input"]>;
  item_lte?: InputMaybe<Scalars["String"]["input"]>;
  item_not?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  item_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  item_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  item_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_?: InputMaybe<MetaEvidence_Filter>;
  metaEvidence_contains?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_gt?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_gte?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metaEvidence_lt?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_lte?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  metaEvidence_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  metaEvidence_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  numberOfRounds?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  numberOfRounds_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  numberOfRounds_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Request_Filter>>>;
  registry?: InputMaybe<Scalars["String"]["input"]>;
  registryAddress?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registryAddress_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  registryAddress_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  registry_?: InputMaybe<Registry_Filter>;
  registry_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_gt?: InputMaybe<Scalars["String"]["input"]>;
  registry_gte?: InputMaybe<Scalars["String"]["input"]>;
  registry_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_lt?: InputMaybe<Scalars["String"]["input"]>;
  registry_lte?: InputMaybe<Scalars["String"]["input"]>;
  registry_not?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  registry_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  registry_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  requestType?: InputMaybe<Status>;
  requestType_in?: InputMaybe<Array<Status>>;
  requestType_not?: InputMaybe<Status>;
  requestType_not_in?: InputMaybe<Array<Status>>;
  requester?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  requester_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  requester_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  resolutionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  resolutionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  resolutionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  resolutionTx?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  resolutionTx_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  resolutionTx_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  resolved?: InputMaybe<Scalars["Boolean"]["input"]>;
  resolved_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  resolved_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  resolved_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  rounds_?: InputMaybe<Round_Filter>;
  submissionTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  submissionTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  submissionTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
};

export enum Request_OrderBy {
  Arbitrator = "arbitrator",
  ArbitratorExtraData = "arbitratorExtraData",
  Challenger = "challenger",
  CreationTx = "creationTx",
  Deposit = "deposit",
  DisputeId = "disputeID",
  DisputeOutcome = "disputeOutcome",
  Disputed = "disputed",
  EvidenceGroup = "evidenceGroup",
  EvidenceGroupId = "evidenceGroup__id",
  EvidenceGroupNumberOfEvidence = "evidenceGroup__numberOfEvidence",
  FinalRuling = "finalRuling",
  Id = "id",
  Item = "item",
  ItemData = "item__data",
  ItemDisputed = "item__disputed",
  ItemId = "item__id",
  ItemItemId = "item__itemID",
  ItemLatestChallenger = "item__latestChallenger",
  ItemLatestRequestResolutionTime = "item__latestRequestResolutionTime",
  ItemLatestRequestSubmissionTime = "item__latestRequestSubmissionTime",
  ItemLatestRequester = "item__latestRequester",
  ItemNumberOfRequests = "item__numberOfRequests",
  ItemRegistryAddress = "item__registryAddress",
  ItemStatus = "item__status",
  MetaEvidence = "metaEvidence",
  MetaEvidenceUri = "metaEvidence__URI",
  MetaEvidenceId = "metaEvidence__id",
  NumberOfRounds = "numberOfRounds",
  Registry = "registry",
  RegistryAddress = "registryAddress",
  RegistryConnectedTcr = "registry__connectedTCR",
  RegistryId = "registry__id",
  RegistryMetaEvidenceCount = "registry__metaEvidenceCount",
  RegistryNumberOfItems = "registry__numberOfItems",
  RequestType = "requestType",
  Requester = "requester",
  ResolutionTime = "resolutionTime",
  ResolutionTx = "resolutionTx",
  Resolved = "resolved",
  Rounds = "rounds",
  SubmissionTime = "submissionTime",
}

export type Round = {
  __typename?: "Round";
  /** The total amount of appeal fees contributed to the challenger in this round. */
  amountPaidChallenger: Scalars["BigInt"]["output"];
  /** The total amount of appeal fees contributed to the requester in this round. */
  amountPaidRequester: Scalars["BigInt"]["output"];
  /** The time the appeal period ends, if in the appeal period. */
  appealPeriodEnd: Scalars["BigInt"]["output"];
  /** The time the appeal period starts, if in the appeal period. */
  appealPeriodStart: Scalars["BigInt"]["output"];
  /** Whether this round was appealed */
  appealed: Scalars["Boolean"]["output"];
  /** When this round was appealed, if it was appealed */
  appealedAt?: Maybe<Scalars["BigInt"]["output"]>;
  /** The moment the round was created. */
  creationTime: Scalars["BigInt"]["output"];
  /** Sum of reimbursable fees and stake rewards available to the parties that made contributions to the side that ultimately wins a dispute. */
  feeRewards: Scalars["BigInt"]["output"];
  /** Whether the challenger is fully funded. */
  hasPaidChallenger: Scalars["Boolean"]["output"];
  /** Whether the requester is fully funded. */
  hasPaidRequester: Scalars["Boolean"]["output"];
  /** <itemID>-<requestID>-<roundID> */
  id: Scalars["ID"]["output"];
  /** The request to which this round belongs. */
  request: Request;
  /** The ruling given by the arbitrator. */
  ruling: Ruling;
  /** The time the round received the ruling. */
  rulingTime: Scalars["BigInt"]["output"];
  /** The tx hash of the moment the round was appealed */
  txHashAppealDecision?: Maybe<Scalars["Bytes"]["output"]>;
  /** The tx hash of the moment appealing became possible */
  txHashAppealPossible?: Maybe<Scalars["Bytes"]["output"]>;
};

export type Round_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amountPaidChallenger?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amountPaidChallenger_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidChallenger_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amountPaidRequester?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  amountPaidRequester_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  amountPaidRequester_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  and?: InputMaybe<Array<InputMaybe<Round_Filter>>>;
  appealPeriodEnd?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealPeriodEnd_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodEnd_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealPeriodStart?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealPeriodStart_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealPeriodStart_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealed?: InputMaybe<Scalars["Boolean"]["input"]>;
  appealedAt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealedAt_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  appealedAt_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  appealed_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  appealed_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  appealed_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  creationTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  creationTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  creationTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeRewards?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  feeRewards_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  feeRewards_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  hasPaidChallenger?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidChallenger_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasPaidChallenger_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidChallenger_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasPaidRequester?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidRequester_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  hasPaidRequester_not?: InputMaybe<Scalars["Boolean"]["input"]>;
  hasPaidRequester_not_in?: InputMaybe<Array<Scalars["Boolean"]["input"]>>;
  id?: InputMaybe<Scalars["ID"]["input"]>;
  id_gt?: InputMaybe<Scalars["ID"]["input"]>;
  id_gte?: InputMaybe<Scalars["ID"]["input"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  id_lt?: InputMaybe<Scalars["ID"]["input"]>;
  id_lte?: InputMaybe<Scalars["ID"]["input"]>;
  id_not?: InputMaybe<Scalars["ID"]["input"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  or?: InputMaybe<Array<InputMaybe<Round_Filter>>>;
  request?: InputMaybe<Scalars["String"]["input"]>;
  request_?: InputMaybe<Request_Filter>;
  request_contains?: InputMaybe<Scalars["String"]["input"]>;
  request_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  request_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_gt?: InputMaybe<Scalars["String"]["input"]>;
  request_gte?: InputMaybe<Scalars["String"]["input"]>;
  request_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  request_lt?: InputMaybe<Scalars["String"]["input"]>;
  request_lte?: InputMaybe<Scalars["String"]["input"]>;
  request_not?: InputMaybe<Scalars["String"]["input"]>;
  request_not_contains?: InputMaybe<Scalars["String"]["input"]>;
  request_not_contains_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_not_ends_with?: InputMaybe<Scalars["String"]["input"]>;
  request_not_ends_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_not_in?: InputMaybe<Array<Scalars["String"]["input"]>>;
  request_not_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  request_not_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  request_starts_with?: InputMaybe<Scalars["String"]["input"]>;
  request_starts_with_nocase?: InputMaybe<Scalars["String"]["input"]>;
  ruling?: InputMaybe<Ruling>;
  rulingTime?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_gt?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_gte?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  rulingTime_lt?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_lte?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_not?: InputMaybe<Scalars["BigInt"]["input"]>;
  rulingTime_not_in?: InputMaybe<Array<Scalars["BigInt"]["input"]>>;
  ruling_in?: InputMaybe<Array<Ruling>>;
  ruling_not?: InputMaybe<Ruling>;
  ruling_not_in?: InputMaybe<Array<Ruling>>;
  txHashAppealDecision?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHashAppealDecision_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealDecision_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHashAppealPossible?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_gt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_gte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
  txHashAppealPossible_lt?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_lte?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_not?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_not_contains?: InputMaybe<Scalars["Bytes"]["input"]>;
  txHashAppealPossible_not_in?: InputMaybe<Array<Scalars["Bytes"]["input"]>>;
};

export enum Round_OrderBy {
  AmountPaidChallenger = "amountPaidChallenger",
  AmountPaidRequester = "amountPaidRequester",
  AppealPeriodEnd = "appealPeriodEnd",
  AppealPeriodStart = "appealPeriodStart",
  Appealed = "appealed",
  AppealedAt = "appealedAt",
  CreationTime = "creationTime",
  FeeRewards = "feeRewards",
  HasPaidChallenger = "hasPaidChallenger",
  HasPaidRequester = "hasPaidRequester",
  Id = "id",
  Request = "request",
  RequestArbitrator = "request__arbitrator",
  RequestArbitratorExtraData = "request__arbitratorExtraData",
  RequestChallenger = "request__challenger",
  RequestCreationTx = "request__creationTx",
  RequestDeposit = "request__deposit",
  RequestDisputeId = "request__disputeID",
  RequestDisputeOutcome = "request__disputeOutcome",
  RequestDisputed = "request__disputed",
  RequestFinalRuling = "request__finalRuling",
  RequestId = "request__id",
  RequestNumberOfRounds = "request__numberOfRounds",
  RequestRegistryAddress = "request__registryAddress",
  RequestRequestType = "request__requestType",
  RequestRequester = "request__requester",
  RequestResolutionTime = "request__resolutionTime",
  RequestResolutionTx = "request__resolutionTx",
  RequestResolved = "request__resolved",
  RequestSubmissionTime = "request__submissionTime",
  Ruling = "ruling",
  RulingTime = "rulingTime",
  TxHashAppealDecision = "txHashAppealDecision",
  TxHashAppealPossible = "txHashAppealPossible",
}

export enum Ruling {
  /** The arbitrator ruled in favor of the requester. */
  Accept = "Accept",
  /** The arbitrator did not rule or refused to rule. */
  None = "None",
  /** The arbitrator in favor of the challenger. */
  Reject = "Reject",
}

export enum Status {
  /** The item is not registered on the TCR and there are no pending requests. */
  Absent = "Absent",
  /** The item is registered on the TCR, but there is a pending removal request. These are sometimes also called removal requests. */
  ClearingRequested = "ClearingRequested",
  /** The item is registered and there are no pending requests. */
  Registered = "Registered",
  /** The item is not registered on the TCR, but there is a pending registration request. */
  RegistrationRequested = "RegistrationRequested",
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

export type GetImagesQueryVariables = Exact<{
  where?: InputMaybe<LItem_Filter>;
  skip?: InputMaybe<Scalars["Int"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  block?: InputMaybe<Block_Height>;
  subgraphError?: _SubgraphErrorPolicy_;
}>;

export type GetImagesQuery = {
  __typename?: "Query";
  litems: Array<{
    __typename?: "LItem";
    itemID: `0x${string}`;
    status: Status;
    registryAddress: `0x${string}`;
    data: string;
    latestRequester: `0x${string}`;
    disputed: boolean;
    latestRequestSubmissionTime: string;
    metadata?: {
      __typename?: "LItemMetadata";
      props: Array<{ __typename?: "ItemProp"; value?: string | null; description: string; label: string }>;
    } | null;
    requests: Array<{ __typename?: "LRequest"; requestType: Status; resolved: boolean }>;
  }>;
};

export const GetImagesDocument = gql`
    query GetImages($where: LItem_filter, $skip: Int = 0, $first: Int = 100, $block: Block_height, $subgraphError: _SubgraphErrorPolicy_! = deny) {
  litems(
    where: $where
    block: $block
    skip: $skip
    first: $first
    subgraphError: $subgraphError
  ) {
    itemID
    status
    registryAddress
    metadata {
      props {
        value
        description
        label
      }
    }
    data
    latestRequester
    disputed
    requests {
      requestType
      resolved
    }
    latestRequestSubmissionTime
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
    GetImages(
      variables?: GetImagesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetImagesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetImagesQuery>(GetImagesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }),
        "GetImages",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
