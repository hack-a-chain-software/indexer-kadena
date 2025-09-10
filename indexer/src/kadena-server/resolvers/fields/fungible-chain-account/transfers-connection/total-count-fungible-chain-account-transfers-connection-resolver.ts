/**
 * Resolver for the totalCount field of the FungibleChainAccountTransfersConnection type.
 * This module counts token transfers associated with a chain-specific fungible token account.
 */
import { ResolverContext } from '../../../../config/apollo-server-config';
import { FungibleChainAccountTransfersConnectionResolvers } from '../../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating the fungible chain account input parameters.
 * Requires non-nullable strings for accountName, chainId, and fungibleName fields.
 */
const schema = zod.object({
  accountName: zod.string(),
  chainId: zod.string(),
  fungibleName: zod.string(),
  hasTokenId: zod.boolean(),
});

/**
 * Resolver function for the totalCount field of the FungibleChainAccountTransfersConnection type.
 * Retrieves the total count of transfers associated with the specified account, chain, and fungible token.
 *
 * @param parent - The parent object containing accountName, chainId, and fungibleName parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transfers for the specified account, chain, and fungible token
 */
export const totalCountFungibleChainAccountTransfersConnectionResolver: FungibleChainAccountTransfersConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { accountName, chainId, fungibleName, hasTokenId } = schema.parse(parent);

    const output = await context.transferRepository.getTotalCountOfTransfers({
      accountName,
      chainId,
      fungibleName,
      hasTokenId,
    });
    return output;
  };
