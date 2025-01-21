import { GraphQLClient, RequestOptions } from 'graphql-request';
import { GraphQLError, print } from 'graphql'
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type Meta = {
  status?: Maybe<Scalars['JSON']['output']>;
};

export type PageInfo = {
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  _meta?: Maybe<Meta>;
  poolAction?: Maybe<PoolAction>;
  poolActions: PoolActionPage;
  poolOrigin?: Maybe<PoolOrigin>;
  poolOrigins: PoolOriginPage;
  relayBridge?: Maybe<RelayBridge>;
  relayBridges: RelayBridgePage;
  relayPool?: Maybe<RelayPool>;
  relayPools: RelayPoolPage;
  userBalance?: Maybe<UserBalance>;
  userBalances: UserBalancePage;
};


export type QueryPoolActionArgs = {
  id: Scalars['String']['input'];
};


export type QueryPoolActionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<PoolActionFilter>;
};


export type QueryPoolOriginArgs = {
  chainId: Scalars['Float']['input'];
  originBridge: Scalars['String']['input'];
  originChainId: Scalars['Float']['input'];
  pool: Scalars['String']['input'];
};


export type QueryPoolOriginsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<PoolOriginFilter>;
};


export type QueryRelayBridgeArgs = {
  contractAddress: Scalars['String']['input'];
};


export type QueryRelayBridgesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<RelayBridgeFilter>;
};


export type QueryRelayPoolArgs = {
  contractAddress: Scalars['String']['input'];
};


export type QueryRelayPoolsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<RelayPoolFilter>;
};


export type QueryUserBalanceArgs = {
  id: Scalars['String']['input'];
};


export type QueryUserBalancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<UserBalanceFilter>;
};

export type PoolAction = {
  assets: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  relayPool: Scalars['String']['output'];
  shares: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['String']['output'];
  type: Scalars['String']['output'];
  user: Scalars['String']['output'];
};

