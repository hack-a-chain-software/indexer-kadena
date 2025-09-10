/**
 * Resolver for the totalCount field of the NonFungibleChainAccountTransfersConnection type.
 * This module counts token transfers associated with a specific non-fungible token account.
 */
import { ResolverContext } from '../../../../config/apollo-server-config';
import { NonFungibleChainAccountTransfersConnectionResolvers } from '../../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating the non-fungible chain account input parameters.
 * Requires non-nullable strings for accountName and chainId fields.
 */
const schema = zod.object({
  accountName: zod.string(),
  chainId: zod.string(),
  hasTokenId: zod.boolean(),
});

/**
 * Resolver function for the totalCount field of the NonFungibleChainAccountTransfersConnection type.
 * Retrieves the total count of transfers associated with the specified account and non-fungible chain token.
 *
 * @param parent - The parent object containing accountName and chainId parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transfers for the specified account and non-fungible chain token
 */
export const totalCountNonFungibleChainAccountTransfersConnectionResolver: NonFungibleChainAccountTransfersConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { accountName, chainId, hasTokenId } = schema.parse(parent);

    const output = await context.transferRepository.getTotalCountOfTransfers({
      accountName,
      chainId,
      hasTokenId,
    });

    return output;
  };
