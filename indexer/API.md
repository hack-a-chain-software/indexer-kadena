# DEX GraphQL API Documentation

This document provides a comprehensive guide for querying the DEX (Decentralized Exchange) data through our GraphQL API.

## Table of Contents

- [Token Info](#token-info)
- [Wallet Info](#wallet-info)
- [DEX Metrics](#dex-metrics)
- [Pools](#pools)
- [Pool Details](#pool-details)
- [Time Frames](#time-frames)
- [Sorting Options](#sorting-options)
- [Transaction Types](#transaction-types)
- [Pagination](#pagination)

## Token Info

### Get Token Metadata

```graphql
query GetTokenInfo {
  tokens(first: 10) {
    edges {
      node {
        id
        name
        chainId
      }
    }
  }
}
```

**Input Parameters:**

- `first`: Number of tokens to fetch (default: 10)
- `after`: Optional cursor for pagination
- `before`: Optional cursor for reverse pagination
- `last`: Optional number of items to fetch from the end

**Output Data:**

```typescript
{
  tokens: {
    edges: Array<{
      node: {
        id: string;        // Unique token identifier (ID!)
        name: string;      // Token name (String!)
        chainId: string;   // Chain ID where token exists (String!)
      }
    }>,
    pageInfo: {
      hasNextPage: boolean;    // Whether more pages exist
      hasPreviousPage: boolean;// Whether previous pages exist
      startCursor: string;     // Cursor for first item
      endCursor: string;       // Cursor for last item
    }
  }
}
```

### Get Token Price and Exchange Rate

```graphql
query GetPoolInfo($poolId: ID!) {
  pool(id: $poolId) {
    token0 {
      id
      name
    }
    token1 {
      id
      name
    }
    reserve0
    reserve1
    tvlUsd
  }
}
```

**Input Parameters:**

- `poolId`: ID of the pool to fetch (required, ID!)

**Output Data:**

```typescript
{
  pool: {
    token0: {
      id: string;    // First token's ID (ID!)
      name: string;  // First token's name (String!)
    },
    token1: {
      id: string;    // Second token's ID (ID!)
      name: string;  // Second token's name (String!)
    },
    reserve0: string;  // Amount of token0 in pool (String!)
    reserve1: string;  // Amount of token1 in pool (String!)
    tvlUsd: Decimal;   // Total Value Locked in USD (Decimal!)
  }
}
```

## Wallet Info

### Get Wallet's Liquidity Positions

```graphql
query GetWalletPositions($walletAddress: String!) {
  liquidityPositions(walletAddress: $walletAddress, orderBy: VALUE_USD_DESC, first: 10) {
    edges {
      node {
        id
        pairKey
        liquidity
        valueUsd
        apr24h
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
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

**Input Parameters:**

- `walletAddress`: Wallet address to fetch positions for (required, String!)
- `orderBy`: Sort order (LiquidityPositionOrderBy enum)
  - `VALUE_USD_ASC/DESC`: Sort by position value in USD
  - `LIQUIDITY_ASC/DESC`: Sort by liquidity amount
  - `APR_ASC/DESC`: Sort by 24h APR
- `first`: Number of positions to fetch (default: 10)
- `after`: Optional cursor for pagination
- `last`: Optional number of items to fetch from the end
- `before`: Optional cursor for reverse pagination

**Output Data:**

```typescript
{
  liquidityPositions: {
    edges: Array<{
      node: {
        id: ID!;              // Position ID
        pairKey: String!;     // Pool identifier
        liquidity: String!;   // Amount of LP tokens
        valueUsd: Decimal!;   // Position value in USD
        apr24h: Decimal!;     // 24h Annual Percentage Rate
        token0: {
          id: ID!;           // First token's ID
          name: String!;     // First token's name
        },
        token1: {
          id: ID!;           // Second token's ID
          name: String!;     // Second token's name
        }
      }
    }>,
    pageInfo: {
      hasNextPage: Boolean!;    // Whether more pages exist
      hasPreviousPage: Boolean!;// Whether previous pages exist
      startCursor: String;      // Cursor for first item
      endCursor: String;        // Cursor for last item
    },
    totalCount: Int!;           // Total number of positions
  }
}
```

## DEX Metrics

### Get Overall DEX Statistics

```graphql
query GetDexMetrics($startDate: DateTime, $endDate: DateTime) {
  dexMetrics(startDate: $startDate, endDate: $endDate) {
    totalPools
    currentTvlUsd
    totalVolumeUsd
    tvlHistory {
      timestamp
      value
    }
    volumeHistory {
      timestamp
      value
    }
  }
}
```

**Input Parameters:**

- `startDate`: Optional start date for historical data (DateTime)
- `endDate`: Optional end date for historical data (DateTime)

**Output Data:**

```typescript
{
  dexMetrics: {
    totalPools: Int!;           // Total number of pools
    currentTvlUsd: Decimal!;    // Current TVL in USD
    totalVolumeUsd: Decimal!;   // Total trading volume in USD
    tvlHistory: Array<{         // TVL history data points
      timestamp: DateTime!;     // ISO timestamp
      value: Decimal!;          // TVL value in USD
    }>,
    volumeHistory: Array<{      // Volume history data points
      timestamp: DateTime!;     // ISO timestamp
      value: Decimal!;          // Volume value in USD
    }>
  }
}
```

## Pools

### Get All Pools (Paginated and Sorted)

```graphql
query GetPools($first: Int, $orderBy: PoolOrderBy = TVL_USD_DESC, $after: String) {
  pools(first: $first, orderBy: $orderBy, after: $after) {
    edges {
      node {
        id
        address
        token0 {
          id
          name
        }
        token1 {
          id
          name
        }
        tvlUsd
        volume24hUsd
        volume7dUsd
        transactionCount24h
        apr24h
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

**Input Parameters:**

- `first`: Number of pools to fetch (default: 20)
- `orderBy`: Sort order (PoolOrderBy enum)
  - `TVL_USD_ASC/DESC`: Sort by Total Value Locked
  - `VOLUME_24H_ASC/DESC`: Sort by 24-hour volume
  - `VOLUME_7D_ASC/DESC`: Sort by 7-day volume
  - `APR_24H_ASC/DESC`: Sort by 24-hour APR
  - `TRANSACTION_COUNT_24H_ASC/DESC`: Sort by 24-hour transaction count
- `after`: Optional cursor for pagination
- `before`: Optional cursor for reverse pagination
- `last`: Optional number of items to fetch from the end

**Output Data:**

```typescript
{
  pools: {
    edges: Array<{
      node: {
        id: ID!;              // Pool ID
        address: String!;     // Pool contract address
        token0: {
          id: ID!;           // First token's ID
          name: String!;     // First token's name
        },
        token1: {
          id: ID!;           // Second token's ID
          name: String!;     // Second token's name
        },
        tvlUsd: Decimal!;    // Total Value Locked in USD
        volume24hUsd: Decimal!;  // 24h trading volume in USD
        volume7dUsd: Decimal!;   // 7d trading volume in USD
        transactionCount24h: Int!;  // Number of transactions in 24h
        apr24h: Decimal!;    // 24h Annual Percentage Rate
      }
    }>,
    pageInfo: {
      hasNextPage: Boolean!;    // Whether more pages exist
      hasPreviousPage: Boolean!;// Whether previous pages exist
      startCursor: String;      // Cursor for first item
      endCursor: String;        // Cursor for last item
    },
    totalCount: Int!;           // Total number of pools
  }
}
```

## Pool Details

### Get Pool by ID with Charts

```graphql
query GetPoolDetails($poolId: ID!, $timeFrame: TimeFrame = DAY, $first: Int = 10) {
  pool(id: $poolId) {
    id
    address
    token0 {
      id
      name
    }
    token1 {
      id
      name
    }
    reserve0
    reserve1
    totalSupply
    tvlUsd
    tvlChange24h
    volume24hUsd
    volumeChange24h
    volume7dUsd
    fees24hUsd
    feesChange24h
    transactionCount24h
    transactionCountChange24h
    apr24h
    charts(timeFrame: $timeFrame) {
      volume {
        timestamp
        value
      }
      tvl {
        timestamp
        value
      }
      fees {
        timestamp
        value
      }
    }
    transactions(first: $first) {
      edges {
        node {
          id
          maker
          amount0In
          amount1In
          amount0Out
          amount1Out
          amountUsd
          timestamp
          transactionType
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
}
```

**Input Parameters:**

- `poolId`: ID of the pool to fetch (required, ID!)
- `timeFrame`: Chart timeframe (TimeFrame enum)
  - `DAY`: Last 24 hours
  - `WEEK`: Last 7 days
  - `MONTH`: Last 30 days
  - `YEAR`: Last 365 days
  - `ALL`: All available data
- `first`: Number of transactions to fetch (default: 10)

**Output Data:**

```typescript
{
  pool: {
    id: ID!;                    // Pool ID
    address: String!;           // Pool contract address
    token0: {
      id: ID!;                 // First token's ID
      name: String!;           // First token's name
    },
    token1: {
      id: ID!;                 // Second token's ID
      name: String!;           // Second token's name
    },
    reserve0: String!;         // Amount of token0 in pool
    reserve1: String!;         // Amount of token1 in pool
    totalSupply: String!;      // Total supply of LP tokens
    tvlUsd: Decimal!;          // Total Value Locked in USD
    tvlChange24h: Float!;      // 24h TVL change percentage
    volume24hUsd: Decimal!;    // 24h trading volume in USD
    volumeChange24h: Float!;   // 24h volume change percentage
    volume7dUsd: Decimal!;     // 7d trading volume in USD
    fees24hUsd: Decimal!;      // 24h fees in USD
    feesChange24h: Float!;     // 24h fees change percentage
    transactionCount24h: Int!; // Number of transactions in 24h
    transactionCountChange24h: Float!;  // 24h transaction count change
    apr24h: Decimal!;          // 24h Annual Percentage Rate
    charts: {
      volume: Array<{          // Volume chart data
        timestamp: DateTime!;  // ISO timestamp
        value: Decimal!;       // Volume value in USD
      }>,
      tvl: Array<{             // TVL chart data
        timestamp: DateTime!;  // ISO timestamp
        value: Decimal!;       // TVL value in USD
      }>,
      fees: Array<{            // Fees chart data
        timestamp: DateTime!;  // ISO timestamp
        value: Decimal!;       // Fees value in USD
      }>
    },
    transactions: {
      edges: Array<{           // Transaction list
        node: {
          id: ID!;            // Transaction ID
          maker: String!;     // Transaction maker address
          amount0In: Decimal!;// Amount of token0 in
          amount1In: Decimal!;// Amount of token1 in
          amount0Out: Decimal!;// Amount of token0 out
          amount1Out: Decimal!;// Amount of token1 out
          amountUsd: Decimal!;// Transaction amount in USD
          timestamp: DateTime!;// Transaction timestamp
          transactionType: PoolTransactionType!; // Transaction type
        }
      }>,
      pageInfo: {
        hasNextPage: Boolean!;  // Whether more pages exist
        hasPreviousPage: Boolean!;// Whether previous pages exist
        startCursor: String;    // Cursor for first item
        endCursor: String;      // Cursor for last item
      },
      totalCount: Int!;        // Total number of transactions
    }
  }
}
```

### Get Pool Transactions by Type

```graphql
query GetPoolTransactions(
  $pairId: Int!
  $type: PoolTransactionType
  $first: Int = 10
  $after: String
) {
  poolTransactions(pairId: $pairId, type: $type, first: $first, after: $after) {
    edges {
      node {
        id
        maker
        amount0In
        amount1In
        amount0Out
        amount1Out
        amountUsd
        timestamp
        transactionType
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

**Input Parameters:**

- `pairId`: ID of the pool (required, Int!)
- `type`: Transaction type (PoolTransactionType enum)
  - `SWAP`: Token swap transactions
  - `ADD_LIQUIDITY`: Adding liquidity to a pool
  - `REMOVE_LIQUIDITY`: Removing liquidity from a pool
- `first`: Number of transactions to fetch (default: 10)
- `after`: Optional cursor for pagination
- `before`: Optional cursor for reverse pagination
- `last`: Optional number of items to fetch from the end

**Output Data:**

```typescript
{
  poolTransactions: {
    edges: Array<{
      node: {
        id: ID!;             // Transaction ID
        maker: String!;      // Transaction maker address
        amount0In: Decimal!; // Amount of token0 in
        amount1In: Decimal!; // Amount of token1 in
        amount0Out: Decimal!;// Amount of token0 out
        amount1Out: Decimal!;// Amount of token1 out
        amountUsd: Decimal!; // Transaction amount in USD
        timestamp: DateTime!;// Transaction timestamp
        transactionType: PoolTransactionType!; // Transaction type
      }
    }>,
    pageInfo: {
      hasNextPage: Boolean!;    // Whether more pages exist
      hasPreviousPage: Boolean!;// Whether previous pages exist
      startCursor: String;      // Cursor for first item
      endCursor: String;        // Cursor for last item
    },
    totalCount: Int!;           // Total number of transactions
  }
}
```

## Time Frames

For chart data, you can use these time frames:

- `DAY` - Last 24 hours
- `WEEK` - Last 7 days
- `MONTH` - Last 30 days
- `YEAR` - Last 365 days
- `ALL` - All available data

## Sorting Options

For pools and liquidity positions, you can sort by:

- `TVL_USD_ASC/DESC` - Sort by Total Value Locked
- `VOLUME_24H_ASC/DESC` - Sort by 24-hour volume
- `VOLUME_7D_ASC/DESC` - Sort by 7-day volume
- `APR_24H_ASC/DESC` - Sort by 24-hour APR
- `TRANSACTION_COUNT_24H_ASC/DESC` - Sort by 24-hour transaction count

## Transaction Types

- `SWAP` - Token swap transactions
- `ADD_LIQUIDITY` - Adding liquidity to a pool
- `REMOVE_LIQUIDITY` - Removing liquidity from a pool

## Pagination

All list queries support pagination with the following parameters:

- `first`: Number of items to fetch from the start
- `after`: Cursor for fetching the next page
- `last`: Number of items to fetch from the end
- `before`: Cursor for fetching the previous page

Each paginated response includes:

- `pageInfo`: Contains pagination metadata
  - `hasNextPage`: Boolean indicating if more pages exist
  - `hasPreviousPage`: Boolean indicating if previous pages exist
  - `startCursor`: Cursor for the first item
  - `endCursor`: Cursor for the last item
- `totalCount`: Total number of items available

## Response Types

### PoolTransaction

```typescript
type PoolTransaction {
  id: ID!
  maker: String!
  amount0In: Decimal!
  amount1In: Decimal!
  amount0Out: Decimal!
  amount1Out: Decimal!
  amountUsd: Decimal!
  timestamp: DateTime!
  transactionId: Int!
  requestkey: String!
  transactionType: PoolTransactionType!
}
```

### Pool

```typescript
type Pool {
  id: ID!
  address: String!
  token0: Token!
  token1: Token!
  reserve0: String!
  reserve1: String!
  totalSupply: String!
  key: String!
  tvlUsd: Decimal!
  tvlChange24h: Float!
  volume24hUsd: Decimal!
  volumeChange24h: Float!
  volume7dUsd: Decimal!
  fees24hUsd: Decimal!
  feesChange24h: Float!
  transactionCount24h: Int!
  transactionCountChange24h: Float!
  apr24h: Decimal!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### DexMetrics

```typescript
type DexMetrics {
  totalPools: Int!
  currentTvlUsd: Decimal!
  tvlHistory: [ChartDataPoint!]!
  volumeHistory: [ChartDataPoint!]!
  totalVolumeUsd: Decimal!
}
```

### ChartDataPoint

```typescript
type ChartDataPoint {
  timestamp: DateTime!
  value: Decimal!
}
```
