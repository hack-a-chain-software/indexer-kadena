import { PageInfo } from '../../config/graphql-types';
import { ConnectionEdge } from '../types';

export interface LiquidityPosition {
  id: string;
  pairId: number;
  liquidity: string;
  walletAddress: string;
  valueUsd: number;
  apr24h: number;
  pair: {
    id: string;
    token0: {
      id: string;
      name: string;
      chainId: string;
    };
    token1: {
      id: string;
      name: string;
      chainId: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GetLiquidityPositionsParams {
  walletAddress: string;
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  orderBy?:
    | 'VALUE_USD_ASC'
    | 'VALUE_USD_DESC'
    | 'LIQUIDITY_ASC'
    | 'LIQUIDITY_DESC'
    | 'APR_ASC'
    | 'APR_DESC';
}

export interface LiquidityPositionsConnection {
  edges: ConnectionEdge<LiquidityPosition>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface LiquidityPositionRepository {
  getLiquidityPositions(params: GetLiquidityPositionsParams): Promise<LiquidityPositionsConnection>;
}
