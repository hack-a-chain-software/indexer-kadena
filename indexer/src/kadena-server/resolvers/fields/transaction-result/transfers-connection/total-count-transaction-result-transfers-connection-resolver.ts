/**
 * Resolver for the totalCount field of the TransactionResultTransfersConnection type.
 * This module counts token transfers associated with a specific transaction.
 */
import { ResolverContext } from '../../../../config/apollo-server-config';
import { TransactionResultTransfersConnectionResolvers } from '../../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating the transaction input parameter.
 * Requires a non-nullable string for the databaseTransactionId field.
 */
const schema = zod.object({
  databaseTransactionId: zod.string(),
  hasTokenId: zod.boolean(),
});

/**
 * Resolver function for the totalCount field of the TransactionResultTransfersConnection type.
 * Retrieves the total count of token transfers associated with the specified transaction.
 *
 * @param parent - The parent object containing the databaseTransactionId parameter
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transfers for the specified transaction
 */
export const totalCountTransactionResultTransfersConnectionResolver: TransactionResultTransfersConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { databaseTransactionId, hasTokenId } = schema.parse(parent);

    const output = await context.transferRepository.getTotalCountOfTransfers({
      transactionId: databaseTransactionId,
      hasTokenId,
    });
    return output;
  };
