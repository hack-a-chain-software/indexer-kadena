import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';

export const balanceQueryResolver: QueryResolvers<ResolverContext>['balance'] = async (
  _parent,
  args,
  context,
) => {
  const { accountName, chainIds, module, after, before, first, last } = args;
  if (!accountName && !module) {
    throw new Error('Either accountName or module must be provided.');
  }
  const output = await context.balanceRepository.getAccountBalances({
    accountName,
    chainIds: chainIds ?? null,
    module: module ?? null,
    after: after ?? null,
    before: before ?? null,
    first: first ?? null,
    last: last ?? null,
  });
  return output;
};
