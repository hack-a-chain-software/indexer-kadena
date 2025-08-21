/**
 * Database and API implementation of the NetworkRepository interface
 *
 * This file provides a concrete implementation of the NetworkRepository interface that
 * retrieves network statistics, hash rate, difficulty, and node information through a
 * combination of database queries and API calls to the Kadena blockchain node.
 * It supports both cached and real-time data access for optimized performance.
 */

import { Op } from 'sequelize';
import BlockModel from '../../../../models/block';
import NetworkRepository, {
  CountersOfEachChain,
  CurrentChainHeights,
  GetNodeInfo,
  HashRateAndTotalDifficulty,
  NetworkStatistics,
} from '../../application/network-repository';
import {
  BlockWithDifficulty,
  calculateBlockDifficulty,
  calculateTotalDifficulty,
} from '../../../../utils/difficulty';
import { calculateNetworkHashRate } from '../../../../utils/hashrate';
import { rootPgPool } from '../../../../config/database';
import { nodeInfoValidator } from '../schema-validator/node-info-validator';
import { getRequiredEnvString } from '../../../../utils/helpers';
import { MEMORY_CACHE } from '../../../../cache/init';
import {
  COUNTERS_OF_EACH_CHAIN_KEY,
  HASH_RATE_AND_TOTAL_DIFFICULTY_KEY,
  NETWORK_STATISTICS_KEY,
} from '../../../../cache/keys';
import { getCirculationNumber } from '../../../../utils/coin-circulation';

// Configuration values from environment variables
const HOST_URL = getRequiredEnvString('NODE_API_URL');
const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

// Cache key for node information
const NODE_INFO_KEY = 'NODE_INFO_KEY';

/**
 * Database and API implementation of the NetworkRepository interface
 *
 * This class provides methods to retrieve network-wide statistics and information
 * about the Kadena blockchain by combining database queries and direct API calls.
 * It implements caching strategies for frequently accessed data to improve
 * performance and reduce load on both the database and blockchain nodes.
 *
 * Key features:
 * - Combined data access through database and API endpoints
 * - In-memory caching for frequently accessed network statistics
 * - Hash rate and difficulty calculations based on recent blocks
 * - Coinbase reward tracking for circulation calculations
 */
export default class NetworkDbRepository implements NetworkRepository {
  /**
   * Retrieves the current blockchain height (cut) from the node API
   *
   * This method makes an API call to the Kadena node to get the current
   * cut information, which represents the most recent block height known
   * to the network.
   *
   * @returns Promise resolving to the current blockchain height as a number
   */
  async getCut(): Promise<number> {
    const response = await fetch(`${SYNC_BASE_URL}/${NETWORK_ID}/cut`, {
      method: 'GET',
      headers: {
        accept: 'application/json;charset=utf-8, application/json',
        'cache-control': 'no-cache',
      },
    });
    const data = await response.json();

    return data.height as number;
  }

  /**
   * Gets the creation timestamp of the most recent indexed block
   *
   * Queries the database for the creation time of the block with the
   * highest ID, which should be the most recently indexed block.
   *
   * @returns Promise resolving to the creation time as a Unix timestamp (in seconds)
   */
  async getLatestCreationTime(): Promise<number> {
    const creationTimeQuery = `
      SELECT b."creationTime"
      FROM "Blocks" b
      WHERE b.id = (SELECT max(id) from "Blocks");
  `;

    const { rows } = await rootPgPool.query(creationTimeQuery);

    const firstRow = rows?.[0]?.creationTime;
    const latestCreationTime = parseInt(firstRow, 10);

    return latestCreationTime;
  }

  /**
   * Calculates the total number of coins in circulation
   *
   * Uses the blockchain height and latest block creation time to
   * determine the total number of KDA coins that have been minted
   * through mining rewards.
   *
   * @private
   * @returns Promise resolving to the total coins in circulation
   */
  private async getCoinsInCirculation() {
    const cutHeight = await this.getCut();
    const latestCreationTime = await this.getLatestCreationTime();
    const rewards = await getCirculationNumber(cutHeight, latestCreationTime);
    return rewards;
  }

  /**
   * Retrieves key network statistics including transaction count and coins in circulation
   *
   * Combines database queries for transaction count with calculations for
   * total coin circulation to provide a comprehensive network statistics overview.
   *
   * @returns Promise resolving to a NetworkStatistics object
   */
  async getNetworkStatistics() {
    const totalTransactionsCountQuery = `
      SELECT sum("canonicalTransactions") as "totalTransactionsCount" from "Counters"
    `;

    const { rows: totalTransactionsCountRows } = await rootPgPool.query(
      totalTransactionsCountQuery,
    );
    const transactionCount = parseInt(totalTransactionsCountRows[0].totalTransactionsCount, 10);

    const coinsInCirculation = await this.getCoinsInCirculation();

    const output = {
      coinsInCirculation,
      transactionCount,
    };

    return output;
  }

