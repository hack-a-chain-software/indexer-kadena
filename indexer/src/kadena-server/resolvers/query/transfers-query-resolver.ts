/**
 * GraphQL resolver for the 'transfers' query with filtering and pagination
 *
 * This file implements the resolver for the 'transfers' query in the GraphQL schema,
 * which allows clients to retrieve token transfer records with various filtering options.
 * It supports querying both fungible and non-fungible token transfers across the blockchain.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildTransferOutput } from '../output/build-transfer-output';

/**
 * Resolver function for the 'transfers' query
 *
 * This resolver handles requests for token transfer data with support for various
 * filtering parameters and pagination. It delegates to the transfer repository
 * to fetch the filtered data from the database, then transforms the results into
 * the GraphQL-compatible format using the transfer builder.
 *
 * The resolver implements the GraphQL Connection specification for pagination,
 * returning edges with cursors, pageInfo for navigation, and additional metadata
 * that will be used by field resolvers (like totalCount).
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments containing filtering and pagination parameters
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to a transfers connection with edges, pagination info, and metadata
 */
export const transfersQueryResolver: QueryResolvers<ResolverContext>['transfers'] = async (
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
    isNFT,
  } = args;

  if (isNFT && fungibleName) {
    throw new Error('[ERROR][GRAPHQL][VALID_PARAM] isNFT and fungibleName cannot be used together');
  }

  // Call the repository layer to retrieve the filtered and paginated transfers
  const output = await context.transferRepository.getTransfers({
    blockHash,
    accountName,
    chainId,
    fungibleName,
    requestKey,
    first,
    last,
    before,
    after,
    hasTokenId: isNFT,
  });

  // Transform repository outputs into GraphQL-compatible transfer nodes
  const edges = output.edges.map(e => ({
    cursor: e.cursor,
    node: buildTransferOutput(e.node),
  }));

  // Return a complete GraphQL connection object with:
  // 1. Transformed transfer edges
  // 2. Pagination information for navigating the result set
  // 3. Additional metadata needed by related field resolvers (like totalCount)
  // 4. Filter parameters to support field resolvers that need this context
  return {
    edges,
    pageInfo: output.pageInfo,
    // Set totalCount to -1 as a signal that it needs to be resolved separately
    totalCount: -1,
    // Include all filter parameters to support field resolvers
    accountName,
    blockHash,
    chainId,
    fungibleName,
    requestKey,
    hasTokenId: isNFT,
  };
};
