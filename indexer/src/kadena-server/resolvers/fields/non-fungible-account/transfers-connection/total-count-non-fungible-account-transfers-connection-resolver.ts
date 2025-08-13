/**
 * Resolver for the totalCount field of the NonFungibleAccountTransfersConnection type.
 * This module counts token transfers associated with a specific non-fungible token account.
 */
import { ResolverContext } from '../../../../config/apollo-server-config';
import { NonFungibleAccountTransfersConnectionResolvers } from '../../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating the non-fungible account input parameters.
 * Requires non-nullable strings for accountName field.
 */
const schema = zod.object({
  accountName: zod.string(),
});

/**
 * Resolver function for the totalCount field of the NonFungibleAccountTransfersConnection type.
 * Retrieves the total count of transfers associated with the specified account and non-fungible token.
 *
 * @param parent - The parent object containing accountName parameter
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transfers for the specified account and non-fungible token
 */
export const totalCountNonFungibleAccountTransfersConnectionResolver: NonFungibleAccountTransfersConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { accountName } = schema.parse(parent);

    const output = await context.transferRepository.getTotalCountOfTransfers({
      accountName,
      hasTokenId: true,
    });

    return output;
  };
