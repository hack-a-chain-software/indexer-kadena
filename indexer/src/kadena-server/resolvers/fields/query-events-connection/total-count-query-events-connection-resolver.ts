/**
 * Resolver for the totalCount field of the QueryEventsConnection type.
 * This module counts blockchain events based on various filter criteria.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { QueryEventsConnectionResolvers } from '../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating event query parameters.
 * Defines the structure and types of filter parameters used to count events.
 * Note that qualifiedEventName is required, while other filters are optional.
 */
const schema = zod.object({
  blockHash: zod.string().nullable().optional(),
  chainId: zod.string().nullable().optional(),
  maxHeight: zod.number().nullable().optional(),
  minHeight: zod.number().nullable().optional(),
  minimumDepth: zod.number().nullable().optional(),
  requestKey: zod.string().nullable().optional(),
  qualifiedEventName: zod.string().nullable().optional(),
  moduleName: zod.string().nullable().optional(),
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
export const totalCountQueryEventsConnectionResolver: QueryEventsConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const {
      blockHash,
      chainId,
      maxHeight,
      minHeight,
      minimumDepth,
      requestKey,
      qualifiedEventName,
      moduleName,
    } = schema.parse(parent);

    const output = await context.eventRepository.getTotalEventsCount({
      blockHash,
      chainId,
      maxHeight,
      minHeight,
      minimumDepth,
      requestKey,
      qualifiedEventName,
      moduleName,
    });
    return output;
  };
