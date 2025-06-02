import type { TransactionType } from '../../../models/pool-transaction';
import type Token from '../../../models/token';
import {
  PageInfo,
  Pool,
  PoolCharts,
  PoolTransactionType,
  TimeFrame,
} from '../../config/graphql-types';
import { ConnectionEdge } from '../types';

export interface GetPoolsParams {
  after?: string | null;
  before?: string | null;
  first?: number | null;
  last?: number | null;
  orderBy?: string;
  protocolAddress?: string | null;
}

export interface GetPoolParams {
  id: number;
}

export interface GetPoolTransactionsParams {
  pairId: number;
  type?: PoolTransactionType;
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

export interface GetPoolChartDataParams {
  pairId: number;
  type: 'TVL' | 'VOLUME' | 'PRICE';
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  timeRange?: '1D' | '1W' | '1M' | '1Y' | 'ALL';
}

export interface GetPoolChartsParams {
  pairId: number;
  timeFrame: TimeFrame;
}

export type PoolOutput = Pool & {
  databasePoolId: string;
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
};

export interface PoolTransaction {
  id: string;
  maker: string;
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
  amountUsd: string;
  timestamp: Date;
  transactionId: number;
  requestkey: string;
  transactionType: PoolTransactionType;
}

export interface PoolTransactionsConnection {
  edges: ConnectionEdge<PoolTransaction>[] | null;
  pageInfo: PageInfo | null;
  totalCount: number | null;
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

export interface PoolChartsOutput {
  volume: {
    timestamp: Date;
    value: number;
  }[];
  tvl: {
    timestamp: Date;
    value: number;
  }[];
  fees: {
    timestamp: Date;
    value: number;
  }[];
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
  getPools(params: GetPoolsParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<Pool>[];
    totalCount: number;
  }>;
  getPool(params: GetPoolParams): Promise<Pool | null>;
  getPoolTransactions(
    params: GetPoolTransactionsParams,
  ): Promise<PoolTransactionsConnection | null>;
  getPoolCharts(params: GetPoolChartsParams): Promise<PoolCharts>;
}
