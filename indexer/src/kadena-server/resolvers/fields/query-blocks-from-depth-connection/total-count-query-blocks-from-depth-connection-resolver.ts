/**
 * Resolver for the totalCount field of the QueryEventsConnection type.
 * This module counts blockchain events based on various filter criteria.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { QueryBlocksFromDepthConnectionResolvers } from '../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating event query parameters.
 * Defines the structure and types of filter parameters used to count events.
 * Note that qualifiedEventName is required, while other filters are optional.
 */
const schema = zod.object({
  chainIds: zod.array(zod.string()).optional(),
  minimumDepth: zod.number().nullable().optional(),
});

/**
 * Resolver function for the totalCount field of the QueryEventsConnection type.
 * Retrieves the total count of events matching the provided filter criteria.
 *
 * @param parent - The parent object containing filter parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of events matching the criteria
 */
export const totalCountQueryBlocksFromDepthConnectionResolver: QueryBlocksFromDepthConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { minimumDepth, chainIds } = schema.parse(parent);

    const output = await context.blockRepository.getTotalCount({
      chainIds,
      minimumDepth: minimumDepth ?? 0,
    });
    return output;
  };
