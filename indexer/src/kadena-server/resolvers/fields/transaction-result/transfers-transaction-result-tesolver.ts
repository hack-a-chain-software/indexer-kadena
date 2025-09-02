/**
 * Resolver for the transfers field of the TransactionResult type.
 * This module retrieves token transfers associated with a transaction in a paginated connection format.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { TransactionResultResolvers } from '../../../config/graphql-types';
import { buildTransferOutput } from '../../output/build-transfer-output';
import zod from 'zod';

/**
 * Zod schema for validating the transaction input parameter.
 * Requires a non-nullable string for the databaseTransactionId field.
 */
const schema = zod.object({ databaseTransactionId: zod.string() });

/**
 * Resolver function for the transfers field of the TransactionResult type.
 * Retrieves a paginated connection of token transfers associated with the specified transaction.
 *
 * @param parent - The parent object containing the databaseTransactionId parameter
 * @param args - GraphQL pagination arguments (first, after, before, last)
 * @param context - The resolver context containing repositories and services
 * @returns A connection object with edges containing transfer nodes, pagination info, and metadata for resolvers
 */
export const transfersTransactionResultResolver: TransactionResultResolvers<ResolverContext>['transfers'] =
  async (parent, args, context) => {
    const parentArgs = schema.parse(parent);
    const { first, after, before, last } = args;

    const hasTokenId = false;
    const output = await context.transferRepository.getTransfersByTransactionId({
      transactionId: parentArgs.databaseTransactionId,
      hasTokenId,
      first,
      after,
      before,
      last,
    });
    const edges = output.edges.map(e => ({
      cursor: e.cursor,
      node: buildTransferOutput(e.node),
    }));

    return {
      edges,
      pageInfo: output.pageInfo,

      // for resolvers
      hasTokenId,
      databaseTransactionId: parentArgs.databaseTransactionId,
      totalCount: -1, // Placeholder value; actual count is resolved by a separate resolver
    };
  };