  /**
   * Calculates the current network hash rate and total difficulty
   *
   * This method:
   * 1. Retrieves the most recent blocks from the database
   * 2. Calculates the difficulty of each block based on its target
   * 3. Computes the network hash rate by analyzing block timing and difficulty
   * 4. Sums the difficulty across all chains to get the total network difficulty
   *
   * @param chainIds - Array of chain IDs to include in the difficulty calculations
   * @returns Promise resolving to hash rate and total difficulty values
   */
  async getHashRateAndTotalDifficulty(chainIds: number[]) {
    const lastBlock = await BlockModel.findOne({
      order: [['height', 'DESC']],
      attributes: ['height'],
    });

    const currentHeight = lastBlock?.height ?? 0;

    const blocks = await BlockModel.findAll({
      where: {
        height: {
          [Op.gte]: Number(currentHeight) - 4,
        },
      },
      attributes: ['creationTime', 'target', 'height', 'chainId'],
    });

    const blocksWithDifficulty: BlockWithDifficulty[] = [];

    for (const block of blocks) {
      const timestampInMilliseconds = Number(block.creationTime); // Convert to milliseconds
      const creationTime = new Date(timestampInMilliseconds / 1000);
      blocksWithDifficulty.push({
        creationTime: Number(block.creationTime),
        creationTimeDate: creationTime,
        difficulty: calculateBlockDifficulty(block.target),
        height: BigInt(block.height),
        chainId: BigInt(block.chainId),
      });
    }

    const output = {
      networkHashRate: Number(calculateNetworkHashRate(blocksWithDifficulty)),
      totalDifficulty: Number(
        calculateTotalDifficulty(BigInt(currentHeight), blocksWithDifficulty, chainIds),
      ),
    };

    return output;
  }

  /**
   * Retrieves detailed information about the blockchain node
   *
   * Makes an API call to the node's info endpoint to get details about
   * the node's configuration, version, supported chains, and network details.
   * The response is validated against a schema to ensure data integrity.
   *
   * @returns Promise resolving to validated node information
   */
  async getNodeInfo(): Promise<GetNodeInfo> {
    const response = await fetch(`${HOST_URL}/info`, {
      method: 'GET',
      headers: {
        accept: 'application/json;charset=utf-8, application/json',
        'cache-control': 'no-cache',
      },
    });
    const data = await response.json();

    const output = nodeInfoValidator.validate(data);
    return output;
  }

  async getCurrentChainHeights(): Promise<CurrentChainHeights> {
    const heightsQuery = `
      SELECT "chainId", "canonicalBlocks" FROM "Counters" ORDER BY "canonicalBlocks"
    `;

    const { rows } = await rootPgPool.query(heightsQuery);

    const output = rows.reduce((acc, row) => {
      acc[row.chainId] = row.canonicalBlocks;
      return acc;
    }, {} as CurrentChainHeights);

    return output;
  }

  async getCountersOfEachChain(): Promise<CountersOfEachChain[]> {
    const countersQuery = `
      SELECT "chainId", "canonicalBlocks", "canonicalTransactions", "totalGasUsed"
      FROM "Counters"
      ORDER BY "chainId"
    `;

    const { rows } = await rootPgPool.query(countersQuery);

    const output = rows.map(row => {
      return {
        chainId: row.chainId,
        blocksCount: row.canonicalBlocks,
        transactionCount: row.canonicalTransactions,
        totalGasUsedInKda: row.totalGasUsed,
      };
    });

    return output;
  }

  /**
   * Retrieves all network information from cache
   *
   * This method combines node information, network statistics, and
   * hash rate data from the in-memory cache for efficient access.
   * The data is periodically refreshed by background processes.
   *
   * @returns Promise resolving to combined network information
   */
  async getAllInfo() {
    const nodeInfo = MEMORY_CACHE.get(NODE_INFO_KEY) as GetNodeInfo;
    const networkStatistics = MEMORY_CACHE.get(NETWORK_STATISTICS_KEY) as NetworkStatistics;
    const HashRateAndTotalDifficulty = MEMORY_CACHE.get(
      HASH_RATE_AND_TOTAL_DIFFICULTY_KEY,
    ) as HashRateAndTotalDifficulty;
    const countersOfEachChain = MEMORY_CACHE.get(
      COUNTERS_OF_EACH_CHAIN_KEY,
    ) as CountersOfEachChain[];

    return {
      ...nodeInfo,
      ...networkStatistics,
      ...HashRateAndTotalDifficulty,
      countersOfEachChain,
    };
  }
}
