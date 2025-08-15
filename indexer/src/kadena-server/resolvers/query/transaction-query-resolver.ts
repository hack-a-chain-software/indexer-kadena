/**
 * GraphQL resolver for the 'transaction' query
 *
 * This file implements the resolver for the 'transaction' query in the GraphQL schema,
 * which allows clients to retrieve a specific transaction by its request key,
 * optionally filtering by block hash or confirmation depth.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildTransactionOutput } from '../output/build-transaction-output';

/**
 * Resolver function for the 'transaction' query
 *
 * This resolver handles requests for a specific blockchain transaction identified by its
 * request key. It delegates to the transaction repository to fetch the transaction data,
 * then transforms the result into the GraphQL-compatible format using the transaction builder.
 *
 * The resolver also handles chain reorganizations by identifying and returning any orphaned
 * versions of the transaction (transactions that were included in blocks that are no longer
 * part of the main chain). It orders the transactions by block depth, with the "canonical"
 * transaction (the one in the deepest/most confirmed block) returned as the main result.
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments including requestKey, optional blockHash, and minimumDepth
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to the transaction object with any orphaned versions, or null if not found
 */
export const transactionQueryResolver: QueryResolvers<ResolverContext>['transaction'] = async (
  _parent,
  args,
  context,
) => {
  const { requestKey, blockHash, minimumDepth } = args;

  if (minimumDepth !== undefined && minimumDepth !== null && minimumDepth < 1) {
    throw new Error('Minimum depth must not be lower than 1.');
  }

  if (minimumDepth !== undefined && minimumDepth !== null && minimumDepth > 100) {
    throw new Error('Minimum depth must not be higher than 100.');
  }

  const currentChainHeights = await context.networkRepository.getCurrentChainHeights();
  const transactions = await context.transactionRepository.getTransactionsByRequestKey({
    requestKey,
    blockHash,
    minimumDepth,
    currentChainHeights,
  });

  if (transactions.length === 0) return null;

  const [canonical, ...orphanedTransactions] = transactions;

  return {
    ...buildTransactionOutput(canonical),
    orphanedTransactions: orphanedTransactions.map(tx => buildTransactionOutput(tx)),
  };
};
