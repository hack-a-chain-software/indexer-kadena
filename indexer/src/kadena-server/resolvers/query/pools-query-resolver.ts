import { GraphQLResolveInfo } from 'graphql';

import { ResolverContext } from '../../config/apollo-server-config';
import {
  QueryPoolsArgs,
  QueryPoolsConnection,
  QueryResolvers,
  RequireFields,
} from '../../config/graphql-types';

export const poolsQueryResolver: QueryResolvers<ResolverContext>['pools'] = async (
  _parent: unknown,
  args: RequireFields<QueryPoolsArgs, 'orderBy'>,
  context: ResolverContext,
  info: GraphQLResolveInfo,
): Promise<QueryPoolsConnection> => {
  const { after, before, first, last, orderBy, protocolAddress } = args;

  const output = await context.poolRepository.getPools({
    after,
    before,
    first,
    last,
    orderBy,
    protocolAddress,
  });

  return {
    edges: output.edges,
    pageInfo: output.pageInfo,
    totalCount: output.totalCount,
  };
};
