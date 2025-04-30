import type { ChartDataType } from '../../../models/pool-chart-data';
import type { PoolTransactionType } from '../../../models/pool-transaction';
import type Token from '../../../models/token';

export interface GetPoolsParams {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface GetPoolParams {
  id: number;
}

export interface GetPoolTransactionsParams {
  pairId: number;
  type?: PoolTransactionType;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface GetPoolChartDataParams {
  pairId: number;
  type: ChartDataType;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  timeRange?: '1D' | '1W' | '1M' | '1Y' | 'ALL';
}

export interface PoolOutput {
  id: number;
  lastPrice: number;
  token0: Token;
  token1: Token;
  token0Liquidity: number;
  token0LiquidityDollar: number;
  token1Liquidity: number;
  token1LiquidityDollar: number;
  totalLiquidityDollar: number;
  feePercentage: number;
  volume24hUsd: number;
  volume7dUsd: number;
  transactionCount24h: number;
  apr24h: number;
}

export interface PoolTransactionOutput {
  id: number;
  type: PoolTransactionType;
  timestamp: Date;
  maker: string;
  amountIn: number;
  amountOut: number;
  amountInUsd: number;
  amountOutUsd: number;
  token0Amount: number;
  token1Amount: number;
  token0AmountUsd: number;
  token1AmountUsd: number;
  feesUsd: number;
  transactionHash: string;
}

export interface PoolChartDataOutput {
  id: number;
  timestamp: Date;
  valueUsd: number;
}

export interface PoolStatsOutput {
  id: number;
  timestamp: Date;
  tvlUsd: number;
  volume24hUsd: number;
  volume7dUsd: number;
  fees24hUsd: number;
  transactionCount24h: number;
  apr24h: number;
}

export interface PoolsConnection {
  edges: {
    cursor: string;
    node: PoolOutput;
  }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface PoolTransactionsConnection {
  edges: {
    cursor: string;
    node: PoolTransactionOutput;
  }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export interface PoolChartDataConnection {
  edges: {
    cursor: string;
    node: PoolChartDataOutput;
  }[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
}

export default interface PoolRepository {
  getPools(params: GetPoolsParams): Promise<PoolsConnection>;
  getPool(params: GetPoolParams): Promise<PoolOutput | null>;
  getPoolTransactions(params: GetPoolTransactionsParams): Promise<PoolTransactionsConnection>;
  getPoolChartData(params: GetPoolChartDataParams): Promise<PoolChartDataConnection>;
  getLatestPoolStats(pairId: number): Promise<PoolStatsOutput | null>;
}
