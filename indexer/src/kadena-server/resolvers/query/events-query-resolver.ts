/**
 * GraphQL resolver for the 'events' query with advanced filtering
 *
 * This file implements the resolver for the 'events' query in the GraphQL schema,
 * which allows clients to retrieve blockchain events with various filtering options.
 * Events represent actions or state changes that occurred during transaction execution
 * on the Kadena blockchain.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildEventOutput } from '../output/build-event-output';

/**
 * Resolver function for the 'events' query
 *
 * This resolver handles requests for blockchain event data with support for various
 * filtering parameters and pagination. It delegates to the event repository
 * to fetch the filtered data from the database, then transforms the results into
 * the GraphQL-compatible format using the event builder.
 *
 * The resolver supports multiple filtering dimensions:
 * - By qualified event name (module.name format)
 * - By block hash or height range
 * - By chain ID
 * - By transaction request key
 * - By minimum confirmation depth
 *
 * The resolver implements the GraphQL Connection specification for pagination,
 * returning edges with cursors, pageInfo for navigation, and additional metadata
 * that will be used by field resolvers (like totalCount).
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments containing filtering and pagination parameters
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to an events connection with edges, pagination info, and metadata
 */
export const eventsQueryResolver: QueryResolvers<ResolverContext>['events'] = async (
  _parent,
  args,
  context,
) => {
  const {
    after,
    first,
    last,
    before,
    blockHash,
    chainId,
    maxHeight,
    minHeight,
    minimumDepth,
    requestKey,
    qualifiedEventName,
    moduleName,
  } = args;
  const output = await context.eventRepository.getEvents({
    qualifiedEventName,
    after,
    before,
    first,
    last,
    blockHash,
    chainId,
    maxHeight,
    minHeight,
    minimumDepth,
    requestKey,
    moduleName,
  });

  const edges = output.edges.map(e => ({
    cursor: e.cursor,
    node: buildEventOutput(e.node),
  }));

  return {
    edges,
    pageInfo: output.pageInfo,
    // for resolvers
    totalCount: -1,
    blockHash,
    chainId,
    maxHeight,
    minHeight,
    minimumDepth,
    requestKey,
    qualifiedEventName,
    moduleName,
  };
};
