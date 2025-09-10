/**
 * Resolver for the totalCount field of the FungibleAccountTransfersConnection type.
 * This module counts token transfers associated with a specific fungible token account.
 */
import { ResolverContext } from '../../../../config/apollo-server-config';
import { FungibleAccountTransfersConnectionResolvers } from '../../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating the fungible account input parameters.
 * Requires non-nullable strings for accountName and fungibleName fields.
 */
const schema = zod.object({
  accountName: zod.string(),
  fungibleName: zod.string(),
  hasTokenId: zod.boolean(),
});

/**
 * Resolver function for the totalCount field of the FungibleAccountTransfersConnection type.
 * Retrieves the total count of transfers associated with the specified account and fungible token.
 *
 * @param parent - The parent object containing accountName and fungibleName parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transfers for the specified account and fungible token
 */
export const totalCountFungibleAccountTransfersConnectionResolver: FungibleAccountTransfersConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { accountName, fungibleName, hasTokenId } = schema.parse(parent);

    const output = await context.transferRepository.getTotalCountOfTransfers({
      accountName,
      fungibleName,
      hasTokenId,
    });
    return output;
  };
