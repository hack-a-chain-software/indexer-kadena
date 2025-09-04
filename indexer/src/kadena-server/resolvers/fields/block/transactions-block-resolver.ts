/**
 * Resolver for the transactions field of the Block type.
 * This module retrieves transactions associated with a specific block in a paginated connection format.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { BlockResolvers } from '../../../config/graphql-types';
import { buildTransactionOutput } from '../../output/build-transaction-output';

/**
 * Resolver function for the transactions field of the Block type.
 * Retrieves a paginated connection of transactions associated with the specified block.
 *
 * @param parent - The parent object containing the block hash
 * @param args - GraphQL pagination arguments (first, after, before, last)
 * @param context - The resolver context containing repositories and services
 * @returns A connection object with edges containing transaction nodes, pagination info, and metadata for resolvers
 */
export const transactionsBlockResolver: BlockResolvers<ResolverContext>['transactions'] = async (
  parent,
  args,
  context,
) => {
  const { hash } = parent;
  const { first, last, before, after } = args;
  const output = await context.transactionRepository.getTransactions({
    blockHash: hash,
    isCoinbase: false,
    first,
    last,
    before,
    after,
  });

  const edges = output.edges.map(e => {
    return {
      cursor: e.cursor,
      node: buildTransactionOutput(e.node),
    };
  });

  return {
    edges,
    pageInfo: output.pageInfo,
    // for resolvers
    blockHash: hash,
    totalCount: -1, // Placeholder value; actual count is resolved by a separate resolver
  };
};