export type PoolActionFilter = {
  AND?: InputMaybe<Array<InputMaybe<PoolActionFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<PoolActionFilter>>>;
  assets?: InputMaybe<Scalars['BigInt']['input']>;
  assets_gt?: InputMaybe<Scalars['BigInt']['input']>;
  assets_gte?: InputMaybe<Scalars['BigInt']['input']>;
  assets_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  assets_lt?: InputMaybe<Scalars['BigInt']['input']>;
  assets_lte?: InputMaybe<Scalars['BigInt']['input']>;
  assets_not?: InputMaybe<Scalars['BigInt']['input']>;
  assets_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  relayPool?: InputMaybe<Scalars['String']['input']>;
  relayPool_contains?: InputMaybe<Scalars['String']['input']>;
  relayPool_ends_with?: InputMaybe<Scalars['String']['input']>;
  relayPool_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relayPool_not?: InputMaybe<Scalars['String']['input']>;
  relayPool_not_contains?: InputMaybe<Scalars['String']['input']>;
  relayPool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  relayPool_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relayPool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  relayPool_starts_with?: InputMaybe<Scalars['String']['input']>;
  shares?: InputMaybe<Scalars['BigInt']['input']>;
  shares_gt?: InputMaybe<Scalars['BigInt']['input']>;
  shares_gte?: InputMaybe<Scalars['BigInt']['input']>;
  shares_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  shares_lt?: InputMaybe<Scalars['BigInt']['input']>;
  shares_lte?: InputMaybe<Scalars['BigInt']['input']>;
  shares_not?: InputMaybe<Scalars['BigInt']['input']>;
  shares_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  transactionHash?: InputMaybe<Scalars['String']['input']>;
  transactionHash_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  transactionHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  transactionHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  type_contains?: InputMaybe<Scalars['String']['input']>;
  type_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type_not?: InputMaybe<Scalars['String']['input']>;
  type_not_contains?: InputMaybe<Scalars['String']['input']>;
  type_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  type_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  type_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  type_starts_with?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<Scalars['String']['input']>;
  user_contains?: InputMaybe<Scalars['String']['input']>;
  user_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user_not?: InputMaybe<Scalars['String']['input']>;
  user_not_contains?: InputMaybe<Scalars['String']['input']>;
  user_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  user_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  user_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type PoolActionPage = {
  items: Array<PoolAction>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PoolOrigin = {
  chainId: Scalars['Int']['output'];
  maxDebt: Scalars['BigInt']['output'];
  originBridge: Scalars['String']['output'];
  originChainId: Scalars['Int']['output'];
  pool?: Maybe<RelayPool>;
  proxyBridge: Scalars['String']['output'];
};

export type PoolOriginFilter = {
  AND?: InputMaybe<Array<InputMaybe<PoolOriginFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<PoolOriginFilter>>>;
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  maxDebt?: InputMaybe<Scalars['BigInt']['input']>;
  maxDebt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  maxDebt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  maxDebt_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  maxDebt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  maxDebt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  maxDebt_not?: InputMaybe<Scalars['BigInt']['input']>;
  maxDebt_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  originBridge?: InputMaybe<Scalars['String']['input']>;
  originBridge_contains?: InputMaybe<Scalars['String']['input']>;
  originBridge_ends_with?: InputMaybe<Scalars['String']['input']>;
  originBridge_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  originBridge_not?: InputMaybe<Scalars['String']['input']>;
  originBridge_not_contains?: InputMaybe<Scalars['String']['input']>;
  originBridge_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  originBridge_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  originBridge_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  originBridge_starts_with?: InputMaybe<Scalars['String']['input']>;
  originChainId?: InputMaybe<Scalars['Int']['input']>;
  originChainId_gt?: InputMaybe<Scalars['Int']['input']>;
  originChainId_gte?: InputMaybe<Scalars['Int']['input']>;
  originChainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  originChainId_lt?: InputMaybe<Scalars['Int']['input']>;
  originChainId_lte?: InputMaybe<Scalars['Int']['input']>;
  originChainId_not?: InputMaybe<Scalars['Int']['input']>;
  originChainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  pool?: InputMaybe<Scalars['String']['input']>;
  pool_contains?: InputMaybe<Scalars['String']['input']>;
  pool_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pool_not?: InputMaybe<Scalars['String']['input']>;
  pool_not_contains?: InputMaybe<Scalars['String']['input']>;
  pool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  pool_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  pool_starts_with?: InputMaybe<Scalars['String']['input']>;
  proxyBridge?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_contains?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_ends_with?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  proxyBridge_not?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_not_contains?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  proxyBridge_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  proxyBridge_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type PoolOriginPage = {
  items: Array<PoolOrigin>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type RelayBridge = {
  asset: Scalars['String']['output'];
  chainId: Scalars['Int']['output'];
  contractAddress: Scalars['String']['output'];
  createdAt: Scalars['BigInt']['output'];
  createdAtBlock: Scalars['BigInt']['output'];
  transferNonce: Scalars['BigInt']['output'];
};

export type RelayBridgeFilter = {
  AND?: InputMaybe<Array<InputMaybe<RelayBridgeFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<RelayBridgeFilter>>>;
  asset?: InputMaybe<Scalars['String']['input']>;
  asset_contains?: InputMaybe<Scalars['String']['input']>;
  asset_ends_with?: InputMaybe<Scalars['String']['input']>;
  asset_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  asset_not?: InputMaybe<Scalars['String']['input']>;
  asset_not_contains?: InputMaybe<Scalars['String']['input']>;
  asset_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  asset_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  asset_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  asset_starts_with?: InputMaybe<Scalars['String']['input']>;
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  contractAddress?: InputMaybe<Scalars['String']['input']>;
  contractAddress_contains?: InputMaybe<Scalars['String']['input']>;
  contractAddress_ends_with?: InputMaybe<Scalars['String']['input']>;
  contractAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contractAddress_not?: InputMaybe<Scalars['String']['input']>;
  contractAddress_not_contains?: InputMaybe<Scalars['String']['input']>;
  contractAddress_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  contractAddress_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contractAddress_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  contractAddress_starts_with?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAtBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  transferNonce?: InputMaybe<Scalars['BigInt']['input']>;
  transferNonce_gt?: InputMaybe<Scalars['BigInt']['input']>;
  transferNonce_gte?: InputMaybe<Scalars['BigInt']['input']>;
  transferNonce_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  transferNonce_lt?: InputMaybe<Scalars['BigInt']['input']>;
  transferNonce_lte?: InputMaybe<Scalars['BigInt']['input']>;
  transferNonce_not?: InputMaybe<Scalars['BigInt']['input']>;
  transferNonce_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type RelayBridgePage = {
  items: Array<RelayBridge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type RelayPool = {
  asset: Scalars['String']['output'];
  chainId: Scalars['Int']['output'];
  contractAddress: Scalars['String']['output'];
  createdAt: Scalars['BigInt']['output'];
  createdAtBlock: Scalars['BigInt']['output'];
  creator: Scalars['String']['output'];
  origins?: Maybe<PoolOriginPage>;
  outstandingDebt: Scalars['BigInt']['output'];
  totalAssets: Scalars['BigInt']['output'];
  totalShares: Scalars['BigInt']['output'];
  userBalances?: Maybe<UserBalancePage>;
  yieldPool: Scalars['String']['output'];
};


export type RelayPoolOriginsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<PoolOriginFilter>;
};


export type RelayPoolUserBalancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<UserBalanceFilter>;
};

export type RelayPoolFilter = {
  AND?: InputMaybe<Array<InputMaybe<RelayPoolFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<RelayPoolFilter>>>;
  asset?: InputMaybe<Scalars['String']['input']>;
  asset_contains?: InputMaybe<Scalars['String']['input']>;
  asset_ends_with?: InputMaybe<Scalars['String']['input']>;
  asset_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  asset_not?: InputMaybe<Scalars['String']['input']>;
  asset_not_contains?: InputMaybe<Scalars['String']['input']>;
  asset_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  asset_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  asset_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  asset_starts_with?: InputMaybe<Scalars['String']['input']>;
  chainId?: InputMaybe<Scalars['Int']['input']>;
  chainId_gt?: InputMaybe<Scalars['Int']['input']>;
  chainId_gte?: InputMaybe<Scalars['Int']['input']>;
  chainId_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  chainId_lt?: InputMaybe<Scalars['Int']['input']>;
  chainId_lte?: InputMaybe<Scalars['Int']['input']>;
  chainId_not?: InputMaybe<Scalars['Int']['input']>;
  chainId_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  contractAddress?: InputMaybe<Scalars['String']['input']>;
  contractAddress_contains?: InputMaybe<Scalars['String']['input']>;
  contractAddress_ends_with?: InputMaybe<Scalars['String']['input']>;
  contractAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contractAddress_not?: InputMaybe<Scalars['String']['input']>;
  contractAddress_not_contains?: InputMaybe<Scalars['String']['input']>;
  contractAddress_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  contractAddress_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  contractAddress_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  contractAddress_starts_with?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAtBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  creator?: InputMaybe<Scalars['String']['input']>;
  creator_contains?: InputMaybe<Scalars['String']['input']>;
  creator_ends_with?: InputMaybe<Scalars['String']['input']>;
  creator_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  creator_not?: InputMaybe<Scalars['String']['input']>;
  creator_not_contains?: InputMaybe<Scalars['String']['input']>;
  creator_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  creator_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  creator_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  creator_starts_with?: InputMaybe<Scalars['String']['input']>;
  outstandingDebt?: InputMaybe<Scalars['BigInt']['input']>;
  outstandingDebt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  outstandingDebt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  outstandingDebt_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  outstandingDebt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  outstandingDebt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  outstandingDebt_not?: InputMaybe<Scalars['BigInt']['input']>;
  outstandingDebt_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalAssets?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssets_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssets_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssets_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalAssets_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssets_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssets_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssets_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalShares?: InputMaybe<Scalars['BigInt']['input']>;
  totalShares_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalShares_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalShares_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalShares_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalShares_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalShares_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalShares_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  yieldPool?: InputMaybe<Scalars['String']['input']>;
  yieldPool_contains?: InputMaybe<Scalars['String']['input']>;
  yieldPool_ends_with?: InputMaybe<Scalars['String']['input']>;
  yieldPool_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  yieldPool_not?: InputMaybe<Scalars['String']['input']>;
  yieldPool_not_contains?: InputMaybe<Scalars['String']['input']>;
  yieldPool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  yieldPool_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  yieldPool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  yieldPool_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type RelayPoolPage = {
  items: Array<RelayPool>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type UserBalance = {
  balance: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  lastUpdated: Scalars['BigInt']['output'];
  pool?: Maybe<RelayPool>;
  relayPool: Scalars['String']['output'];
  totalDeposited: Scalars['BigInt']['output'];
  totalWithdrawn: Scalars['BigInt']['output'];
  wallet: Scalars['String']['output'];
};

export type UserBalanceFilter = {
  AND?: InputMaybe<Array<InputMaybe<UserBalanceFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<UserBalanceFilter>>>;
  balance?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  balance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  balance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not?: InputMaybe<Scalars['BigInt']['input']>;
  balance_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  lastUpdated?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdated_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdated_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdated_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastUpdated_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdated_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdated_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastUpdated_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  relayPool?: InputMaybe<Scalars['String']['input']>;
  relayPool_contains?: InputMaybe<Scalars['String']['input']>;
  relayPool_ends_with?: InputMaybe<Scalars['String']['input']>;
  relayPool_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relayPool_not?: InputMaybe<Scalars['String']['input']>;
  relayPool_not_contains?: InputMaybe<Scalars['String']['input']>;
  relayPool_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  relayPool_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relayPool_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  relayPool_starts_with?: InputMaybe<Scalars['String']['input']>;
  totalDeposited?: InputMaybe<Scalars['BigInt']['input']>;
  totalDeposited_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalDeposited_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalDeposited_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalDeposited_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalDeposited_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalDeposited_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalDeposited_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalWithdrawn?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalWithdrawn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  wallet?: InputMaybe<Scalars['String']['input']>;
  wallet_contains?: InputMaybe<Scalars['String']['input']>;
  wallet_ends_with?: InputMaybe<Scalars['String']['input']>;
  wallet_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  wallet_not?: InputMaybe<Scalars['String']['input']>;
  wallet_not_contains?: InputMaybe<Scalars['String']['input']>;
  wallet_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  wallet_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  wallet_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  wallet_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type UserBalancePage = {
  items: Array<UserBalance>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type GetAllPoolsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllPoolsQuery = { relayPools: { items: Array<{ contractAddress: string, asset: string, chainId: number, outstandingDebt: any, totalAssets: any, totalShares: any, origins?: { totalCount: number, items: Array<{ proxyBridge: string, originChainId: number, originBridge: string }> } | null }> } };

export type GetRelayPoolQueryVariables = Exact<{
  contractAddress: Scalars['String']['input'];
}>;


export type GetRelayPoolQuery = { relayPool?: { contractAddress: string, creator: string, asset: string, yieldPool: string, outstandingDebt: any, totalAssets: any, totalShares: any, chainId: number, createdAt: any, createdAtBlock: any } | null };

export type GetUserBalancesQueryVariables = Exact<{
  walletAddress: Scalars['String']['input'];
}>;


export type GetUserBalancesQuery = { userBalances: { items: Array<{ relayPool: string, balance: any, pool?: { contractAddress: string, chainId: number, asset: string, totalAssets: any, totalShares: any, outstandingDebt: any } | null }> } };

export type GetUserBalanceInPoolQueryVariables = Exact<{
  walletAddress: Scalars['String']['input'];
  poolAddress: Scalars['String']['input'];
}>;


export type GetUserBalanceInPoolQuery = { userBalances: { items: Array<{ relayPool: string, balance: any, totalDeposited: any, totalWithdrawn: any, lastUpdated: any, pool?: { contractAddress: string, chainId: number, asset: string, totalAssets: any, totalShares: any, outstandingDebt: any } | null }> } };


export const GetAllPoolsDocument = gql`
    query GetAllPools {
  relayPools(limit: 10) {
    items {
      contractAddress
      asset
      chainId
      outstandingDebt
      totalAssets
      totalShares
      origins(limit: 10) {
        totalCount
        items {
          proxyBridge
          originChainId
          originBridge
        }
      }
    }
  }
}
    `;
export const GetRelayPoolDocument = gql`
    query GetRelayPool($contractAddress: String!) {
  relayPool(contractAddress: $contractAddress) {
    contractAddress
    creator
    asset
    yieldPool
    outstandingDebt
    totalAssets
    totalShares
    chainId
    createdAt
    createdAtBlock
  }
}
    `;
export const GetUserBalancesDocument = gql`
    query GetUserBalances($walletAddress: String!) {
  userBalances(where: {wallet: $walletAddress}) {
    items {
      relayPool
      balance
      pool {
        contractAddress
        chainId
        asset
        totalAssets
        totalShares
        outstandingDebt
      }
    }
  }
}
    `;
export const GetUserBalanceInPoolDocument = gql`
    query GetUserBalanceInPool($walletAddress: String!, $poolAddress: String!) {
  userBalances(where: {wallet: $walletAddress, relayPool: $poolAddress}) {
    items {
      relayPool
      balance
      totalDeposited
      totalWithdrawn
      lastUpdated
      pool {
        contractAddress
        chainId
        asset
        totalAssets
        totalShares
        outstandingDebt
      }
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();
const GetAllPoolsDocumentString = print(GetAllPoolsDocument);
const GetRelayPoolDocumentString = print(GetRelayPoolDocument);
const GetUserBalancesDocumentString = print(GetUserBalancesDocument);
const GetUserBalanceInPoolDocumentString = print(GetUserBalanceInPoolDocument);
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetAllPools(variables?: GetAllPoolsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetAllPoolsQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetAllPoolsQuery>(GetAllPoolsDocumentString, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetAllPools', 'query', variables);
    },
    GetRelayPool(variables: GetRelayPoolQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetRelayPoolQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetRelayPoolQuery>(GetRelayPoolDocumentString, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetRelayPool', 'query', variables);
    },
    GetUserBalances(variables: GetUserBalancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetUserBalancesQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetUserBalancesQuery>(GetUserBalancesDocumentString, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetUserBalances', 'query', variables);
    },
    GetUserBalanceInPool(variables: GetUserBalanceInPoolQueryVariables, requestHeaders?: GraphQLClientRequestHeaders): Promise<{ data: GetUserBalanceInPoolQuery; errors?: GraphQLError[]; extensions?: any; headers: Headers; status: number; }> {
        return withWrapper((wrappedRequestHeaders) => client.rawRequest<GetUserBalanceInPoolQuery>(GetUserBalanceInPoolDocumentString, variables, {...requestHeaders, ...wrappedRequestHeaders}), 'GetUserBalanceInPool', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;