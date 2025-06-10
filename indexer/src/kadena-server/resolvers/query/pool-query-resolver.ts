import { ResolverContext } from '../../config/apollo-server-config';
import { Pool, QueryResolvers, QueryPoolArgs } from '../../config/graphql-types';

export const poolQueryResolver: QueryResolvers<ResolverContext>['pool'] = async (
  _parent: unknown,
  args: QueryPoolArgs,
  context: ResolverContext,
): Promise<Pool | null> => {
  return await context.poolRepository.getPool(args);
};
