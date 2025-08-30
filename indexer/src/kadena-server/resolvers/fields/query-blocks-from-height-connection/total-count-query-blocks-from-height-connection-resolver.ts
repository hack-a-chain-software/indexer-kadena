/**
 * Resolver for the totalCount field of the QueryBlocksFromHeightConnection type.
 * This module counts blockchain blocks based on various filter criteria.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { QueryBlocksFromHeightConnectionResolvers } from '../../../config/graphql-types';
import zod from 'zod';

/**
 * Zod schema for validating block query parameters.
 * Defines the structure and types of filter parameters used to count blocks.
 */
const schema = zod.object({
  chainIds: zod.array(zod.string()).optional(),
  startHeight: zod.number(),
  endHeight: zod.number().nullable().optional(),
});

/**
 * Interface for genesis height information
 */
interface GenesisHeight {
  chainId: string;
  height: number;
}

/**
 * Interface for current chain heights
 */
interface CurrentChainHeights {
  [chainId: string]: number;
}

/**
 * Calculates the total count of blocks based on chain IDs and height ranges.
 *
 * Logic:
 * - Chains 0-9: Start from genesis height (typically 0) to current/end height
 * - Chains 10-19: Start from their specific genesis height to current/end height
 *
 * @param startHeight - The starting height for the query
 * @param endHeight - The ending height for the query (null means use current heights)
 * @param chainIds - Array of chain IDs to include (empty means all chains)
 * @param genesisHeights - Array of genesis height information for each chain
 * @param currentChainHeights - Current maximum height for each chain
 * @returns The total count of blocks across all specified chains
 */
function calculateTotalBlockCount(
  startHeight: number,
  endHeight: number | null,
  chainIds: string[],
  genesisHeights: GenesisHeight[],
  currentChainHeights: CurrentChainHeights,
): number {
  // Create a map for quick lookup of genesis heights
  const genesisHeightMap = genesisHeights.reduce(
    (map, { chainId, height }) => {
      map[chainId] = height;
      return map;
    },
    {} as Record<string, number>,
  );

  return chainIds.reduce((totalCount, chainId) => {
    const genesisHeight = genesisHeightMap[chainId] ?? 0;
    const currentMaxHeight = currentChainHeights[chainId] ?? 0;

    // Use the minimum of provided endHeight and actual max height in database
    const endHeightToUse =
      endHeight === null || endHeight === undefined
        ? currentMaxHeight
        : Math.min(endHeight, currentMaxHeight);

    // Ensure we don't go below the genesis height for any chain
    const effectiveStartHeight = Math.max(startHeight, genesisHeight);

    // If the effective start height is greater than the end height, no blocks exist in this range
    if (effectiveStartHeight > endHeightToUse) {
      return totalCount; // No blocks to add for this chain
    }

    // Calculate the count for this chain
    const chainBlockCount = endHeightToUse - effectiveStartHeight + 1;

    return totalCount + chainBlockCount;
  }, 0);
}

/**
 * Resolver function for the totalCount field of the QueryBlocksFromHeightConnection type.
 * Retrieves the total count of blocks matching the provided filter criteria.
 *
 * @param parent - The parent object containing filter parameters
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The total count of blocks matching the criteria
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

    const networkInfo = await context.networkRepository.getAllInfo();
    const currentChainHeights = await context.networkRepository.getCurrentChainHeights();

    const totalCount = calculateTotalBlockCount(
      startHeight,
      endHeight ?? null,
      chainIds,
      networkInfo.genesisHeights,
      currentChainHeights,
    );

    return totalCount;
  };
