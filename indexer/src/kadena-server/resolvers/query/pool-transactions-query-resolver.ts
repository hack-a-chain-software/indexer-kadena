import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers, QueryPoolTransactionsArgs } from '../../config/graphql-types';

export const poolTransactionsQueryResolver: QueryResolvers<ResolverContext>['poolTransactions'] =
  async (_parent: unknown, args: QueryPoolTransactionsArgs, context: ResolverContext) => {
    return context.poolRepository.getPoolTransactions({
      pairId: args.pairId,
      type: args.type ?? undefined,
      first: args.first ?? 10,
      after: args.after,
      last: args.last,
      before: args.before,
    });
  };
