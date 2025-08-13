/**
 * GraphQL resolver for the 'blocksFromDepth' query
 *
 * This file implements the resolver for the 'blocksFromDepth' query in the GraphQL schema,
 * which allows clients to retrieve blocks that have reached a specific confirmation depth
 * (number of confirmations). This is particularly useful for applications that need data
 * with a certain level of finality.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildBlockOutput } from '../output/build-block-output';

/**
 * Resolver function for the 'blocksFromDepth' query
 *
 * This resolver handles requests for blockchain blocks filtered by confirmation depth.
 * It delegates to the block repository to fetch blocks that have reached the
 * minimum confirmation depth specified in the arguments, then transforms the
 * results into the GraphQL-compatible format using the block builder.
 *
 * The resolver supports filtering by chain ID and implements the GraphQL Connection
 * specification for pagination, returning edges with cursors and pageInfo for navigation.
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments including minimumDepth, chainIds, and pagination parameters
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to a blocks connection with edges and pagination info
 */
export const blocksFromDepthQueryResolver: QueryResolvers<ResolverContext>['blocksFromDepth'] =
  async (_parent, args, context) => {
    const { minimumDepth, after, before, chainIds, first, last } = args;
    const output = await context.blockRepository.getBlocksFromDepth({
      minimumDepth,
      after,
      before,
      first,
      last,
      chainIds,
    });

    const edges = output.edges.map(e => ({
      cursor: e.cursor,
      node: buildBlockOutput(e.node),
    }));

    return {
      edges,
      pageInfo: output.pageInfo,
      totalCount: -1,
      // Include all filter parameters to support field resolvers that need this context
      chainIds,
      minimumDepth,
    };
  };
