/**
 * GraphQL resolver for the 'transactions' query with advanced filtering
 *
 * This module implements a GraphQL resolver for the 'transactions' query in the Kadena blockchain indexer.
 * The resolver provides a flexible interface for querying blockchain transactions with various
 * filtering criteria and pagination support.
 *
 * Key features include:
 * 1. Filtering transactions by account, block, chain, token, or request key
 * 2. Support for height-based and confirmation depth-based filtering
 * 3. Cursor-based pagination with first/last and before/after parameters
 * 4. Proper GraphQL connection pattern implementation for large result sets
 * 5. Input validation to ensure at least one filtering parameter is provided
 *
 * This resolver bridges the GraphQL API layer with the repository layer, providing
 * a clean interface for transaction data access.
 */

import { isNullOrUndefined } from '@/utils/helpers';
import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildTransactionOutput } from '../output/build-transaction-output';

/**
 * GraphQL resolver function for the 'transactions' query.
 *
 * This resolver handles requests for transaction data with support for various
 * filtering parameters and pagination. It enforces business rules about required parameters
 * and transforms repository data into the format expected by the GraphQL schema.
 *
 * The resolver implements the GraphQL Connection specification for pagination,
 * returning edges with cursors, pageInfo for navigation, and additional metadata
 * that will be used by field resolvers (like totalCount).
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments containing filtering and pagination parameters
 * @param context - Resolver context containing the repository implementations
 * @returns Promise resolving to a transaction connection with edges, pagination info, and metadata
 * @throws Error if no filtering parameters are provided
 */
export const transactionsQueryResolver: QueryResolvers<ResolverContext>['transactions'] = async (
  _parent,
  args,
  context,
) => {
  // Extract all query parameters from the GraphQL arguments
  const {
    after,
    before,
    first,
    last,
    accountName,
    blockHash,
    chainId,
    fungibleName,
    requestKey,
    maxHeight,
    minHeight,
    minimumDepth,
    isCoinbase,
  } = args;

  // Call the repository layer to retrieve the filtered and paginated transactions
  // Pass all parameters through to maintain complete filtering flexibility
  const output = await context.transactionRepository.getTransactions({
    blockHash,
    accountName,
    chainId,
    fungibleName,
    requestKey,
    maxHeight,
    minHeight,
    minimumDepth,
    isCoinbase,
    first,
    last,
    before,
    after,
  });

  // Transform repository outputs into GraphQL-compatible transaction nodes
  // The buildTransactionOutput helper formats data according to the GraphQL schema
  const edges = output.edges.map(e => ({
    cursor: e.cursor,
    node: buildTransactionOutput(e.node),
  }));

  // Return a complete GraphQL connection object with:
  // 1. Transformed transaction edges
  // 2. Pagination information for navigating the result set
  // 3. Additional metadata needed by related field resolvers
  // 4. A placeholder totalCount that will be resolved by a field resolver
  return {
    edges,
    pageInfo: output.pageInfo,
    // Set totalCount to -1 as a signal that it needs to be resolved separately
    // This prevents an additional count query for clients that don't request the count
    totalCount: -1,
    // Include all filter parameters to support field resolvers that need this context
    accountName,
    blockHash,
    chainId,
    maxHeight,
    minHeight,
    minimumDepth,
    isCoinbase,
    fungibleName,
    requestKey,
  };
};
