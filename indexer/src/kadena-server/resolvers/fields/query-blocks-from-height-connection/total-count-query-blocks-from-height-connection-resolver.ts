/**
 * Resolver for the totalCount field of the QueryEventsConnection type.
 * This module counts blockchain events based on various filter criteria.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { QueryBlocksFromHeightConnectionResolvers } from '../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating event query parameters.
 * Defines the structure and types of filter parameters used to count events.
 * Note that qualifiedEventName is required, while other filters are optional.
 */
const schema = zod.object({
  chainIds: zod.array(zod.string()).optional(),
  startHeight: zod.number(),
  endHeight: zod.number().nullable().optional(),
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
export const totalCountQueryBlocksFromHeightConnectionResolver: QueryBlocksFromHeightConnectionResolvers<ResolverContext>['totalCount'] =
  async (parent, _args, context) => {
    const { startHeight, endHeight, chainIds: chainIdsParam } = schema.parse(parent);

    if (endHeight && startHeight > endHeight) {
      throw new Error('Start height cannot be greater than end height');
    }

    let chainIds = [];
    if (chainIdsParam?.length) {
      chainIds = [...chainIdsParam];
    } else {
      const networkInfo = await context.networkRepository.getAllInfo();
      chainIds = [...networkInfo.nodeChains];
    }

    const currentChainHeights = await context.networkRepository.getCurrentChainHeights();
    const startHeightOfChainsFrom9to19 = 852054;
    const totalCount = chainIds.reduce((acum, chainId) => {
      const endHeightToUse = endHeight ?? currentChainHeights[chainId];
      let totalOfChain = endHeightToUse - startHeight + 1;
      if (Number(chainId) > 9) {
        if (startHeight >= startHeightOfChainsFrom9to19) {
          totalOfChain = endHeightToUse - startHeight + 1;
        } else if (endHeightToUse < startHeightOfChainsFrom9to19) {
          totalOfChain = 0;
        } else {
          totalOfChain = endHeightToUse - startHeightOfChainsFrom9to19 + 1;
        }
      }
      return totalOfChain + acum;
    }, 0);

    return totalCount;
  };
