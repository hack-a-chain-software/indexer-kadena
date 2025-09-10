/**
 * Resolver for the totalCount field of the QueryTransactionsConnection type.
 * This module counts transactions based on various filter criteria.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { QueryTransactionsConnectionResolvers } from '../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating transaction query parameters.
 * Defines the structure and types of filter parameters used to count transactions.
 */
const schema = zod.object({
  accountName: zod.string().nullable().optional(),
  blockHash: zod.string().nullable().optional(),
  chainId: zod.string().nullable().optional(),
  fungibleName: zod.string().nullable().optional(),
  maxHeight: zod.number().nullable().optional(),
  minHeight: zod.number().nullable().optional(),
  minimumDepth: zod.number().nullable().optional(),
  requestKey: zod.string().nullable().optional(),
  isCoinbase: zod.boolean().nullable().optional(),
});

/**
 * Resolver function for the totalCount field of the QueryTransactionsConnection type.
 * Retrieves the total count of transactions matching the provided filter criteria.
 *
 * @param parent - The parent object containing filter parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of transactions matching the criteria
 */
export const totalCountQueryTransactionsConnectionResolver: QueryTransactionsConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const {
      accountName,
      blockHash,
      chainId,
      maxHeight,
      minHeight,
      minimumDepth,
      fungibleName,
      requestKey,
      isCoinbase,
    } = schema.parse(parent);

    const output = await context.transactionRepository.getTransactionsCount({
      accountName,
      blockHash,
      chainId,
      fungibleName,
      maxHeight,
      minHeight,
      minimumDepth,
      requestKey,
      isCoinbase,
    });
    return output;
  };
