/**
 * GraphQL resolver for the 'blocksFromHeight' query
 *
 * This file implements the resolver for the 'blocksFromHeight' query in the GraphQL schema,
 * which allows clients to retrieve blocks within a specific height range (or starting from
 * a specific height), with support for pagination and chain filtering.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildBlockOutput } from '../output/build-block-output';

/**
 * Resolver function for the 'blocksFromHeight' query
 *
 * This resolver handles requests for blockchain blocks filtered by height.
 * It delegates to the block repository to fetch blocks within the height range
 * specified in the arguments, then transforms the results into the GraphQL-compatible
 * format using the block builder.
 *
 * The resolver implements the GraphQL Connection specification for pagination,
 * returning edges with cursors and pageInfo for navigation.
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments including height range and pagination parameters
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to a blocks connection with edges and pagination info
 */
export const blocksFromHeightQueryResolver: QueryResolvers<ResolverContext>['blocksFromHeight'] =
  async (_parent, args, context) => {
    if (args.endHeight && args.startHeight > args.endHeight) {
      throw new Error('Start height cannot be greater than end height');
    }

    const output = await context.blockRepository.getBlocksBetweenHeights(args);

    const edges = output.edges.map(e => ({
      cursor: e.cursor,
      node: buildBlockOutput(e.node),
    }));

    return {
      edges,
      pageInfo: output.pageInfo,

      startHeight: args.startHeight,
      endHeight: args.endHeight,
      chainIds: args.chainIds,
      totalCount: -1,
    };
  };
