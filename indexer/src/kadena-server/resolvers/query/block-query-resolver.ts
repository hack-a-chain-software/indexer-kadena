/**
 * GraphQL resolver for the 'block' query
 *
 * This file implements the resolver for the 'block' query in the GraphQL schema,
 * which allows clients to retrieve a single block by its hash. It serves as the
 * entry point for block-specific data exploration in the API.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { Block, QueryResolvers } from '../../config/graphql-types';
import { buildBlockOutput } from '../output/build-block-output';

/**
 * Resolver function for the 'block' query
 *
 * This resolver handles requests for a specific blockchain block identified by its
 * hash. It delegates to the block repository to fetch the block data from the database,
 * then transforms the result into the GraphQL-compatible format using the block builder.
 *
 * The resolver acts as a thin layer between the GraphQL schema and the data access layer,
 * primarily handling parameter extraction and result transformation.
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments containing the block hash
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to a GraphQL-compatible Block object or null if not found
 */
export const blockQueryResolver: QueryResolvers<ResolverContext>['block'] = async (
  _parent,
  args,
  context,
): Promise<Block | null> => {
  const { hash } = args;
  const output = await context.blockRepository.getBlockByHash(hash);

  if (!output) {
    throw new Error('[ERROR][DB][DATA_MISSING] Block not found.');
  }

  return buildBlockOutput(output);
};
