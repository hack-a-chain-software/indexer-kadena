import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: { input: any; output: any };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: Date; output: Date };
  /** Floats that will have a value of 0 or more. */
  Decimal: { input: any; output: any };
};

/** A unit of information that stores a set of verified transactions. */
export type Block = Node & {
  __typename?: 'Block';
  chainId: Scalars['BigInt']['output'];
  creationTime: Scalars['DateTime']['output'];
  /** The difficulty of the block. */
  difficulty: Scalars['BigInt']['output'];
  /** The moment the difficulty is adjusted to maintain a block validation time of 30 seconds. */
  epoch: Scalars['DateTime']['output'];
  /** Default page size is 20. */
  events: BlockEventsConnection;
  flags: Scalars['Decimal']['output'];
  hash: Scalars['String']['output'];
  height: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  minerAccount: FungibleChainAccount;
  neighbors: Array<BlockNeighbor>;
  nonce: Scalars['Decimal']['output'];
  parent?: Maybe<Block>;
  payloadHash: Scalars['String']['output'];
  /** The proof of work hash. */
  powHash: Scalars['String']['output'];
  target: Scalars['String']['output'];
  /** Default page size is 20. */
  transactions: BlockTransactionsConnection;
  weight: Scalars['String']['output'];
};

/** A unit of information that stores a set of verified transactions. */
export type BlockEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** A unit of information that stores a set of verified transactions. */
export type BlockTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type BlockEventsConnection = {
  __typename?: 'BlockEventsConnection';
  edges: Array<BlockEventsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type BlockEventsConnectionEdge = {
  __typename?: 'BlockEventsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Event;
};

/** The neighbor of a block. */
export type BlockNeighbor = {
  __typename?: 'BlockNeighbor';
  chainId: Scalars['String']['output'];
  hash: Scalars['String']['output'];
};

export type BlockTransactionsConnection = {
  __typename?: 'BlockTransactionsConnection';
  edges: Array<BlockTransactionsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type BlockTransactionsConnectionEdge = {
  __typename?: 'BlockTransactionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

/** A single data point in a chart */
export type ChartDataPoint = {
  __typename?: 'ChartDataPoint';
  /** The timestamp of the data point */
  timestamp: Scalars['DateTime']['output'];
  /** The value at this timestamp */
  value: Scalars['Decimal']['output'];
};

/** The payload of an cont transaction. */
export type ContinuationPayload = {
  __typename?: 'ContinuationPayload';
  /** The environment data made available to the transaction. Formatted as raw JSON. */
  data: Scalars['String']['output'];
  /** A unique id when a pact (defpact) is initiated. See the "Pact execution scope and pact-id" explanation in the docs for more information. */
  pactId?: Maybe<Scalars['String']['output']>;
  /** The proof provided to continue the cross-chain transaction. */
  proof?: Maybe<Scalars['String']['output']>;
  /** Whether or not this transaction can be rolled back. */
  rollback?: Maybe<Scalars['Boolean']['output']>;
  /** The step-number when this is an execution of a `defpact`, aka multi-step transaction. */
  step?: Maybe<Scalars['Int']['output']>;
};

/** DEX metrics including TVL, volume, and pool count */
export type DexMetrics = {
  __typename?: 'DexMetrics';
  /** Current total value locked in USD */
  currentTvlUsd: Scalars['Decimal']['output'];
  /** Total number of pools */
  totalPools: Scalars['Int']['output'];
  /** Total volume in USD for the specified period */
  totalVolumeUsd: Scalars['Decimal']['output'];
  /** Historical TVL data points */
  tvlHistory: Array<ChartDataPoint>;
  /** Historical volume data points */
  volumeHistory: Array<ChartDataPoint>;
};

/** An event emitted by the execution of a smart-contract function. */
export type Event = Node & {
  __typename?: 'Event';
  block: Block;
  chainId: Scalars['BigInt']['output'];
  /** The height of the block where the event was emitted. */
  height: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  moduleName: Scalars['String']['output'];
  name: Scalars['String']['output'];
  /** The order index of this event, in the case that there are multiple events in one transaction. */
  orderIndex: Scalars['BigInt']['output'];
  parameterText: Scalars['String']['output'];
  parameters?: Maybe<Scalars['String']['output']>;
  /** The full eventname, containing module and eventname, e.g. coin.TRANSFER */
  qualifiedName: Scalars['String']['output'];
  requestKey: Scalars['String']['output'];
  transaction?: Maybe<Transaction>;
};

/** The payload of an exec transaction. */
export type ExecutionPayload = {
  __typename?: 'ExecutionPayload';
  /** The Pact expressions executed in this transaction when it is an `exec` transaction. */
  code?: Maybe<Scalars['String']['output']>;
  /** The environment data made available to the transaction. Formatted as raw JSON. */
  data: Scalars['String']['output'];
};

/** A fungible-specific account. */
export type FungibleAccount = Node & {
  __typename?: 'FungibleAccount';
  accountName: Scalars['String']['output'];
  /**
   * Uses "length" multiplier which scales with the number of items in the returned array.
   * Each chain account requires a separate database lookup, so complexity = 5 × array_length.
   * Example: 3 chain accounts = 5 × 3 = 15 complexity points.
   * This pattern is ideal for array fields where complexity scales linearly with result size.
   */
  chainAccounts: Array<FungibleChainAccount>;
  fungibleName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  totalBalance: Scalars['Decimal']['output'];
  /**
   * Default page size is 20.
   * Uses "first" multiplier to control pagination complexity.
   * Transactions are expensive operations requiring joins, so base value is higher.
   * Example: requesting 20 transactions = 10 × 20 = 200 complexity points.
   */
  transactions: FungibleAccountTransactionsConnection;
  transfers: FungibleAccountTransfersConnection;
};

/** A fungible-specific account. */
export type FungibleAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** A fungible-specific account. */
export type FungibleAccountTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type FungibleAccountTransactionsConnection = {
  __typename?: 'FungibleAccountTransactionsConnection';
  edges: Array<FungibleAccountTransactionsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FungibleAccountTransactionsConnectionEdge = {
  __typename?: 'FungibleAccountTransactionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export type FungibleAccountTransfersConnection = {
  __typename?: 'FungibleAccountTransfersConnection';
  edges: Array<FungibleAccountTransfersConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FungibleAccountTransfersConnectionEdge = {
  __typename?: 'FungibleAccountTransfersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transfer;
};

/** A fungible specific chain-account. */
export type FungibleChainAccount = Node & {
  __typename?: 'FungibleChainAccount';
  accountName: Scalars['String']['output'];
  balance: Scalars['Float']['output'];
  chainId: Scalars['String']['output'];
  fungibleName: Scalars['String']['output'];
  guard: IGuard;
  id: Scalars['ID']['output'];
  /** Transactions that the current account is sender of. Default page size is 20. */
  transactions: FungibleChainAccountTransactionsConnection;
  /** Default page size is 20. */
  transfers: FungibleChainAccountTransfersConnection;
};

/** A fungible specific chain-account. */
export type FungibleChainAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** A fungible specific chain-account. */
export type FungibleChainAccountTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type FungibleChainAccountTransactionsConnection = {
  __typename?: 'FungibleChainAccountTransactionsConnection';
  edges: Array<FungibleChainAccountTransactionsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FungibleChainAccountTransactionsConnectionEdge = {
  __typename?: 'FungibleChainAccountTransactionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export type FungibleChainAccountTransfersConnection = {
  __typename?: 'FungibleChainAccountTransfersConnection';
  edges: Array<FungibleChainAccountTransfersConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type FungibleChainAccountTransfersConnectionEdge = {
  __typename?: 'FungibleChainAccountTransfersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transfer;
};

export type GasLimitEstimation = {
  __typename?: 'GasLimitEstimation';
  amount: Scalars['Int']['output'];
  inputType: Scalars['String']['output'];
  transaction: Scalars['String']['output'];
  usedPreflight: Scalars['Boolean']['output'];
  usedSignatureVerification: Scalars['Boolean']['output'];
};

export type GenesisHeight = {
  __typename?: 'GenesisHeight';
  chainId: Scalars['String']['output'];
  height: Scalars['Int']['output'];
};

/** General information about the graph and chainweb-data. */
export type GraphConfiguration = {
  __typename?: 'GraphConfiguration';
  /** The lowest block-height that is indexed in this endpoint. */
  minimumBlockHeight?: Maybe<Scalars['BigInt']['output']>;
  /** The version of the graphl api. */
  version: Scalars['String']['output'];
};

/** A guard. This is a union of all the different types of guards that can be used in a pact. */
export type IGuard = {
  /** @deprecated deprecated, use KeysetGuard.keys */
  keys: Array<Scalars['String']['output']>;
  /** @deprecated deprecated, use KeysetGuard.predicate */
  predicate: Scalars['String']['output'];
  raw: Scalars['String']['output'];
};

/** A keyset guard. */
export type KeysetGuard = IGuard & {
  __typename?: 'KeysetGuard';
  keys: Array<Scalars['String']['output']>;
  predicate: Scalars['String']['output'];
  raw: Scalars['String']['output'];
};

export type LiquidityBalance = {
  __typename?: 'LiquidityBalance';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  liquidity: Scalars['String']['output'];
  pair: Pool;
  pairId: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  walletAddress: Scalars['String']['output'];
};

/** A user's liquidity position in a pool */
export type LiquidityPosition = {
  __typename?: 'LiquidityPosition';
  apr24h: Scalars['Decimal']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  liquidity: Scalars['String']['output'];
  pair: Pool;
  pairId: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  valueUsd: Scalars['Decimal']['output'];
  walletAddress: Scalars['String']['output'];
};

export type LiquidityPositionEdge = {
  __typename?: 'LiquidityPositionEdge';
  cursor: Scalars['String']['output'];
  node: LiquidityPosition;
};

/** Sort options for liquidity positions */
export enum LiquidityPositionOrderBy {
  AprAsc = 'APR_ASC',
  AprDesc = 'APR_DESC',
  LiquidityAsc = 'LIQUIDITY_ASC',
  LiquidityDesc = 'LIQUIDITY_DESC',
  ValueUsdAsc = 'VALUE_USD_ASC',
  ValueUsdDesc = 'VALUE_USD_DESC',
}

export type LiquidityPositionsConnection = {
  __typename?: 'LiquidityPositionsConnection';
  edges: Array<LiquidityPositionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** Information about the network. */
export type NetworkInfo = {
  __typename?: 'NetworkInfo';
  /** The version of the API. */
  apiVersion: Scalars['String']['output'];
  /** The number of circulating coins. */
  coinsInCirculation: Scalars['Float']['output'];
  genesisHeights: Array<GenesisHeight>;
  /** The network hash rate. */
  networkHashRate: Scalars['Float']['output'];
  /** The host of the network. */
  networkHost: Scalars['String']['output'];
  /** The ID of the network. */
  networkId: Scalars['String']['output'];
  nodeBlockDelay: Scalars['Int']['output'];
  nodeChains: Array<Scalars['String']['output']>;
  nodeLatestBehaviorHeight: Scalars['Int']['output'];
  nodePackageVersion: Scalars['String']['output'];
  nodeServiceDate?: Maybe<Scalars['DateTime']['output']>;
  numberOfChains: Scalars['Int']['output'];
  /** The total difficulty. */
  totalDifficulty: Scalars['Float']['output'];
  /** The total number of transactions. */
  transactionCount: Scalars['Int']['output'];
};

export type Node = {
  id: Scalars['ID']['output'];
};

/** A non-fungible-specific account. */
export type NonFungibleAccount = Node & {
  __typename?: 'NonFungibleAccount';
  accountName: Scalars['String']['output'];
  chainAccounts: Array<NonFungibleChainAccount>;
  id: Scalars['ID']['output'];
  nonFungibleTokenBalances: Array<NonFungibleTokenBalance>;
  /** Default page size is 20. Note that custom token related transactions are not included. */
  transactions: NonFungibleAccountTransactionsConnection;
};

/** A non-fungible-specific account. */
export type NonFungibleAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type NonFungibleAccountTransactionsConnection = {
  __typename?: 'NonFungibleAccountTransactionsConnection';
  edges: Array<NonFungibleAccountTransactionsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type NonFungibleAccountTransactionsConnectionEdge = {
  __typename?: 'NonFungibleAccountTransactionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

/** A chain and non-fungible-specific account. */
export type NonFungibleChainAccount = Node & {
  __typename?: 'NonFungibleChainAccount';
  accountName: Scalars['String']['output'];
  chainId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nonFungibleTokenBalances: Array<NonFungibleTokenBalance>;
  /** Default page size is 20. Note that custom token related transactions are not included. */
  transactions: NonFungibleChainAccountTransactionsConnection;
};

/** A chain and non-fungible-specific account. */
export type NonFungibleChainAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type NonFungibleChainAccountTransactionsConnection = {
  __typename?: 'NonFungibleChainAccountTransactionsConnection';
  edges: Array<NonFungibleChainAccountTransactionsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type NonFungibleChainAccountTransactionsConnectionEdge = {
  __typename?: 'NonFungibleChainAccountTransactionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

/** Information related to a token. */
export type NonFungibleToken = {
  __typename?: 'NonFungibleToken';
  precision: Scalars['Int']['output'];
  supply: Scalars['Int']['output'];
  uri: Scalars['String']['output'];
};

/** The token identifier and its balance. */
export type NonFungibleTokenBalance = Node & {
  __typename?: 'NonFungibleTokenBalance';
  accountName: Scalars['String']['output'];
  balance: Scalars['Int']['output'];
  chainId: Scalars['String']['output'];
  guard: IGuard;
  id: Scalars['ID']['output'];
  info?: Maybe<NonFungibleToken>;
  tokenId: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type PactQuery = {
  chainId: Scalars['String']['input'];
  code: Scalars['String']['input'];
  data?: InputMaybe<Array<PactQueryData>>;
};

export type PactQueryData = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/** Information related to a token. */
export type PactQueryResponse = {
  __typename?: 'PactQueryResponse';
  chainId: Scalars['String']['output'];
  code: Scalars['String']['output'];
  error?: Maybe<Scalars['String']['output']>;
  result?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** A liquidity pool for a token pair. */
export type Pool = Node & {
  __typename?: 'Pool';
  address: Scalars['String']['output'];
  apr24h: Scalars['Decimal']['output'];
  /** Get chart data for this pool */
  charts: PoolCharts;
  createdAt: Scalars['DateTime']['output'];
  fees24hUsd: Scalars['Decimal']['output'];
  feesChange24h: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  reserve0: Scalars['String']['output'];
  reserve1: Scalars['String']['output'];
  token0: Token;
  token1: Token;
  totalSupply: Scalars['String']['output'];
  transactionCount24h: Scalars['Int']['output'];
  transactionCountChange24h: Scalars['Float']['output'];
  /** Get transactions for this pool */
  transactions?: Maybe<PoolTransactionsConnection>;
  tvlChange24h: Scalars['Float']['output'];
  tvlUsd: Scalars['Decimal']['output'];
  updatedAt: Scalars['DateTime']['output'];
  volume7dUsd: Scalars['Decimal']['output'];
  volume24hUsd: Scalars['Decimal']['output'];
  volumeChange24h: Scalars['Float']['output'];
};

/** A liquidity pool for a token pair. */
export type PoolChartsArgs = {
  timeFrame: TimeFrame;
};

/** A liquidity pool for a token pair. */
export type PoolTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<PoolTransactionType>;
};

/** Chart data for a pool */
export type PoolCharts = {
  __typename?: 'PoolCharts';
  /** Fees data points */
  fees: Array<ChartDataPoint>;
  /** TVL data points */
  tvl: Array<ChartDataPoint>;
  /** Volume data points */
  volume: Array<ChartDataPoint>;
};

/** Sort options for pools */
export enum PoolOrderBy {
  Apr_24HAsc = 'APR_24H_ASC',
  Apr_24HDesc = 'APR_24H_DESC',
  TransactionCount_24HAsc = 'TRANSACTION_COUNT_24H_ASC',
  TransactionCount_24HDesc = 'TRANSACTION_COUNT_24H_DESC',
  TvlUsdAsc = 'TVL_USD_ASC',
  TvlUsdDesc = 'TVL_USD_DESC',
  Volume_7DAsc = 'VOLUME_7D_ASC',
  Volume_7DDesc = 'VOLUME_7D_DESC',
  Volume_24HAsc = 'VOLUME_24H_ASC',
  Volume_24HDesc = 'VOLUME_24H_DESC',
}

/** A swap transaction in a pool */
export type PoolTransaction = {
  __typename?: 'PoolTransaction';
  /** Amount of token0 swapped in */
  amount0In: Scalars['Decimal']['output'];
  /** Amount of token0 swapped out */
  amount0Out: Scalars['Decimal']['output'];
  /** Amount of token1 swapped in */
  amount1In: Scalars['Decimal']['output'];
  /** Amount of token1 swapped out */
  amount1Out: Scalars['Decimal']['output'];
  /** Total amount in USD */
  amountUsd: Scalars['Decimal']['output'];
  /** Unique identifier */
  id: Scalars['ID']['output'];
  /** User who made the swap */
  maker: Scalars['String']['output'];
  /** Request key of the transaction */
  requestkey: Scalars['String']['output'];
  /** Transaction timestamp */
  timestamp: Scalars['DateTime']['output'];
  /** ID of the transaction */
  transactionId?: Maybe<Scalars['Int']['output']>;
  /** The type of transaction */
  transactionType: PoolTransactionType;
};

/** Edge type for pool transactions */
export type PoolTransactionEdge = {
  __typename?: 'PoolTransactionEdge';
  /** Cursor for pagination */
  cursor: Scalars['String']['output'];
  /** The transaction node */
  node: PoolTransaction;
};

/** Transaction type for pool events */
export enum PoolTransactionType {
  /** Add liquidity transaction */
  AddLiquidity = 'ADD_LIQUIDITY',
  /** Remove liquidity transaction */
  RemoveLiquidity = 'REMOVE_LIQUIDITY',
  /** Swap transaction */
  Swap = 'SWAP',
}

/** Connection type for pool transactions */
export type PoolTransactionsConnection = {
  __typename?: 'PoolTransactionsConnection';
  /** List of transaction edges */
  edges?: Maybe<Array<PoolTransactionEdge>>;
  /** Pagination information */
  pageInfo?: Maybe<PageInfo>;
  /** Total number of transactions */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** Retrieve a block by hash. */
  block?: Maybe<Block>;
  /** Retrieve blocks by chain and minimal depth. Default page size is 20. */
  blocksFromDepth?: Maybe<QueryBlocksFromDepthConnection>;
  /** Retrieve blocks by chain and minimal height. Default page size is 20. */
  blocksFromHeight: QueryBlocksFromHeightConnection;
  /** Retrieve all completed blocks from a given height. Default page size is 20. */
  completedBlockHeights: QueryCompletedBlockHeightsConnection;
  /** Get DEX metrics including TVL, volume, and pool count */
  dexMetrics: DexMetrics;
  /**
   * Retrieve events by qualifiedName (e.g. `coin.TRANSFER`). Default page size is 20.
   *
   *       The parametersFilter is a stringified JSON object that matches the [JSON object property filters](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#filter-on-object-property) from Prisma.
   *
   *       An example of such a filter parameter value: `events(parametersFilter: "{\"array_starts_with\": \"k:abcdefg\"}")`
   */
  events: QueryEventsConnection;
  /** Retrieve an fungible specific account by its name and fungible, such as coin. */
  fungibleAccount?: Maybe<FungibleAccount>;
  /** Retrieve an account by public key. */
  fungibleAccountsByPublicKey: Array<FungibleAccount>;
  /** Retrieve an account by its name and fungible, such as coin, on a specific chain. */
  fungibleChainAccount?: Maybe<FungibleChainAccount>;
  /** Retrieve an account by its name and fungible, such as coin, on a specific chain. */
  fungibleChainAccounts?: Maybe<Array<FungibleChainAccount>>;
  /** Retrieve a chain account by public key. */
  fungibleChainAccountsByPublicKey: Array<FungibleChainAccount>;
  /**
   * Estimate the gas limit for one or more transactions. Throws an error when the transaction fails or is invalid. The input accepts a JSON object and based on the parameters passed it will determine what type of format it is and return the gas limit estimation. The following types are supported:
   *
   *       - `full-transaction`: A complete transaction object. Required parameters: `cmd`, `hash` and `sigs`.
   *       - `stringified-command`: A JSON stringified command. Required parameters: `cmd`. It also optionally accepts `sigs`.
   *       - `full-command`: A full command. Required parameters: `payload`, `meta` and `signers`.
   *       - `partial-command`: A partial command. Required parameters: `payload` and either `meta` or `signers`. In case `meta` is not given, but `signers` is given, you can also add `chainId` as a parameter.
   *       - `payload`: A just the payload of a command. Required parameters: `payload` and `chainId`.
   *       - `code`: The code of an execution. Required parameters: `code` and `chainId`.
   *
   *       Every type accepts an optional parameter called `networkId` to override the default value from the environment variables.
   *
   *       Example of the input needed for a type `code` query: `gasLimitEstimate(input: "{\"code\":\"(coin.details \\\"k:1234\\\")\",\"chainId\":\"3\"}")`
   */
  gasLimitEstimate: Array<GasLimitEstimation>;
  /** Get the configuration of the graph. */
  graphConfiguration: GraphConfiguration;
  /** Get the height of the block with the highest height. */
  lastBlockHeight?: Maybe<Scalars['BigInt']['output']>;
  /** Get user's liquidity positions */
  liquidityPositions: LiquidityPositionsConnection;
  /** Get information about the network. */
  networkInfo?: Maybe<NetworkInfo>;
  node?: Maybe<Node>;
  nodes: Array<Maybe<Node>>;
  /** Retrieve a non-fungible specific account by its name. */
  nonFungibleAccount?: Maybe<NonFungibleAccount>;
  /** Retrieve an account by its name on a specific chain. */
  nonFungibleChainAccount?: Maybe<NonFungibleChainAccount>;
  /** Execute arbitrary Pact code via a local call without gas-estimation or signature-verification (e.g. (+ 1 2) or (coin.get-details <account>)). */
  pactQuery: Array<PactQueryResponse>;
  /** Retrieve a specific pool by its ID. */
  pool?: Maybe<Pool>;
  poolTransactions?: Maybe<PoolTransactionsConnection>;
  /** Retrieve liquidity pools. Default page size is 20. */
  pools: QueryPoolsConnection;
  tokens: QueryTokensConnection;
  /** Retrieve one transaction by its unique key. Throws an error if multiple transactions are found. */
  transaction?: Maybe<Transaction>;
  /**
   * Retrieve transactions. Default page size is 20.
   *  At least one of accountName, fungibleName, blockHash, or requestKey must be provided.
   */
  transactions: QueryTransactionsConnection;
  /** Retrieve all transactions by a given public key. */
  transactionsByPublicKey: QueryTransactionsByPublicKeyConnection;
  /** Retrieve transfers. Default page size is 20. */
  transfers: QueryTransfersConnection;
};

export type QueryBlockArgs = {
  hash: Scalars['String']['input'];
};

export type QueryBlocksFromDepthArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  chainIds?: InputMaybe<Array<Scalars['String']['input']>>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  minimumDepth: Scalars['Int']['input'];
};

export type QueryBlocksFromHeightArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  chainIds?: InputMaybe<Array<Scalars['String']['input']>>;
  endHeight?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  startHeight: Scalars['Int']['input'];
};

export type QueryCompletedBlockHeightsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  chainIds?: InputMaybe<Array<Scalars['String']['input']>>;
  completedHeights?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  heightCount?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDexMetricsArgs = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  protocolAddress?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

export type QueryEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  blockHash?: InputMaybe<Scalars['String']['input']>;
  chainId?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  maxHeight?: InputMaybe<Scalars['Int']['input']>;
  minHeight?: InputMaybe<Scalars['Int']['input']>;
  minimumDepth?: InputMaybe<Scalars['Int']['input']>;
  orderIndex?: InputMaybe<Scalars['Int']['input']>;
  parametersFilter?: InputMaybe<Scalars['String']['input']>;
  qualifiedEventName: Scalars['String']['input'];
  requestKey?: InputMaybe<Scalars['String']['input']>;
};

export type QueryFungibleAccountArgs = {
  accountName: Scalars['String']['input'];
  fungibleName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryFungibleAccountsByPublicKeyArgs = {
  fungibleName?: InputMaybe<Scalars['String']['input']>;
  publicKey: Scalars['String']['input'];
};

export type QueryFungibleChainAccountArgs = {
  accountName: Scalars['String']['input'];
  chainId: Scalars['String']['input'];
  fungibleName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryFungibleChainAccountsArgs = {
  accountName: Scalars['String']['input'];
  chainIds?: InputMaybe<Array<Scalars['String']['input']>>;
  fungibleName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryFungibleChainAccountsByPublicKeyArgs = {
  chainId: Scalars['String']['input'];
  fungibleName?: InputMaybe<Scalars['String']['input']>;
  publicKey: Scalars['String']['input'];
};

export type QueryGasLimitEstimateArgs = {
  input: Array<Scalars['String']['input']>;
};

export type QueryLiquidityPositionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LiquidityPositionOrderBy>;
  walletAddress: Scalars['String']['input'];
};

export type QueryNodeArgs = {
  id: Scalars['ID']['input'];
};

export type QueryNodesArgs = {
  ids: Array<Scalars['ID']['input']>;
};

export type QueryNonFungibleAccountArgs = {
  accountName: Scalars['String']['input'];
};

export type QueryNonFungibleChainAccountArgs = {
  accountName: Scalars['String']['input'];
  chainId: Scalars['String']['input'];
};

export type QueryPactQueryArgs = {
  pactQuery: Array<PactQuery>;
};

export type QueryPoolArgs = {
  id: Scalars['ID']['input'];
};

export type QueryPoolTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  pairId: Scalars['Int']['input'];
  type?: InputMaybe<PoolTransactionType>;
};

export type QueryPoolsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PoolOrderBy>;
  protocolAddress?: InputMaybe<Scalars['String']['input']>;
};

export type QueryTokensArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryTransactionArgs = {
  blockHash?: InputMaybe<Scalars['String']['input']>;
  minimumDepth?: InputMaybe<Scalars['Int']['input']>;
  requestKey: Scalars['String']['input'];
};

export type QueryTransactionsArgs = {
  accountName?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  blockHash?: InputMaybe<Scalars['String']['input']>;
  chainId?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  fungibleName?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  maxHeight?: InputMaybe<Scalars['Int']['input']>;
  minHeight?: InputMaybe<Scalars['Int']['input']>;
  minimumDepth?: InputMaybe<Scalars['Int']['input']>;
  requestKey?: InputMaybe<Scalars['String']['input']>;
};

export type QueryTransactionsByPublicKeyArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  publicKey: Scalars['String']['input'];
};

export type QueryTransfersArgs = {
  accountName?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  blockHash?: InputMaybe<Scalars['String']['input']>;
  chainId?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  fungibleName?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  requestKey?: InputMaybe<Scalars['String']['input']>;
};

export type QueryBlocksFromDepthConnection = {
  __typename?: 'QueryBlocksFromDepthConnection';
  edges: Array<QueryBlocksFromDepthConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryBlocksFromDepthConnectionEdge = {
  __typename?: 'QueryBlocksFromDepthConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Block;
};

export type QueryBlocksFromHeightConnection = {
  __typename?: 'QueryBlocksFromHeightConnection';
  edges: Array<QueryBlocksFromHeightConnectionEdge>;
  pageInfo: PageInfo;
};

export type QueryBlocksFromHeightConnectionEdge = {
  __typename?: 'QueryBlocksFromHeightConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Block;
};

export type QueryCompletedBlockHeightsConnection = {
  __typename?: 'QueryCompletedBlockHeightsConnection';
  edges: Array<Maybe<QueryCompletedBlockHeightsConnectionEdge>>;
  pageInfo: PageInfo;
};

export type QueryCompletedBlockHeightsConnectionEdge = {
  __typename?: 'QueryCompletedBlockHeightsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Block;
};

export type QueryEventsConnection = {
  __typename?: 'QueryEventsConnection';
  edges: Array<QueryEventsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryEventsConnectionEdge = {
  __typename?: 'QueryEventsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Event;
};

export type QueryPoolsConnection = {
  __typename?: 'QueryPoolsConnection';
  edges: Array<QueryPoolsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryPoolsConnectionEdge = {
  __typename?: 'QueryPoolsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Pool;
};

export type QueryTokensConnection = {
  __typename?: 'QueryTokensConnection';
  edges: Array<QueryTokensEdge>;
  pageInfo: PageInfo;
};

export type QueryTokensEdge = {
  __typename?: 'QueryTokensEdge';
  cursor: Scalars['String']['output'];
  node: Token;
};

export type QueryTransactionsByPublicKeyConnection = {
  __typename?: 'QueryTransactionsByPublicKeyConnection';
  edges: Array<QueryTransactionsByPublicKeyConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryTransactionsByPublicKeyConnectionEdge = {
  __typename?: 'QueryTransactionsByPublicKeyConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export type QueryTransactionsConnection = {
  __typename?: 'QueryTransactionsConnection';
  edges: Array<QueryTransactionsConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryTransactionsConnectionEdge = {
  __typename?: 'QueryTransactionsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transaction;
};

export type QueryTransfersConnection = {
  __typename?: 'QueryTransfersConnection';
  edges: Array<QueryTransfersConnectionEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type QueryTransfersConnectionEdge = {
  __typename?: 'QueryTransfersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transfer;
};

/** DEPRECATED: a fallthrough IGuard type to cover non-KeysetGuard types. */
export type RawGuard = IGuard & {
  __typename?: 'RawGuard';
  /** @deprecated deprecated, use KeysetGuard.keys */
  keys: Array<Scalars['String']['output']>;
  /** @deprecated deprecated, use KeysetGuard.predicate */
  predicate: Scalars['String']['output'];
  raw: Scalars['String']['output'];
};

/** A signer for a specific transaction. */
export type Signer = Node & {
  __typename?: 'Signer';
  /** The signer for the gas. */
  address?: Maybe<Scalars['String']['output']>;
  clist: Array<TransactionCapability>;
  id: Scalars['ID']['output'];
  orderIndex?: Maybe<Scalars['Int']['output']>;
  pubkey: Scalars['String']['output'];
  /** The signature scheme that was used to sign. */
  scheme?: Maybe<Scalars['String']['output']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  /**
   * Listen for events by qualifiedName (e.g. `coin.TRANSFER`).
   *
   *       The parametersFilter is a stringified JSON object that matches the [JSON object property filters](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#filter-on-object-property) from Prisma.
   *
   *       An example of such a filter parameter value: `events(parametersFilter: "{\"array_starts_with\": \"k:abcdefg\"}")`
   */
  events?: Maybe<Array<Event>>;
  /** Subscribe to new blocks. */
  newBlocks?: Maybe<Array<Block>>;
  /** Subscribe to new blocks from a specific depth. */
  newBlocksFromDepth?: Maybe<Array<Block>>;
  /** Listen for a transaction by request key. */
  transaction?: Maybe<Transaction>;
};

export type SubscriptionEventsArgs = {
  chainId?: InputMaybe<Scalars['String']['input']>;
  minimumDepth?: InputMaybe<Scalars['Int']['input']>;
  parametersFilter?: InputMaybe<Scalars['String']['input']>;
  qualifiedEventName: Scalars['String']['input'];
};

export type SubscriptionNewBlocksArgs = {
  chainIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type SubscriptionNewBlocksFromDepthArgs = {
  chainIds?: InputMaybe<Array<Scalars['String']['input']>>;
  minimumDepth: Scalars['Int']['input'];
};

export type SubscriptionTransactionArgs = {
  chainId?: InputMaybe<Scalars['String']['input']>;
  requestKey: Scalars['String']['input'];
};

/** Time frame for chart data */
export enum TimeFrame {
  /** All available data */
  All = 'ALL',
  /** Last 24 hours */
  Day = 'DAY',
  /** Last 30 days */
  Month = 'MONTH',
  /** Last 7 days */
  Week = 'WEEK',
  /** Last 365 days */
  Year = 'YEAR',
}

export type Token = {
  __typename?: 'Token';
  chainId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

/** A transaction. */
export type Transaction = Node & {
  __typename?: 'Transaction';
  cmd: TransactionCommand;
  hash: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  orphanedTransactions?: Maybe<Array<Maybe<Transaction>>>;
  result: TransactionInfo;
  sigs: Array<TransactionSignature>;
};

/** List of capabilities associated with/installed by this signer. */
export type TransactionCapability = {
  __typename?: 'TransactionCapability';
  args: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

/** A transaction command. */
export type TransactionCommand = {
  __typename?: 'TransactionCommand';
  meta: TransactionMeta;
  /** The network id of the environment. */
  networkId: Scalars['String']['output'];
  nonce: Scalars['String']['output'];
  payload: TransactionPayload;
  signers: Array<Signer>;
};

/** The result of a transaction. */
export type TransactionInfo = TransactionMempoolInfo | TransactionResult;

/** The mempool information. */
export type TransactionMempoolInfo = {
  __typename?: 'TransactionMempoolInfo';
  /** The status of the mempool. */
  status?: Maybe<Scalars['String']['output']>;
};

/** The metadata of a transaction. */
export type TransactionMeta = {
  __typename?: 'TransactionMeta';
  chainId: Scalars['BigInt']['output'];
  creationTime: Scalars['DateTime']['output'];
  gasLimit: Scalars['BigInt']['output'];
  gasPrice: Scalars['Float']['output'];
  sender: Scalars['String']['output'];
  ttl: Scalars['BigInt']['output'];
};

/** The payload of a transaction. */
export type TransactionPayload = ContinuationPayload | ExecutionPayload;

/** The result of a transaction. */
export type TransactionResult = {
  __typename?: 'TransactionResult';
  /** The transaction result when it was successful. Formatted as raw JSON. */
  badResult?: Maybe<Scalars['String']['output']>;
  block: Block;
  /** The JSON stringified continuation in the case that it is a continuation. */
  continuation?: Maybe<Scalars['String']['output']>;
  eventCount?: Maybe<Scalars['BigInt']['output']>;
  events: TransactionResultEventsConnection;
  gas: Scalars['BigInt']['output'];
  /** The transaction result when it was successful. Formatted as raw JSON. */
  goodResult?: Maybe<Scalars['String']['output']>;
  /**
   * The height of the block this transaction belongs to.
   * @deprecated Use `block.height` instead.
   */
  height: Scalars['BigInt']['output'];
  /** Identifier to retrieve the logs for the execution of the transaction. */
  logs?: Maybe<Scalars['String']['output']>;
  /** @deprecated Not used. */
  metadata: Scalars['String']['output'];
  transactionId?: Maybe<Scalars['BigInt']['output']>;
  transfers: TransactionResultTransfersConnection;
};

/** The result of a transaction. */
export type TransactionResultEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** The result of a transaction. */
export type TransactionResultTransfersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type TransactionResultEventsConnection = {
  __typename?: 'TransactionResultEventsConnection';
  edges: Array<Maybe<TransactionResultEventsConnectionEdge>>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TransactionResultEventsConnectionEdge = {
  __typename?: 'TransactionResultEventsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Event;
};

export type TransactionResultTransfersConnection = {
  __typename?: 'TransactionResultTransfersConnection';
  edges: Array<Maybe<TransactionResultTransfersConnectionEdge>>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TransactionResultTransfersConnectionEdge = {
  __typename?: 'TransactionResultTransfersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: Transfer;
};

/** List of capabilities associated with/installed by this signer. */
export type TransactionSignature = {
  __typename?: 'TransactionSignature';
  sig: Scalars['String']['output'];
};

/** A transfer of funds from a fungible between two accounts. */
export type Transfer = Node & {
  __typename?: 'Transfer';
  amount: Scalars['Decimal']['output'];
  block: Block;
  /** @deprecated Use `block.hash` field instead. */
  blockHash: Scalars['String']['output'];
  /** @deprecated Use `block.chainId` field instead. */
  chainId: Scalars['BigInt']['output'];
  creationTime: Scalars['DateTime']['output'];
  /** The counterpart of the crosschain-transfer. `null` when it is not a cross-chain-transfer. */
  crossChainTransfer?: Maybe<Transfer>;
  /** @deprecated Use `block.height` field instead. */
  height: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  moduleHash: Scalars['String']['output'];
  moduleName: Scalars['String']['output'];
  /** The order of the transfer when it is a `defpact` (multi-step transaction) execution. */
  orderIndex: Scalars['BigInt']['output'];
  receiverAccount: Scalars['String']['output'];
  requestKey: Scalars['String']['output'];
  senderAccount: Scalars['String']['output'];
  /** The transaction that initiated this transfer. */
  transaction?: Maybe<Transaction>;
};

export type UserGuard = IGuard & {
  __typename?: 'UserGuard';
  args: Array<Scalars['String']['output']>;
  fun: Scalars['String']['output'];
  /** @deprecated deprecated, use KeysetGuard.keys */
  keys: Array<Scalars['String']['output']>;
  /** @deprecated deprecated, use KeysetGuard.predicate */
  predicate: Scalars['String']['output'];
  raw: Scalars['String']['output'];
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = {
  TransactionInfo:
    | TransactionMempoolInfo
    | (Omit<TransactionResult, 'block' | 'events' | 'transfers'> & {
        block: _RefType['Block'];
        events: _RefType['TransactionResultEventsConnection'];
        transfers: _RefType['TransactionResultTransfersConnection'];
      });
  TransactionPayload: ContinuationPayload | ExecutionPayload;
};

/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
  IGuard: KeysetGuard | RawGuard | UserGuard;
  Node:
    | (Omit<Block, 'events' | 'minerAccount' | 'parent' | 'transactions'> & {
        events: _RefType['BlockEventsConnection'];
        minerAccount: _RefType['FungibleChainAccount'];
        parent?: Maybe<_RefType['Block']>;
        transactions: _RefType['BlockTransactionsConnection'];
      })
    | (Omit<Event, 'block' | 'transaction'> & {
        block: _RefType['Block'];
        transaction?: Maybe<_RefType['Transaction']>;
      })
    | (Omit<FungibleAccount, 'chainAccounts' | 'transactions' | 'transfers'> & {
        chainAccounts: Array<_RefType['FungibleChainAccount']>;
        transactions: _RefType['FungibleAccountTransactionsConnection'];
        transfers: _RefType['FungibleAccountTransfersConnection'];
      })
    | (Omit<FungibleChainAccount, 'guard' | 'transactions' | 'transfers'> & {
        guard: _RefType['IGuard'];
        transactions: _RefType['FungibleChainAccountTransactionsConnection'];
        transfers: _RefType['FungibleChainAccountTransfersConnection'];
      })
    | (Omit<NonFungibleAccount, 'chainAccounts' | 'nonFungibleTokenBalances' | 'transactions'> & {
        chainAccounts: Array<_RefType['NonFungibleChainAccount']>;
        nonFungibleTokenBalances: Array<_RefType['NonFungibleTokenBalance']>;
        transactions: _RefType['NonFungibleAccountTransactionsConnection'];
      })
    | (Omit<NonFungibleChainAccount, 'nonFungibleTokenBalances' | 'transactions'> & {
        nonFungibleTokenBalances: Array<_RefType['NonFungibleTokenBalance']>;
        transactions: _RefType['NonFungibleChainAccountTransactionsConnection'];
      })
    | (Omit<NonFungibleTokenBalance, 'guard'> & { guard: _RefType['IGuard'] })
    | Pool
    | Signer
    | (Omit<Transaction, 'cmd' | 'orphanedTransactions' | 'result'> & {
        cmd: _RefType['TransactionCommand'];
        orphanedTransactions?: Maybe<Array<Maybe<_RefType['Transaction']>>>;
        result: _RefType['TransactionInfo'];
      })
    | (Omit<Transfer, 'block' | 'crossChainTransfer' | 'transaction'> & {
        block: _RefType['Block'];
        crossChainTransfer?: Maybe<_RefType['Transfer']>;
        transaction?: Maybe<_RefType['Transaction']>;
      });
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  BigInt: ResolverTypeWrapper<Scalars['BigInt']['output']>;
  Block: ResolverTypeWrapper<
    Omit<Block, 'events' | 'minerAccount' | 'parent' | 'transactions'> & {
      events: ResolversTypes['BlockEventsConnection'];
      minerAccount: ResolversTypes['FungibleChainAccount'];
      parent?: Maybe<ResolversTypes['Block']>;
      transactions: ResolversTypes['BlockTransactionsConnection'];
    }
  >;
  BlockEventsConnection: ResolverTypeWrapper<
    Omit<BlockEventsConnection, 'edges'> & {
      edges: Array<ResolversTypes['BlockEventsConnectionEdge']>;
    }
  >;
  BlockEventsConnectionEdge: ResolverTypeWrapper<
    Omit<BlockEventsConnectionEdge, 'node'> & { node: ResolversTypes['Event'] }
  >;
  BlockNeighbor: ResolverTypeWrapper<BlockNeighbor>;
  BlockTransactionsConnection: ResolverTypeWrapper<
    Omit<BlockTransactionsConnection, 'edges'> & {
      edges: Array<ResolversTypes['BlockTransactionsConnectionEdge']>;
    }
  >;
  BlockTransactionsConnectionEdge: ResolverTypeWrapper<
    Omit<BlockTransactionsConnectionEdge, 'node'> & { node: ResolversTypes['Transaction'] }
  >;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ChartDataPoint: ResolverTypeWrapper<ChartDataPoint>;
  ContinuationPayload: ResolverTypeWrapper<ContinuationPayload>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Decimal: ResolverTypeWrapper<Scalars['Decimal']['output']>;
  DexMetrics: ResolverTypeWrapper<DexMetrics>;
  Event: ResolverTypeWrapper<
    Omit<Event, 'block' | 'transaction'> & {
      block: ResolversTypes['Block'];
      transaction?: Maybe<ResolversTypes['Transaction']>;
    }
  >;
  ExecutionPayload: ResolverTypeWrapper<ExecutionPayload>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  FungibleAccount: ResolverTypeWrapper<
    Omit<FungibleAccount, 'chainAccounts' | 'transactions' | 'transfers'> & {
      chainAccounts: Array<ResolversTypes['FungibleChainAccount']>;
      transactions: ResolversTypes['FungibleAccountTransactionsConnection'];
      transfers: ResolversTypes['FungibleAccountTransfersConnection'];
    }
  >;
  FungibleAccountTransactionsConnection: ResolverTypeWrapper<
    Omit<FungibleAccountTransactionsConnection, 'edges'> & {
      edges: Array<ResolversTypes['FungibleAccountTransactionsConnectionEdge']>;
    }
  >;
  FungibleAccountTransactionsConnectionEdge: ResolverTypeWrapper<
    Omit<FungibleAccountTransactionsConnectionEdge, 'node'> & {
      node: ResolversTypes['Transaction'];
    }
  >;
  FungibleAccountTransfersConnection: ResolverTypeWrapper<
    Omit<FungibleAccountTransfersConnection, 'edges'> & {
      edges: Array<ResolversTypes['FungibleAccountTransfersConnectionEdge']>;
    }
  >;
  FungibleAccountTransfersConnectionEdge: ResolverTypeWrapper<
    Omit<FungibleAccountTransfersConnectionEdge, 'node'> & { node: ResolversTypes['Transfer'] }
  >;
  FungibleChainAccount: ResolverTypeWrapper<
    Omit<FungibleChainAccount, 'guard' | 'transactions' | 'transfers'> & {
      guard: ResolversTypes['IGuard'];
      transactions: ResolversTypes['FungibleChainAccountTransactionsConnection'];
      transfers: ResolversTypes['FungibleChainAccountTransfersConnection'];
    }
  >;
  FungibleChainAccountTransactionsConnection: ResolverTypeWrapper<
    Omit<FungibleChainAccountTransactionsConnection, 'edges'> & {
      edges: Array<ResolversTypes['FungibleChainAccountTransactionsConnectionEdge']>;
    }
  >;
  FungibleChainAccountTransactionsConnectionEdge: ResolverTypeWrapper<
    Omit<FungibleChainAccountTransactionsConnectionEdge, 'node'> & {
      node: ResolversTypes['Transaction'];
    }
  >;
  FungibleChainAccountTransfersConnection: ResolverTypeWrapper<
    Omit<FungibleChainAccountTransfersConnection, 'edges'> & {
      edges: Array<ResolversTypes['FungibleChainAccountTransfersConnectionEdge']>;
    }
  >;
  FungibleChainAccountTransfersConnectionEdge: ResolverTypeWrapper<
    Omit<FungibleChainAccountTransfersConnectionEdge, 'node'> & { node: ResolversTypes['Transfer'] }
  >;
  GasLimitEstimation: ResolverTypeWrapper<GasLimitEstimation>;
  GenesisHeight: ResolverTypeWrapper<GenesisHeight>;
  GraphConfiguration: ResolverTypeWrapper<GraphConfiguration>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  IGuard: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['IGuard']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  KeysetGuard: ResolverTypeWrapper<KeysetGuard>;
  LiquidityBalance: ResolverTypeWrapper<LiquidityBalance>;
  LiquidityPosition: ResolverTypeWrapper<LiquidityPosition>;
  LiquidityPositionEdge: ResolverTypeWrapper<LiquidityPositionEdge>;
  LiquidityPositionOrderBy: LiquidityPositionOrderBy;
  LiquidityPositionsConnection: ResolverTypeWrapper<LiquidityPositionsConnection>;
  NetworkInfo: ResolverTypeWrapper<NetworkInfo>;
  Node: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Node']>;
  NonFungibleAccount: ResolverTypeWrapper<
    Omit<NonFungibleAccount, 'chainAccounts' | 'nonFungibleTokenBalances' | 'transactions'> & {
      chainAccounts: Array<ResolversTypes['NonFungibleChainAccount']>;
      nonFungibleTokenBalances: Array<ResolversTypes['NonFungibleTokenBalance']>;
      transactions: ResolversTypes['NonFungibleAccountTransactionsConnection'];
    }
  >;
  NonFungibleAccountTransactionsConnection: ResolverTypeWrapper<
    Omit<NonFungibleAccountTransactionsConnection, 'edges'> & {
      edges: Array<ResolversTypes['NonFungibleAccountTransactionsConnectionEdge']>;
    }
  >;
  NonFungibleAccountTransactionsConnectionEdge: ResolverTypeWrapper<
    Omit<NonFungibleAccountTransactionsConnectionEdge, 'node'> & {
      node: ResolversTypes['Transaction'];
    }
  >;
  NonFungibleChainAccount: ResolverTypeWrapper<
    Omit<NonFungibleChainAccount, 'nonFungibleTokenBalances' | 'transactions'> & {
      nonFungibleTokenBalances: Array<ResolversTypes['NonFungibleTokenBalance']>;
      transactions: ResolversTypes['NonFungibleChainAccountTransactionsConnection'];
    }
  >;
  NonFungibleChainAccountTransactionsConnection: ResolverTypeWrapper<
    Omit<NonFungibleChainAccountTransactionsConnection, 'edges'> & {
      edges: Array<ResolversTypes['NonFungibleChainAccountTransactionsConnectionEdge']>;
    }
  >;
  NonFungibleChainAccountTransactionsConnectionEdge: ResolverTypeWrapper<
    Omit<NonFungibleChainAccountTransactionsConnectionEdge, 'node'> & {
      node: ResolversTypes['Transaction'];
    }
  >;
  NonFungibleToken: ResolverTypeWrapper<NonFungibleToken>;
  NonFungibleTokenBalance: ResolverTypeWrapper<
    Omit<NonFungibleTokenBalance, 'guard'> & { guard: ResolversTypes['IGuard'] }
  >;
  PactQuery: PactQuery;
  PactQueryData: PactQueryData;
  PactQueryResponse: ResolverTypeWrapper<PactQueryResponse>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Pool: ResolverTypeWrapper<Pool>;
  PoolCharts: ResolverTypeWrapper<PoolCharts>;
  PoolOrderBy: PoolOrderBy;
  PoolTransaction: ResolverTypeWrapper<PoolTransaction>;
  PoolTransactionEdge: ResolverTypeWrapper<PoolTransactionEdge>;
  PoolTransactionType: PoolTransactionType;
  PoolTransactionsConnection: ResolverTypeWrapper<PoolTransactionsConnection>;
  Query: ResolverTypeWrapper<{}>;
  QueryBlocksFromDepthConnection: ResolverTypeWrapper<
    Omit<QueryBlocksFromDepthConnection, 'edges'> & {
      edges: Array<ResolversTypes['QueryBlocksFromDepthConnectionEdge']>;
    }
  >;
  QueryBlocksFromDepthConnectionEdge: ResolverTypeWrapper<
    Omit<QueryBlocksFromDepthConnectionEdge, 'node'> & { node: ResolversTypes['Block'] }
  >;
  QueryBlocksFromHeightConnection: ResolverTypeWrapper<
    Omit<QueryBlocksFromHeightConnection, 'edges'> & {
      edges: Array<ResolversTypes['QueryBlocksFromHeightConnectionEdge']>;
    }
  >;
  QueryBlocksFromHeightConnectionEdge: ResolverTypeWrapper<
    Omit<QueryBlocksFromHeightConnectionEdge, 'node'> & { node: ResolversTypes['Block'] }
  >;
  QueryCompletedBlockHeightsConnection: ResolverTypeWrapper<
    Omit<QueryCompletedBlockHeightsConnection, 'edges'> & {
      edges: Array<Maybe<ResolversTypes['QueryCompletedBlockHeightsConnectionEdge']>>;
    }
  >;
  QueryCompletedBlockHeightsConnectionEdge: ResolverTypeWrapper<
    Omit<QueryCompletedBlockHeightsConnectionEdge, 'node'> & { node: ResolversTypes['Block'] }
  >;
  QueryEventsConnection: ResolverTypeWrapper<
    Omit<QueryEventsConnection, 'edges'> & {
      edges: Array<ResolversTypes['QueryEventsConnectionEdge']>;
    }
  >;
  QueryEventsConnectionEdge: ResolverTypeWrapper<
    Omit<QueryEventsConnectionEdge, 'node'> & { node: ResolversTypes['Event'] }
  >;
  QueryPoolsConnection: ResolverTypeWrapper<QueryPoolsConnection>;
  QueryPoolsConnectionEdge: ResolverTypeWrapper<QueryPoolsConnectionEdge>;
  QueryTokensConnection: ResolverTypeWrapper<QueryTokensConnection>;
  QueryTokensEdge: ResolverTypeWrapper<QueryTokensEdge>;
  QueryTransactionsByPublicKeyConnection: ResolverTypeWrapper<
    Omit<QueryTransactionsByPublicKeyConnection, 'edges'> & {
      edges: Array<ResolversTypes['QueryTransactionsByPublicKeyConnectionEdge']>;
    }
  >;
  QueryTransactionsByPublicKeyConnectionEdge: ResolverTypeWrapper<
    Omit<QueryTransactionsByPublicKeyConnectionEdge, 'node'> & {
      node: ResolversTypes['Transaction'];
    }
  >;
  QueryTransactionsConnection: ResolverTypeWrapper<
    Omit<QueryTransactionsConnection, 'edges'> & {
      edges: Array<ResolversTypes['QueryTransactionsConnectionEdge']>;
    }
  >;
  QueryTransactionsConnectionEdge: ResolverTypeWrapper<
    Omit<QueryTransactionsConnectionEdge, 'node'> & { node: ResolversTypes['Transaction'] }
  >;
  QueryTransfersConnection: ResolverTypeWrapper<
    Omit<QueryTransfersConnection, 'edges'> & {
      edges: Array<ResolversTypes['QueryTransfersConnectionEdge']>;
    }
  >;
  QueryTransfersConnectionEdge: ResolverTypeWrapper<
    Omit<QueryTransfersConnectionEdge, 'node'> & { node: ResolversTypes['Transfer'] }
  >;
  RawGuard: ResolverTypeWrapper<RawGuard>;
  Signer: ResolverTypeWrapper<Signer>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  TimeFrame: TimeFrame;
  Token: ResolverTypeWrapper<Token>;
  Transaction: ResolverTypeWrapper<
    Omit<Transaction, 'cmd' | 'orphanedTransactions' | 'result'> & {
      cmd: ResolversTypes['TransactionCommand'];
      orphanedTransactions?: Maybe<Array<Maybe<ResolversTypes['Transaction']>>>;
      result: ResolversTypes['TransactionInfo'];
    }
  >;
  TransactionCapability: ResolverTypeWrapper<TransactionCapability>;
  TransactionCommand: ResolverTypeWrapper<
    Omit<TransactionCommand, 'meta' | 'payload'> & {
      meta: ResolversTypes['TransactionMeta'];
      payload: ResolversTypes['TransactionPayload'];
    }
  >;
  TransactionInfo: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['TransactionInfo']>;
  TransactionMempoolInfo: ResolverTypeWrapper<TransactionMempoolInfo>;
  TransactionMeta: ResolverTypeWrapper<TransactionMeta>;
  TransactionPayload: ResolverTypeWrapper<
    ResolversUnionTypes<ResolversTypes>['TransactionPayload']
  >;
  TransactionResult: ResolverTypeWrapper<
    Omit<TransactionResult, 'block' | 'events' | 'transfers'> & {
      block: ResolversTypes['Block'];
      events: ResolversTypes['TransactionResultEventsConnection'];
      transfers: ResolversTypes['TransactionResultTransfersConnection'];
    }
  >;
  TransactionResultEventsConnection: ResolverTypeWrapper<
    Omit<TransactionResultEventsConnection, 'edges'> & {
      edges: Array<Maybe<ResolversTypes['TransactionResultEventsConnectionEdge']>>;
    }
  >;
  TransactionResultEventsConnectionEdge: ResolverTypeWrapper<
    Omit<TransactionResultEventsConnectionEdge, 'node'> & { node: ResolversTypes['Event'] }
  >;
  TransactionResultTransfersConnection: ResolverTypeWrapper<
    Omit<TransactionResultTransfersConnection, 'edges'> & {
      edges: Array<Maybe<ResolversTypes['TransactionResultTransfersConnectionEdge']>>;
    }
  >;
  TransactionResultTransfersConnectionEdge: ResolverTypeWrapper<
    Omit<TransactionResultTransfersConnectionEdge, 'node'> & { node: ResolversTypes['Transfer'] }
  >;
  TransactionSignature: ResolverTypeWrapper<TransactionSignature>;
  Transfer: ResolverTypeWrapper<
    Omit<Transfer, 'block' | 'crossChainTransfer' | 'transaction'> & {
      block: ResolversTypes['Block'];
      crossChainTransfer?: Maybe<ResolversTypes['Transfer']>;
      transaction?: Maybe<ResolversTypes['Transaction']>;
    }
  >;
  UserGuard: ResolverTypeWrapper<UserGuard>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  BigInt: Scalars['BigInt']['output'];
  Block: Omit<Block, 'events' | 'minerAccount' | 'parent' | 'transactions'> & {
    events: ResolversParentTypes['BlockEventsConnection'];
    minerAccount: ResolversParentTypes['FungibleChainAccount'];
    parent?: Maybe<ResolversParentTypes['Block']>;
    transactions: ResolversParentTypes['BlockTransactionsConnection'];
  };
  BlockEventsConnection: Omit<BlockEventsConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['BlockEventsConnectionEdge']>;
  };
  BlockEventsConnectionEdge: Omit<BlockEventsConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Event'];
  };
  BlockNeighbor: BlockNeighbor;
  BlockTransactionsConnection: Omit<BlockTransactionsConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['BlockTransactionsConnectionEdge']>;
  };
  BlockTransactionsConnectionEdge: Omit<BlockTransactionsConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Transaction'];
  };
  Boolean: Scalars['Boolean']['output'];
  ChartDataPoint: ChartDataPoint;
  ContinuationPayload: ContinuationPayload;
  DateTime: Scalars['DateTime']['output'];
  Decimal: Scalars['Decimal']['output'];
  DexMetrics: DexMetrics;
  Event: Omit<Event, 'block' | 'transaction'> & {
    block: ResolversParentTypes['Block'];
    transaction?: Maybe<ResolversParentTypes['Transaction']>;
  };
  ExecutionPayload: ExecutionPayload;
  Float: Scalars['Float']['output'];
  FungibleAccount: Omit<FungibleAccount, 'chainAccounts' | 'transactions' | 'transfers'> & {
    chainAccounts: Array<ResolversParentTypes['FungibleChainAccount']>;
    transactions: ResolversParentTypes['FungibleAccountTransactionsConnection'];
    transfers: ResolversParentTypes['FungibleAccountTransfersConnection'];
  };
  FungibleAccountTransactionsConnection: Omit<FungibleAccountTransactionsConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['FungibleAccountTransactionsConnectionEdge']>;
  };
  FungibleAccountTransactionsConnectionEdge: Omit<
    FungibleAccountTransactionsConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transaction'] };
  FungibleAccountTransfersConnection: Omit<FungibleAccountTransfersConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['FungibleAccountTransfersConnectionEdge']>;
  };
  FungibleAccountTransfersConnectionEdge: Omit<FungibleAccountTransfersConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Transfer'];
  };
  FungibleChainAccount: Omit<FungibleChainAccount, 'guard' | 'transactions' | 'transfers'> & {
    guard: ResolversParentTypes['IGuard'];
    transactions: ResolversParentTypes['FungibleChainAccountTransactionsConnection'];
    transfers: ResolversParentTypes['FungibleChainAccountTransfersConnection'];
  };
  FungibleChainAccountTransactionsConnection: Omit<
    FungibleChainAccountTransactionsConnection,
    'edges'
  > & { edges: Array<ResolversParentTypes['FungibleChainAccountTransactionsConnectionEdge']> };
  FungibleChainAccountTransactionsConnectionEdge: Omit<
    FungibleChainAccountTransactionsConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transaction'] };
  FungibleChainAccountTransfersConnection: Omit<
    FungibleChainAccountTransfersConnection,
    'edges'
  > & { edges: Array<ResolversParentTypes['FungibleChainAccountTransfersConnectionEdge']> };
  FungibleChainAccountTransfersConnectionEdge: Omit<
    FungibleChainAccountTransfersConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transfer'] };
  GasLimitEstimation: GasLimitEstimation;
  GenesisHeight: GenesisHeight;
  GraphConfiguration: GraphConfiguration;
  ID: Scalars['ID']['output'];
  IGuard: ResolversInterfaceTypes<ResolversParentTypes>['IGuard'];
  Int: Scalars['Int']['output'];
  KeysetGuard: KeysetGuard;
  LiquidityBalance: LiquidityBalance;
  LiquidityPosition: LiquidityPosition;
  LiquidityPositionEdge: LiquidityPositionEdge;
  LiquidityPositionsConnection: LiquidityPositionsConnection;
  NetworkInfo: NetworkInfo;
  Node: ResolversInterfaceTypes<ResolversParentTypes>['Node'];
  NonFungibleAccount: Omit<
    NonFungibleAccount,
    'chainAccounts' | 'nonFungibleTokenBalances' | 'transactions'
  > & {
    chainAccounts: Array<ResolversParentTypes['NonFungibleChainAccount']>;
    nonFungibleTokenBalances: Array<ResolversParentTypes['NonFungibleTokenBalance']>;
    transactions: ResolversParentTypes['NonFungibleAccountTransactionsConnection'];
  };
  NonFungibleAccountTransactionsConnection: Omit<
    NonFungibleAccountTransactionsConnection,
    'edges'
  > & { edges: Array<ResolversParentTypes['NonFungibleAccountTransactionsConnectionEdge']> };
  NonFungibleAccountTransactionsConnectionEdge: Omit<
    NonFungibleAccountTransactionsConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transaction'] };
  NonFungibleChainAccount: Omit<
    NonFungibleChainAccount,
    'nonFungibleTokenBalances' | 'transactions'
  > & {
    nonFungibleTokenBalances: Array<ResolversParentTypes['NonFungibleTokenBalance']>;
    transactions: ResolversParentTypes['NonFungibleChainAccountTransactionsConnection'];
  };
  NonFungibleChainAccountTransactionsConnection: Omit<
    NonFungibleChainAccountTransactionsConnection,
    'edges'
  > & { edges: Array<ResolversParentTypes['NonFungibleChainAccountTransactionsConnectionEdge']> };
  NonFungibleChainAccountTransactionsConnectionEdge: Omit<
    NonFungibleChainAccountTransactionsConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transaction'] };
  NonFungibleToken: NonFungibleToken;
  NonFungibleTokenBalance: Omit<NonFungibleTokenBalance, 'guard'> & {
    guard: ResolversParentTypes['IGuard'];
  };
  PactQuery: PactQuery;
  PactQueryData: PactQueryData;
  PactQueryResponse: PactQueryResponse;
  PageInfo: PageInfo;
  Pool: Pool;
  PoolCharts: PoolCharts;
  PoolTransaction: PoolTransaction;
  PoolTransactionEdge: PoolTransactionEdge;
  PoolTransactionsConnection: PoolTransactionsConnection;
  Query: {};
  QueryBlocksFromDepthConnection: Omit<QueryBlocksFromDepthConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['QueryBlocksFromDepthConnectionEdge']>;
  };
  QueryBlocksFromDepthConnectionEdge: Omit<QueryBlocksFromDepthConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Block'];
  };
  QueryBlocksFromHeightConnection: Omit<QueryBlocksFromHeightConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['QueryBlocksFromHeightConnectionEdge']>;
  };
  QueryBlocksFromHeightConnectionEdge: Omit<QueryBlocksFromHeightConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Block'];
  };
  QueryCompletedBlockHeightsConnection: Omit<QueryCompletedBlockHeightsConnection, 'edges'> & {
    edges: Array<Maybe<ResolversParentTypes['QueryCompletedBlockHeightsConnectionEdge']>>;
  };
  QueryCompletedBlockHeightsConnectionEdge: Omit<
    QueryCompletedBlockHeightsConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Block'] };
  QueryEventsConnection: Omit<QueryEventsConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['QueryEventsConnectionEdge']>;
  };
  QueryEventsConnectionEdge: Omit<QueryEventsConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Event'];
  };
  QueryPoolsConnection: QueryPoolsConnection;
  QueryPoolsConnectionEdge: QueryPoolsConnectionEdge;
  QueryTokensConnection: QueryTokensConnection;
  QueryTokensEdge: QueryTokensEdge;
  QueryTransactionsByPublicKeyConnection: Omit<QueryTransactionsByPublicKeyConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['QueryTransactionsByPublicKeyConnectionEdge']>;
  };
  QueryTransactionsByPublicKeyConnectionEdge: Omit<
    QueryTransactionsByPublicKeyConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transaction'] };
  QueryTransactionsConnection: Omit<QueryTransactionsConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['QueryTransactionsConnectionEdge']>;
  };
  QueryTransactionsConnectionEdge: Omit<QueryTransactionsConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Transaction'];
  };
  QueryTransfersConnection: Omit<QueryTransfersConnection, 'edges'> & {
    edges: Array<ResolversParentTypes['QueryTransfersConnectionEdge']>;
  };
  QueryTransfersConnectionEdge: Omit<QueryTransfersConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Transfer'];
  };
  RawGuard: RawGuard;
  Signer: Signer;
  String: Scalars['String']['output'];
  Subscription: {};
  Token: Token;
  Transaction: Omit<Transaction, 'cmd' | 'orphanedTransactions' | 'result'> & {
    cmd: ResolversParentTypes['TransactionCommand'];
    orphanedTransactions?: Maybe<Array<Maybe<ResolversParentTypes['Transaction']>>>;
    result: ResolversParentTypes['TransactionInfo'];
  };
  TransactionCapability: TransactionCapability;
  TransactionCommand: Omit<TransactionCommand, 'meta' | 'payload'> & {
    meta: ResolversParentTypes['TransactionMeta'];
    payload: ResolversParentTypes['TransactionPayload'];
  };
  TransactionInfo: ResolversUnionTypes<ResolversParentTypes>['TransactionInfo'];
  TransactionMempoolInfo: TransactionMempoolInfo;
  TransactionMeta: TransactionMeta;
  TransactionPayload: ResolversUnionTypes<ResolversParentTypes>['TransactionPayload'];
  TransactionResult: Omit<TransactionResult, 'block' | 'events' | 'transfers'> & {
    block: ResolversParentTypes['Block'];
    events: ResolversParentTypes['TransactionResultEventsConnection'];
    transfers: ResolversParentTypes['TransactionResultTransfersConnection'];
  };
  TransactionResultEventsConnection: Omit<TransactionResultEventsConnection, 'edges'> & {
    edges: Array<Maybe<ResolversParentTypes['TransactionResultEventsConnectionEdge']>>;
  };
  TransactionResultEventsConnectionEdge: Omit<TransactionResultEventsConnectionEdge, 'node'> & {
    node: ResolversParentTypes['Event'];
  };
  TransactionResultTransfersConnection: Omit<TransactionResultTransfersConnection, 'edges'> & {
    edges: Array<Maybe<ResolversParentTypes['TransactionResultTransfersConnectionEdge']>>;
  };
  TransactionResultTransfersConnectionEdge: Omit<
    TransactionResultTransfersConnectionEdge,
    'node'
  > & { node: ResolversParentTypes['Transfer'] };
  TransactionSignature: TransactionSignature;
  Transfer: Omit<Transfer, 'block' | 'crossChainTransfer' | 'transaction'> & {
    block: ResolversParentTypes['Block'];
    crossChainTransfer?: Maybe<ResolversParentTypes['Transfer']>;
    transaction?: Maybe<ResolversParentTypes['Transaction']>;
  };
  UserGuard: UserGuard;
};

export type ComplexityDirectiveArgs = {
  multipliers?: Maybe<Array<Scalars['String']['input']>>;
  value: Scalars['Int']['input'];
};

export type ComplexityDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = ComplexityDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export type BlockResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Block'] = ResolversParentTypes['Block'],
> = {
  chainId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  creationTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  difficulty?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  epoch?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  events?: Resolver<
    ResolversTypes['BlockEventsConnection'],
    ParentType,
    ContextType,
    Partial<BlockEventsArgs>
  >;
  flags?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  height?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  minerAccount?: Resolver<ResolversTypes['FungibleChainAccount'], ParentType, ContextType>;
  neighbors?: Resolver<Array<ResolversTypes['BlockNeighbor']>, ParentType, ContextType>;
  nonce?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  parent?: Resolver<Maybe<ResolversTypes['Block']>, ParentType, ContextType>;
  payloadHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  powHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  target?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transactions?: Resolver<
    ResolversTypes['BlockTransactionsConnection'],
    ParentType,
    ContextType,
    Partial<BlockTransactionsArgs>
  >;
  weight?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockEventsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['BlockEventsConnection'] = ResolversParentTypes['BlockEventsConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['BlockEventsConnectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockEventsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['BlockEventsConnectionEdge'] = ResolversParentTypes['BlockEventsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockNeighborResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['BlockNeighbor'] = ResolversParentTypes['BlockNeighbor'],
> = {
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['BlockTransactionsConnection'] = ResolversParentTypes['BlockTransactionsConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['BlockTransactionsConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockTransactionsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['BlockTransactionsConnectionEdge'] = ResolversParentTypes['BlockTransactionsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ChartDataPointResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['ChartDataPoint'] = ResolversParentTypes['ChartDataPoint'],
> = {
  timestamp?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ContinuationPayloadResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['ContinuationPayload'] = ResolversParentTypes['ContinuationPayload'],
> = {
  data?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pactId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  proof?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rollback?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  step?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface DecimalScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['Decimal'], any> {
  name: 'Decimal';
}

export type DexMetricsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['DexMetrics'] = ResolversParentTypes['DexMetrics'],
> = {
  currentTvlUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  totalPools?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalVolumeUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  tvlHistory?: Resolver<Array<ResolversTypes['ChartDataPoint']>, ParentType, ContextType>;
  volumeHistory?: Resolver<Array<ResolversTypes['ChartDataPoint']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event'],
> = {
  block?: Resolver<ResolversTypes['Block'], ParentType, ContextType>;
  chainId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  height?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  moduleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orderIndex?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  parameterText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  parameters?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  qualifiedName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transaction?: Resolver<Maybe<ResolversTypes['Transaction']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExecutionPayloadResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['ExecutionPayload'] = ResolversParentTypes['ExecutionPayload'],
> = {
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  data?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleAccountResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleAccount'] = ResolversParentTypes['FungibleAccount'],
> = {
  accountName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chainAccounts?: Resolver<Array<ResolversTypes['FungibleChainAccount']>, ParentType, ContextType>;
  fungibleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  totalBalance?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  transactions?: Resolver<
    ResolversTypes['FungibleAccountTransactionsConnection'],
    ParentType,
    ContextType,
    Partial<FungibleAccountTransactionsArgs>
  >;
  transfers?: Resolver<
    ResolversTypes['FungibleAccountTransfersConnection'],
    ParentType,
    ContextType,
    Partial<FungibleAccountTransfersArgs>
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleAccountTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleAccountTransactionsConnection'] = ResolversParentTypes['FungibleAccountTransactionsConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['FungibleAccountTransactionsConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleAccountTransactionsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleAccountTransactionsConnectionEdge'] = ResolversParentTypes['FungibleAccountTransactionsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleAccountTransfersConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleAccountTransfersConnection'] = ResolversParentTypes['FungibleAccountTransfersConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['FungibleAccountTransfersConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleAccountTransfersConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleAccountTransfersConnectionEdge'] = ResolversParentTypes['FungibleAccountTransfersConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transfer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleChainAccountResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleChainAccount'] = ResolversParentTypes['FungibleChainAccount'],
> = {
  accountName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  balance?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  fungibleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guard?: Resolver<ResolversTypes['IGuard'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  transactions?: Resolver<
    ResolversTypes['FungibleChainAccountTransactionsConnection'],
    ParentType,
    ContextType,
    Partial<FungibleChainAccountTransactionsArgs>
  >;
  transfers?: Resolver<
    ResolversTypes['FungibleChainAccountTransfersConnection'],
    ParentType,
    ContextType,
    Partial<FungibleChainAccountTransfersArgs>
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleChainAccountTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleChainAccountTransactionsConnection'] = ResolversParentTypes['FungibleChainAccountTransactionsConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['FungibleChainAccountTransactionsConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleChainAccountTransactionsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleChainAccountTransactionsConnectionEdge'] = ResolversParentTypes['FungibleChainAccountTransactionsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleChainAccountTransfersConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleChainAccountTransfersConnection'] = ResolversParentTypes['FungibleChainAccountTransfersConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['FungibleChainAccountTransfersConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FungibleChainAccountTransfersConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['FungibleChainAccountTransfersConnectionEdge'] = ResolversParentTypes['FungibleChainAccountTransfersConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transfer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GasLimitEstimationResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['GasLimitEstimation'] = ResolversParentTypes['GasLimitEstimation'],
> = {
  amount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  inputType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transaction?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  usedPreflight?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  usedSignatureVerification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenesisHeightResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['GenesisHeight'] = ResolversParentTypes['GenesisHeight'],
> = {
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  height?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GraphConfigurationResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['GraphConfiguration'] = ResolversParentTypes['GraphConfiguration'],
> = {
  minimumBlockHeight?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IGuardResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['IGuard'] = ResolversParentTypes['IGuard'],
> = {
  __resolveType: TypeResolveFn<'KeysetGuard' | 'RawGuard' | 'UserGuard', ParentType, ContextType>;
  keys?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  predicate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type KeysetGuardResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['KeysetGuard'] = ResolversParentTypes['KeysetGuard'],
> = {
  keys?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  predicate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidityBalanceResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['LiquidityBalance'] = ResolversParentTypes['LiquidityBalance'],
> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pair?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  pairId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  walletAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidityPositionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['LiquidityPosition'] = ResolversParentTypes['LiquidityPosition'],
> = {
  apr24h?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  liquidity?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pair?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  pairId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  valueUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  walletAddress?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidityPositionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['LiquidityPositionEdge'] = ResolversParentTypes['LiquidityPositionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['LiquidityPosition'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LiquidityPositionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['LiquidityPositionsConnection'] = ResolversParentTypes['LiquidityPositionsConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['LiquidityPositionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NetworkInfoResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['NetworkInfo'] = ResolversParentTypes['NetworkInfo'],
> = {
  apiVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  coinsInCirculation?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  genesisHeights?: Resolver<Array<ResolversTypes['GenesisHeight']>, ParentType, ContextType>;
  networkHashRate?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  networkHost?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  networkId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodeBlockDelay?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  nodeChains?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  nodeLatestBehaviorHeight?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  nodePackageVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nodeServiceDate?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  numberOfChains?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  totalDifficulty?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  transactionCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NodeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node'],
> = {
  __resolveType: TypeResolveFn<
    | 'Block'
    | 'Event'
    | 'FungibleAccount'
    | 'FungibleChainAccount'
    | 'NonFungibleAccount'
    | 'NonFungibleChainAccount'
    | 'NonFungibleTokenBalance'
    | 'Pool'
    | 'Signer'
    | 'Transaction'
    | 'Transfer',
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
};

export type NonFungibleAccountResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleAccount'] = ResolversParentTypes['NonFungibleAccount'],
> = {
  accountName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chainAccounts?: Resolver<
    Array<ResolversTypes['NonFungibleChainAccount']>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nonFungibleTokenBalances?: Resolver<
    Array<ResolversTypes['NonFungibleTokenBalance']>,
    ParentType,
    ContextType
  >;
  transactions?: Resolver<
    ResolversTypes['NonFungibleAccountTransactionsConnection'],
    ParentType,
    ContextType,
    Partial<NonFungibleAccountTransactionsArgs>
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleAccountTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleAccountTransactionsConnection'] = ResolversParentTypes['NonFungibleAccountTransactionsConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['NonFungibleAccountTransactionsConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleAccountTransactionsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleAccountTransactionsConnectionEdge'] = ResolversParentTypes['NonFungibleAccountTransactionsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleChainAccountResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleChainAccount'] = ResolversParentTypes['NonFungibleChainAccount'],
> = {
  accountName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nonFungibleTokenBalances?: Resolver<
    Array<ResolversTypes['NonFungibleTokenBalance']>,
    ParentType,
    ContextType
  >;
  transactions?: Resolver<
    ResolversTypes['NonFungibleChainAccountTransactionsConnection'],
    ParentType,
    ContextType,
    Partial<NonFungibleChainAccountTransactionsArgs>
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleChainAccountTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleChainAccountTransactionsConnection'] = ResolversParentTypes['NonFungibleChainAccountTransactionsConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['NonFungibleChainAccountTransactionsConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleChainAccountTransactionsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleChainAccountTransactionsConnectionEdge'] = ResolversParentTypes['NonFungibleChainAccountTransactionsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleTokenResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleToken'] = ResolversParentTypes['NonFungibleToken'],
> = {
  precision?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  supply?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  uri?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NonFungibleTokenBalanceResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['NonFungibleTokenBalance'] = ResolversParentTypes['NonFungibleTokenBalance'],
> = {
  accountName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  balance?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  guard?: Resolver<ResolversTypes['IGuard'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  info?: Resolver<Maybe<ResolversTypes['NonFungibleToken']>, ParentType, ContextType>;
  tokenId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PactQueryResponseResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['PactQueryResponse'] = ResolversParentTypes['PactQueryResponse'],
> = {
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo'],
> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Pool'] = ResolversParentTypes['Pool'],
> = {
  address?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  apr24h?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  charts?: Resolver<
    ResolversTypes['PoolCharts'],
    ParentType,
    ContextType,
    RequireFields<PoolChartsArgs, 'timeFrame'>
  >;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  fees24hUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  feesChange24h?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reserve0?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reserve1?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token0?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  token1?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  totalSupply?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transactionCount24h?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  transactionCountChange24h?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  transactions?: Resolver<
    Maybe<ResolversTypes['PoolTransactionsConnection']>,
    ParentType,
    ContextType,
    Partial<PoolTransactionsArgs>
  >;
  tvlChange24h?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  tvlUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  volume7dUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  volume24hUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  volumeChange24h?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolChartsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PoolCharts'] = ResolversParentTypes['PoolCharts'],
> = {
  fees?: Resolver<Array<ResolversTypes['ChartDataPoint']>, ParentType, ContextType>;
  tvl?: Resolver<Array<ResolversTypes['ChartDataPoint']>, ParentType, ContextType>;
  volume?: Resolver<Array<ResolversTypes['ChartDataPoint']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolTransactionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['PoolTransaction'] = ResolversParentTypes['PoolTransaction'],
> = {
  amount0In?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  amount0Out?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  amount1In?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  amount1Out?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  amountUsd?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  maker?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestkey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  transactionId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  transactionType?: Resolver<ResolversTypes['PoolTransactionType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolTransactionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['PoolTransactionEdge'] = ResolversParentTypes['PoolTransactionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['PoolTransaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PoolTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['PoolTransactionsConnection'] = ResolversParentTypes['PoolTransactionsConnection'],
> = {
  edges?: Resolver<Maybe<Array<ResolversTypes['PoolTransactionEdge']>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  block?: Resolver<
    Maybe<ResolversTypes['Block']>,
    ParentType,
    ContextType,
    RequireFields<QueryBlockArgs, 'hash'>
  >;
  blocksFromDepth?: Resolver<
    Maybe<ResolversTypes['QueryBlocksFromDepthConnection']>,
    ParentType,
    ContextType,
    RequireFields<QueryBlocksFromDepthArgs, 'minimumDepth'>
  >;
  blocksFromHeight?: Resolver<
    ResolversTypes['QueryBlocksFromHeightConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryBlocksFromHeightArgs, 'startHeight'>
  >;
  completedBlockHeights?: Resolver<
    ResolversTypes['QueryCompletedBlockHeightsConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryCompletedBlockHeightsArgs, 'completedHeights' | 'heightCount'>
  >;
  dexMetrics?: Resolver<
    ResolversTypes['DexMetrics'],
    ParentType,
    ContextType,
    Partial<QueryDexMetricsArgs>
  >;
  events?: Resolver<
    ResolversTypes['QueryEventsConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryEventsArgs, 'qualifiedEventName'>
  >;
  fungibleAccount?: Resolver<
    Maybe<ResolversTypes['FungibleAccount']>,
    ParentType,
    ContextType,
    RequireFields<QueryFungibleAccountArgs, 'accountName' | 'fungibleName'>
  >;
  fungibleAccountsByPublicKey?: Resolver<
    Array<ResolversTypes['FungibleAccount']>,
    ParentType,
    ContextType,
    RequireFields<QueryFungibleAccountsByPublicKeyArgs, 'fungibleName' | 'publicKey'>
  >;
  fungibleChainAccount?: Resolver<
    Maybe<ResolversTypes['FungibleChainAccount']>,
    ParentType,
    ContextType,
    RequireFields<QueryFungibleChainAccountArgs, 'accountName' | 'chainId' | 'fungibleName'>
  >;
  fungibleChainAccounts?: Resolver<
    Maybe<Array<ResolversTypes['FungibleChainAccount']>>,
    ParentType,
    ContextType,
    RequireFields<QueryFungibleChainAccountsArgs, 'accountName' | 'fungibleName'>
  >;
  fungibleChainAccountsByPublicKey?: Resolver<
    Array<ResolversTypes['FungibleChainAccount']>,
    ParentType,
    ContextType,
    RequireFields<
      QueryFungibleChainAccountsByPublicKeyArgs,
      'chainId' | 'fungibleName' | 'publicKey'
    >
  >;
  gasLimitEstimate?: Resolver<
    Array<ResolversTypes['GasLimitEstimation']>,
    ParentType,
    ContextType,
    RequireFields<QueryGasLimitEstimateArgs, 'input'>
  >;
  graphConfiguration?: Resolver<ResolversTypes['GraphConfiguration'], ParentType, ContextType>;
  lastBlockHeight?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  liquidityPositions?: Resolver<
    ResolversTypes['LiquidityPositionsConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryLiquidityPositionsArgs, 'orderBy' | 'walletAddress'>
  >;
  networkInfo?: Resolver<Maybe<ResolversTypes['NetworkInfo']>, ParentType, ContextType>;
  node?: Resolver<
    Maybe<ResolversTypes['Node']>,
    ParentType,
    ContextType,
    RequireFields<QueryNodeArgs, 'id'>
  >;
  nodes?: Resolver<
    Array<Maybe<ResolversTypes['Node']>>,
    ParentType,
    ContextType,
    RequireFields<QueryNodesArgs, 'ids'>
  >;
  nonFungibleAccount?: Resolver<
    Maybe<ResolversTypes['NonFungibleAccount']>,
    ParentType,
    ContextType,
    RequireFields<QueryNonFungibleAccountArgs, 'accountName'>
  >;
  nonFungibleChainAccount?: Resolver<
    Maybe<ResolversTypes['NonFungibleChainAccount']>,
    ParentType,
    ContextType,
    RequireFields<QueryNonFungibleChainAccountArgs, 'accountName' | 'chainId'>
  >;
  pactQuery?: Resolver<
    Array<ResolversTypes['PactQueryResponse']>,
    ParentType,
    ContextType,
    RequireFields<QueryPactQueryArgs, 'pactQuery'>
  >;
  pool?: Resolver<
    Maybe<ResolversTypes['Pool']>,
    ParentType,
    ContextType,
    RequireFields<QueryPoolArgs, 'id'>
  >;
  poolTransactions?: Resolver<
    Maybe<ResolversTypes['PoolTransactionsConnection']>,
    ParentType,
    ContextType,
    RequireFields<QueryPoolTransactionsArgs, 'pairId'>
  >;
  pools?: Resolver<
    ResolversTypes['QueryPoolsConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryPoolsArgs, 'orderBy'>
  >;
  tokens?: Resolver<
    ResolversTypes['QueryTokensConnection'],
    ParentType,
    ContextType,
    Partial<QueryTokensArgs>
  >;
  transaction?: Resolver<
    Maybe<ResolversTypes['Transaction']>,
    ParentType,
    ContextType,
    RequireFields<QueryTransactionArgs, 'requestKey'>
  >;
  transactions?: Resolver<
    ResolversTypes['QueryTransactionsConnection'],
    ParentType,
    ContextType,
    Partial<QueryTransactionsArgs>
  >;
  transactionsByPublicKey?: Resolver<
    ResolversTypes['QueryTransactionsByPublicKeyConnection'],
    ParentType,
    ContextType,
    RequireFields<QueryTransactionsByPublicKeyArgs, 'publicKey'>
  >;
  transfers?: Resolver<
    ResolversTypes['QueryTransfersConnection'],
    ParentType,
    ContextType,
    Partial<QueryTransfersArgs>
  >;
};

export type QueryBlocksFromDepthConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryBlocksFromDepthConnection'] = ResolversParentTypes['QueryBlocksFromDepthConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['QueryBlocksFromDepthConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryBlocksFromDepthConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryBlocksFromDepthConnectionEdge'] = ResolversParentTypes['QueryBlocksFromDepthConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Block'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryBlocksFromHeightConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryBlocksFromHeightConnection'] = ResolversParentTypes['QueryBlocksFromHeightConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['QueryBlocksFromHeightConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryBlocksFromHeightConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryBlocksFromHeightConnectionEdge'] = ResolversParentTypes['QueryBlocksFromHeightConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Block'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryCompletedBlockHeightsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryCompletedBlockHeightsConnection'] = ResolversParentTypes['QueryCompletedBlockHeightsConnection'],
> = {
  edges?: Resolver<
    Array<Maybe<ResolversTypes['QueryCompletedBlockHeightsConnectionEdge']>>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryCompletedBlockHeightsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryCompletedBlockHeightsConnectionEdge'] = ResolversParentTypes['QueryCompletedBlockHeightsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Block'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryEventsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryEventsConnection'] = ResolversParentTypes['QueryEventsConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['QueryEventsConnectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryEventsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryEventsConnectionEdge'] = ResolversParentTypes['QueryEventsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryPoolsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryPoolsConnection'] = ResolversParentTypes['QueryPoolsConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['QueryPoolsConnectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryPoolsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryPoolsConnectionEdge'] = ResolversParentTypes['QueryPoolsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Pool'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTokensConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTokensConnection'] = ResolversParentTypes['QueryTokensConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['QueryTokensEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTokensEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTokensEdge'] = ResolversParentTypes['QueryTokensEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Token'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTransactionsByPublicKeyConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTransactionsByPublicKeyConnection'] = ResolversParentTypes['QueryTransactionsByPublicKeyConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['QueryTransactionsByPublicKeyConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTransactionsByPublicKeyConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTransactionsByPublicKeyConnectionEdge'] = ResolversParentTypes['QueryTransactionsByPublicKeyConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTransactionsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTransactionsConnection'] = ResolversParentTypes['QueryTransactionsConnection'],
> = {
  edges?: Resolver<
    Array<ResolversTypes['QueryTransactionsConnectionEdge']>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTransactionsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTransactionsConnectionEdge'] = ResolversParentTypes['QueryTransactionsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTransfersConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTransfersConnection'] = ResolversParentTypes['QueryTransfersConnection'],
> = {
  edges?: Resolver<Array<ResolversTypes['QueryTransfersConnectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryTransfersConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['QueryTransfersConnectionEdge'] = ResolversParentTypes['QueryTransfersConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transfer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RawGuardResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['RawGuard'] = ResolversParentTypes['RawGuard'],
> = {
  keys?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  predicate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignerResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Signer'] = ResolversParentTypes['Signer'],
> = {
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  clist?: Resolver<Array<ResolversTypes['TransactionCapability']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  orderIndex?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  pubkey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scheme?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription'],
> = {
  events?: SubscriptionResolver<
    Maybe<Array<ResolversTypes['Event']>>,
    'events',
    ParentType,
    ContextType,
    RequireFields<SubscriptionEventsArgs, 'qualifiedEventName'>
  >;
  newBlocks?: SubscriptionResolver<
    Maybe<Array<ResolversTypes['Block']>>,
    'newBlocks',
    ParentType,
    ContextType,
    Partial<SubscriptionNewBlocksArgs>
  >;
  newBlocksFromDepth?: SubscriptionResolver<
    Maybe<Array<ResolversTypes['Block']>>,
    'newBlocksFromDepth',
    ParentType,
    ContextType,
    RequireFields<SubscriptionNewBlocksFromDepthArgs, 'minimumDepth'>
  >;
  transaction?: SubscriptionResolver<
    Maybe<ResolversTypes['Transaction']>,
    'transaction',
    ParentType,
    ContextType,
    RequireFields<SubscriptionTransactionArgs, 'requestKey'>
  >;
};

export type TokenResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Token'] = ResolversParentTypes['Token'],
> = {
  chainId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction'],
> = {
  cmd?: Resolver<ResolversTypes['TransactionCommand'], ParentType, ContextType>;
  hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  orphanedTransactions?: Resolver<
    Maybe<Array<Maybe<ResolversTypes['Transaction']>>>,
    ParentType,
    ContextType
  >;
  result?: Resolver<ResolversTypes['TransactionInfo'], ParentType, ContextType>;
  sigs?: Resolver<Array<ResolversTypes['TransactionSignature']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionCapabilityResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionCapability'] = ResolversParentTypes['TransactionCapability'],
> = {
  args?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionCommandResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionCommand'] = ResolversParentTypes['TransactionCommand'],
> = {
  meta?: Resolver<ResolversTypes['TransactionMeta'], ParentType, ContextType>;
  networkId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nonce?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  payload?: Resolver<ResolversTypes['TransactionPayload'], ParentType, ContextType>;
  signers?: Resolver<Array<ResolversTypes['Signer']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionInfoResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionInfo'] = ResolversParentTypes['TransactionInfo'],
> = {
  __resolveType: TypeResolveFn<
    'TransactionMempoolInfo' | 'TransactionResult',
    ParentType,
    ContextType
  >;
};

export type TransactionMempoolInfoResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionMempoolInfo'] = ResolversParentTypes['TransactionMempoolInfo'],
> = {
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionMetaResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionMeta'] = ResolversParentTypes['TransactionMeta'],
> = {
  chainId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  creationTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  gasLimit?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  gasPrice?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ttl?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionPayloadResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionPayload'] = ResolversParentTypes['TransactionPayload'],
> = {
  __resolveType: TypeResolveFn<'ContinuationPayload' | 'ExecutionPayload', ParentType, ContextType>;
};

export type TransactionResultResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionResult'] = ResolversParentTypes['TransactionResult'],
> = {
  badResult?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  block?: Resolver<ResolversTypes['Block'], ParentType, ContextType>;
  continuation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventCount?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  events?: Resolver<
    ResolversTypes['TransactionResultEventsConnection'],
    ParentType,
    ContextType,
    Partial<TransactionResultEventsArgs>
  >;
  gas?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  goodResult?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  height?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  logs?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transactionId?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  transfers?: Resolver<
    ResolversTypes['TransactionResultTransfersConnection'],
    ParentType,
    ContextType,
    Partial<TransactionResultTransfersArgs>
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResultEventsConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionResultEventsConnection'] = ResolversParentTypes['TransactionResultEventsConnection'],
> = {
  edges?: Resolver<
    Array<Maybe<ResolversTypes['TransactionResultEventsConnectionEdge']>>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResultEventsConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionResultEventsConnectionEdge'] = ResolversParentTypes['TransactionResultEventsConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResultTransfersConnectionResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionResultTransfersConnection'] = ResolversParentTypes['TransactionResultTransfersConnection'],
> = {
  edges?: Resolver<
    Array<Maybe<ResolversTypes['TransactionResultTransfersConnectionEdge']>>,
    ParentType,
    ContextType
  >;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionResultTransfersConnectionEdgeResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionResultTransfersConnectionEdge'] = ResolversParentTypes['TransactionResultTransfersConnectionEdge'],
> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Transfer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionSignatureResolvers<
  ContextType = any,
  ParentType extends
    ResolversParentTypes['TransactionSignature'] = ResolversParentTypes['TransactionSignature'],
> = {
  sig?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransferResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Transfer'] = ResolversParentTypes['Transfer'],
> = {
  amount?: Resolver<ResolversTypes['Decimal'], ParentType, ContextType>;
  block?: Resolver<ResolversTypes['Block'], ParentType, ContextType>;
  blockHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  chainId?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  creationTime?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  crossChainTransfer?: Resolver<Maybe<ResolversTypes['Transfer']>, ParentType, ContextType>;
  height?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  moduleHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  moduleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orderIndex?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  receiverAccount?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  senderAccount?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  transaction?: Resolver<Maybe<ResolversTypes['Transaction']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserGuardResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['UserGuard'] = ResolversParentTypes['UserGuard'],
> = {
  args?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  fun?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  keys?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  predicate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  raw?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  BigInt?: GraphQLScalarType;
  Block?: BlockResolvers<ContextType>;
  BlockEventsConnection?: BlockEventsConnectionResolvers<ContextType>;
  BlockEventsConnectionEdge?: BlockEventsConnectionEdgeResolvers<ContextType>;
  BlockNeighbor?: BlockNeighborResolvers<ContextType>;
  BlockTransactionsConnection?: BlockTransactionsConnectionResolvers<ContextType>;
  BlockTransactionsConnectionEdge?: BlockTransactionsConnectionEdgeResolvers<ContextType>;
  ChartDataPoint?: ChartDataPointResolvers<ContextType>;
  ContinuationPayload?: ContinuationPayloadResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Decimal?: GraphQLScalarType;
  DexMetrics?: DexMetricsResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  ExecutionPayload?: ExecutionPayloadResolvers<ContextType>;
  FungibleAccount?: FungibleAccountResolvers<ContextType>;
  FungibleAccountTransactionsConnection?: FungibleAccountTransactionsConnectionResolvers<ContextType>;
  FungibleAccountTransactionsConnectionEdge?: FungibleAccountTransactionsConnectionEdgeResolvers<ContextType>;
  FungibleAccountTransfersConnection?: FungibleAccountTransfersConnectionResolvers<ContextType>;
  FungibleAccountTransfersConnectionEdge?: FungibleAccountTransfersConnectionEdgeResolvers<ContextType>;
  FungibleChainAccount?: FungibleChainAccountResolvers<ContextType>;
  FungibleChainAccountTransactionsConnection?: FungibleChainAccountTransactionsConnectionResolvers<ContextType>;
  FungibleChainAccountTransactionsConnectionEdge?: FungibleChainAccountTransactionsConnectionEdgeResolvers<ContextType>;
  FungibleChainAccountTransfersConnection?: FungibleChainAccountTransfersConnectionResolvers<ContextType>;
  FungibleChainAccountTransfersConnectionEdge?: FungibleChainAccountTransfersConnectionEdgeResolvers<ContextType>;
  GasLimitEstimation?: GasLimitEstimationResolvers<ContextType>;
  GenesisHeight?: GenesisHeightResolvers<ContextType>;
  GraphConfiguration?: GraphConfigurationResolvers<ContextType>;
  IGuard?: IGuardResolvers<ContextType>;
  KeysetGuard?: KeysetGuardResolvers<ContextType>;
  LiquidityBalance?: LiquidityBalanceResolvers<ContextType>;
  LiquidityPosition?: LiquidityPositionResolvers<ContextType>;
  LiquidityPositionEdge?: LiquidityPositionEdgeResolvers<ContextType>;
  LiquidityPositionsConnection?: LiquidityPositionsConnectionResolvers<ContextType>;
  NetworkInfo?: NetworkInfoResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  NonFungibleAccount?: NonFungibleAccountResolvers<ContextType>;
  NonFungibleAccountTransactionsConnection?: NonFungibleAccountTransactionsConnectionResolvers<ContextType>;
  NonFungibleAccountTransactionsConnectionEdge?: NonFungibleAccountTransactionsConnectionEdgeResolvers<ContextType>;
  NonFungibleChainAccount?: NonFungibleChainAccountResolvers<ContextType>;
  NonFungibleChainAccountTransactionsConnection?: NonFungibleChainAccountTransactionsConnectionResolvers<ContextType>;
  NonFungibleChainAccountTransactionsConnectionEdge?: NonFungibleChainAccountTransactionsConnectionEdgeResolvers<ContextType>;
  NonFungibleToken?: NonFungibleTokenResolvers<ContextType>;
  NonFungibleTokenBalance?: NonFungibleTokenBalanceResolvers<ContextType>;
  PactQueryResponse?: PactQueryResponseResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Pool?: PoolResolvers<ContextType>;
  PoolCharts?: PoolChartsResolvers<ContextType>;
  PoolTransaction?: PoolTransactionResolvers<ContextType>;
  PoolTransactionEdge?: PoolTransactionEdgeResolvers<ContextType>;
  PoolTransactionsConnection?: PoolTransactionsConnectionResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  QueryBlocksFromDepthConnection?: QueryBlocksFromDepthConnectionResolvers<ContextType>;
  QueryBlocksFromDepthConnectionEdge?: QueryBlocksFromDepthConnectionEdgeResolvers<ContextType>;
  QueryBlocksFromHeightConnection?: QueryBlocksFromHeightConnectionResolvers<ContextType>;
  QueryBlocksFromHeightConnectionEdge?: QueryBlocksFromHeightConnectionEdgeResolvers<ContextType>;
  QueryCompletedBlockHeightsConnection?: QueryCompletedBlockHeightsConnectionResolvers<ContextType>;
  QueryCompletedBlockHeightsConnectionEdge?: QueryCompletedBlockHeightsConnectionEdgeResolvers<ContextType>;
  QueryEventsConnection?: QueryEventsConnectionResolvers<ContextType>;
  QueryEventsConnectionEdge?: QueryEventsConnectionEdgeResolvers<ContextType>;
  QueryPoolsConnection?: QueryPoolsConnectionResolvers<ContextType>;
  QueryPoolsConnectionEdge?: QueryPoolsConnectionEdgeResolvers<ContextType>;
  QueryTokensConnection?: QueryTokensConnectionResolvers<ContextType>;
  QueryTokensEdge?: QueryTokensEdgeResolvers<ContextType>;
  QueryTransactionsByPublicKeyConnection?: QueryTransactionsByPublicKeyConnectionResolvers<ContextType>;
  QueryTransactionsByPublicKeyConnectionEdge?: QueryTransactionsByPublicKeyConnectionEdgeResolvers<ContextType>;
  QueryTransactionsConnection?: QueryTransactionsConnectionResolvers<ContextType>;
  QueryTransactionsConnectionEdge?: QueryTransactionsConnectionEdgeResolvers<ContextType>;
  QueryTransfersConnection?: QueryTransfersConnectionResolvers<ContextType>;
  QueryTransfersConnectionEdge?: QueryTransfersConnectionEdgeResolvers<ContextType>;
  RawGuard?: RawGuardResolvers<ContextType>;
  Signer?: SignerResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Token?: TokenResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  TransactionCapability?: TransactionCapabilityResolvers<ContextType>;
  TransactionCommand?: TransactionCommandResolvers<ContextType>;
  TransactionInfo?: TransactionInfoResolvers<ContextType>;
  TransactionMempoolInfo?: TransactionMempoolInfoResolvers<ContextType>;
  TransactionMeta?: TransactionMetaResolvers<ContextType>;
  TransactionPayload?: TransactionPayloadResolvers<ContextType>;
  TransactionResult?: TransactionResultResolvers<ContextType>;
  TransactionResultEventsConnection?: TransactionResultEventsConnectionResolvers<ContextType>;
  TransactionResultEventsConnectionEdge?: TransactionResultEventsConnectionEdgeResolvers<ContextType>;
  TransactionResultTransfersConnection?: TransactionResultTransfersConnectionResolvers<ContextType>;
  TransactionResultTransfersConnectionEdge?: TransactionResultTransfersConnectionEdgeResolvers<ContextType>;
  TransactionSignature?: TransactionSignatureResolvers<ContextType>;
  Transfer?: TransferResolvers<ContextType>;
  UserGuard?: UserGuardResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  complexity?: ComplexityDirectiveResolver<any, any, ContextType>;
};
