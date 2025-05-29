import { GraphQLResolveInfo } from 'graphql';
import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';

export const dexMetricsQueryResolver: QueryResolvers<ResolverContext>['dexMetrics'] = async (
  _parent: unknown,
  args: { startDate?: Date | null; endDate?: Date | null; protocolAddress?: string | null },
  context: ResolverContext,
  _info: GraphQLResolveInfo,
) => {
  return context.dexMetricsRepository.getDexMetrics({
    startDate: args.startDate || undefined,
    endDate: args.endDate || undefined,
    protocolAddress: args.protocolAddress || undefined,
  });
};
