/**
 * Cache initialization and management for the Kadena Indexer
 *
 * This file implements an in-memory caching system using node-cache to improve
 * performance by reducing repeated database queries and network requests for
 * frequently accessed data. The cache primarily stores network statistics, node
 * information, and blockchain metrics that are expensive to calculate but do not
 * need to be real-time accurate to the millisecond.
 *
 * The caching system:
 * - Initializes cache with default values
 * - Periodically refreshes cached data in the background
 * - Handles errors gracefully to prevent service disruption
 * - Maintains a standard TTL (Time To Live) for cached items
 */

import { ResolverContext } from '../kadena-server/config/apollo-server-config';
import NodeCache from 'node-cache';
import {
  COUNTERS_OF_EACH_CHAIN_KEY,
  HASH_RATE_AND_TOTAL_DIFFICULTY_KEY,
  NETWORK_STATISTICS_KEY,
  NODE_INFO_KEY,
} from './keys';
import { HashRateAndTotalDifficulty } from '../kadena-server/repository/application/network-repository';

/**
 * Global in-memory cache instance
 *
 * Standard TTL of 0 means cache items never expire automatically.
 * Instead, we manually refresh data on a set interval.
 */
export const MEMORY_CACHE = new NodeCache({ stdTTL: 0 });

/**
 * Refresh interval for cached data in milliseconds (30 seconds)
 *
 * This value determines how frequently the cached data is refreshed
 * from the original data sources. A balance between freshness and
 * system load.
 */
const CACHE_TTL = 1000 * 30; // 30 seconds

/**
 * Initialize and configure the caching system
 *
 * Sets up the cache with initial values and starts a background refresh
 * process that periodically updates the cached data. This function is called
 * during server startup to ensure the cache is ready before handling requests.
 *
 * @param context - The GraphQL resolver context containing repository instances
 */
export default async function initCache(context: ResolverContext) {
  const { blockRepository, networkRepository } = context;

  /**
   * Fetches and caches network hash rate and total difficulty
   *
   * This data provides insights into network mining performance and security.
   * If new data cannot be retrieved, it preserves the previous total difficulty
   * value to prevent data loss.
   */
  async function getHashRateAndTotalDifficulty() {
    try {
      const chainIds = await blockRepository.getChainIds();
      const { networkHashRate, totalDifficulty } =
        await networkRepository.getHashRateAndTotalDifficulty(chainIds);

      const oldValue = MEMORY_CACHE.get(
        HASH_RATE_AND_TOTAL_DIFFICULTY_KEY,
      ) as HashRateAndTotalDifficulty;

      const newValue: HashRateAndTotalDifficulty = {
        networkHashRate: networkHashRate,
        totalDifficulty: totalDifficulty ?? oldValue.totalDifficulty,
      };
      MEMORY_CACHE.set(HASH_RATE_AND_TOTAL_DIFFICULTY_KEY, newValue);
    } catch (err) {
      console.error(
        '[ERROR][CACHE][CONN_TIMEOUT] Failed to get hash rate and total difficulty',
        err,
      );
    }
  }

  /**
   * Fetches and caches general network statistics
   *
   * These statistics include metrics about blockchain performance,
   * transaction throughput, and other network-wide indicators.
   */
  async function getNetworkStatistics() {
    try {
      const networkStatistics = await networkRepository.getNetworkStatistics();
      MEMORY_CACHE.set(NETWORK_STATISTICS_KEY, networkStatistics);
    } catch (err) {
      console.error('[ERROR][CACHE][CONN_TIMEOUT] Failed to get network statistics', err);
    }
  }

  /**
   * Fetches and caches information about the blockchain node
   *
   * This includes node version, connectivity status, and other
   * node-specific information that helps monitor the node's health.
   */
  async function getNodeInfo() {
    try {
      const nodeInfo = await networkRepository.getNodeInfo();
      MEMORY_CACHE.set(NODE_INFO_KEY, nodeInfo);
    } catch (err) {
      console.error('[ERROR][CACHE][CONN_TIMEOUT] Failed to get node info', err);
    }
  }

  /**
   * Fetches and caches information about the blockchain node
   *
   * This includes node version, connectivity status, and other
   * node-specific information that helps monitor the node's health.
   */

  async function getCountersOfEachChain() {
    try {
      const counters = await networkRepository.getCountersOfEachChain();
      MEMORY_CACHE.set(COUNTERS_OF_EACH_CHAIN_KEY, counters);
    } catch (err) {
      console.error('[ERROR][CACHE][CONN_TIMEOUT] Failed to get counters of each chain', err);
    }
  }

  // Initialize the hash rate cache with a default value
  // The -1 value indicates that real data hasn't been loaded yet
  MEMORY_CACHE.set(HASH_RATE_AND_TOTAL_DIFFICULTY_KEY, {
    totalDifficulty: -1,
  });

  /**
   * Combined function to refresh all cached data
   *
   * This is called both during initialization and on the refresh interval
   * to ensure all cached data is updated in a single batch.
   */
  const getAllInfo = async () => {
    await getNetworkStatistics();
    await getNodeInfo();
    await getHashRateAndTotalDifficulty();
    await getCountersOfEachChain();
  };

  // Populate cache with initial data
  getAllInfo();

  // Set up periodic refresh of cached data
  setInterval(getAllInfo, CACHE_TTL);
}
