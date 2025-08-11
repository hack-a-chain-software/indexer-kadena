/**
 * Resolver for the totalCount field of the QueryTransfersConnection type.
 * This module counts token transfers based on various filter criteria.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { QueryTransfersConnectionResolvers } from '../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating transfer query parameters.
 * Defines the structure and types of filter parameters used to count transfers.
 */
const schema = zod.object({
  accountName: zod.string().nullable().optional(),
  blockHash: zod.string().nullable().optional(),
  chainId: zod.string().nullable().optional(),
  fungibleName: zod.string().nullable().optional(),
  requestKey: zod.string().nullable().optional(),
  hasTokenId: zod.boolean().nullable().optional(),
});

/**
 * Resolver function for the totalCount field of the QueryTransfersConnection type.
 * Retrieves the total count of transfers matching the provided filter criteria.
 *
 * @param parent - The parent object containing filter parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transfers matching the criteria
 */
export const totalCountQueryTransfersConnectionResolver: QueryTransfersConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { accountName, blockHash, chainId, fungibleName, requestKey, hasTokenId } =
      schema.parse(parent);

    const transactions = await context.transferRepository.getTotalCountOfTransfers({
      accountName,
      blockHash,
      chainId,
      fungibleName,
      requestKey,
      hasTokenId,
    });

    return transactions;
  };
