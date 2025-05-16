import { ResolverContext } from '../../config/apollo-server-config';
import {
  QueryResolvers,
  QueryLiquidityPositionsArgs,
  ResolverTypeWrapper,
  LiquidityPositionsConnection,
} from '../../config/graphql-types';

interface LiquidityPositionsArgs {
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

export const liquidityPositionsQueryResolver: QueryResolvers<ResolverContext>['liquidityPositions'] =
  async (
    _parent: unknown,
    args: QueryLiquidityPositionsArgs,
    context: ResolverContext,
  ): Promise<LiquidityPositionsConnection> => {
    const result = await context.liquidityPositionRepository.getLiquidityPositions({
      walletAddress: args.walletAddress,
      first: args.first ?? 10,
      after: args.after ?? undefined,
      last: args.last ?? undefined,
      before: args.before ?? undefined,
      orderBy: args.orderBy ?? 'VALUE_USD_DESC',
    });

    return result as LiquidityPositionsConnection;
  };
