import { ResolverContext } from '../../config/apollo-server-config';
import {
  QueryResolvers,
  QueryTokenPriceArgs,
  QueryTokenPricesArgs,
} from '../../config/graphql-types';

export const tokenPriceQueryResolver: QueryResolvers<ResolverContext>['tokenPrice'] = async (
  _parent: unknown,
  args: QueryTokenPriceArgs,
  context: ResolverContext,
) => {
  return context.tokenPriceRepository.getTokenPrice({
    tokenAddress: args.tokenAddress,
    protocolAddress: args.protocolAddress || undefined,
  });
};

export const tokenPricesQueryResolver: QueryResolvers<ResolverContext>['tokenPrices'] = async (
  _parent: unknown,
  args: QueryTokenPricesArgs,
  context: ResolverContext,
) => {
  return context.tokenPriceRepository.getTokenPrices({
    protocolAddress: args.protocolAddress || undefined,
  });
};
