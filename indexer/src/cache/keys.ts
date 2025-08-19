/**
 * Cache key constants for the memory cache system
 *
 * This file defines standardized string constants used as keys in the
 * application's in-memory cache. Using defined constants instead of
 * string literals ensures consistency and prevents typos when accessing
 * cached data throughout the application.
 */

/**
 * Key for caching hash rate and total difficulty data
 * Used to store and retrieve network mining statistics
 */
export const HASH_RATE_AND_TOTAL_DIFFICULTY_KEY = 'HASH_RATE_AND_TOTAL_DIFFICULTY_KEY';

/**
 * Key for caching network statistics data
 * Used to store and retrieve general performance metrics of the Kadena network
 */
export const NETWORK_STATISTICS_KEY = 'NETWORK_STATISTICS_KEY';

/**
 * Key for caching node information data
 * Used to store and retrieve information about the blockchain node
 */
export const NODE_INFO_KEY = 'NODE_INFO_KEY';

/**
 * Key for caching counters of each chain data
 * Used to store and retrieve information about the numbers of entities in each chain
 */
export const COUNTERS_OF_EACH_CHAIN_KEY = 'COUNTERS_OF_EACH_CHAIN_KEY';
