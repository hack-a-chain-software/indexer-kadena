/**
 * Database implementation of the BlockRepository interface
 *
 * This file provides a concrete implementation of the BlockRepository interface
 * for retrieving blockchain block data from the PostgreSQL database. Blocks are
 * the fundamental units of the Kadena blockchain, containing transactions, events,
 * and metadata about the chain state.
 *
 * The implementation includes support for:
 * - Retrieving individual blocks by hash
 * - Querying blocks by height ranges and confirmation depth
 * - Supporting paginated access with cursor-based navigation
 * - Providing chain metadata and miner information
 * - Optimized batch retrieval through DataLoader patterns
 */

import { FindOptions, Op, QueryTypes } from 'sequelize';
import { rootPgPool, sequelize } from '../../../../config/database';
import BlockModel, { BlockAttributes } from '../../../../models/block';
import BlockRepository, {
  BlockOutput,
  GetBlocksBetweenHeightsParams,
  GetBlocksFromDepthParams,
  GetCompletedBlocksParams,
  GetLatestBlocksParams,
} from '../../application/block-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';
import { blockValidator } from '../schema-validator/block-schema-validator';
import Balance from '../../../../models/balance';
import { handleSingleQuery } from '../../../utils/raw-query';
import { formatGuard_NODE } from '../../../../utils/chainweb-node';
import { MEMORY_CACHE } from '../../../../cache/init';
import { NODE_INFO_KEY } from '../../../../cache/keys';
import { GetNodeInfo } from '../../application/network-repository';
import { TransactionOutput } from '../../application/transaction-repository';

/**
 * Database implementation of the BlockRepository interface
 *
 * This class provides methods to access and query blockchain block data
 * stored in the PostgreSQL database. It handles the complex SQL queries
 * needed to retrieve and filter blocks with their related data, while
 * providing rich filtering, pagination, and caching capabilities.
 */
export default class BlockDbRepository implements BlockRepository {
  /**
   * Retrieves a block by its unique hash
   *
   * This method fetches a single block from the database using its hash,
   * which uniquely identifies the block in the blockchain.
   *
   * @param hash - The block hash to look up
   * @returns Promise resolving to the block data if found
   * @throws Error if the block is not found
   */
  async getBlockByHash(hash: string) {
    const block = await BlockModel.findOne({
      where: { hash },
    });

    if (!block) {
      throw new Error('Block not found.');
    }

    return blockValidator.mapFromSequelize(block);
  }

  /**
   * Retrieves blocks that have reached a minimum confirmation depth
   *
   * This method fetches blocks that have at least the specified number of
   * confirmations, supporting cursor-based pagination for efficient navigation
   * through large result sets.
   *
   * @param params - Object containing minimum depth and pagination parameters
   * @returns Promise resolving to page info and block edges
   */
  async getBlocksFromDepth(params: GetBlocksFromDepthParams) {
    const {
      minimumDepth,
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
      chainIds,
    } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const query: FindOptions<BlockAttributes> = {
      where: {
        height: { [Op.gt]: minimumDepth ?? 0 },
        ...(after && { id: { [Op.lt]: after } }),
        ...(before && { id: { [Op.gt]: before } }),
        ...(!!chainIds?.length && { chainId: { [Op.in]: chainIds } }),
      },
      limit,
      order: [['id', order]],
    };

    const rows = await BlockModel.findAll(query);

    const edges = rows.map(row => ({
      cursor: row.id.toString(),
      node: blockValidator.mapFromSequelize(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Retrieves blocks within a specific height range
   *
   * This method fetches blocks between the specified start and end heights,
   * supporting cursor-based pagination and chain filtering for efficient
   * navigation through large result sets.
   *
   * Uses keyset pagination with compound cursors (height:id) for better performance
   * when navigating through large datasets.
   *
   * @param params - Object containing height range and pagination parameters
   * @returns Promise resolving to page info and block edges
   */
  async getBlocksBetweenHeights(params: GetBlocksBetweenHeightsParams) {
    const {
      startHeight,
      endHeight,
      after: afterEncoded,
      before: beforeEncoded,
      first,
      chainIds,
      last,
    } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const queryParams: (string | number | string[])[] = [limit, startHeight];
    let conditions = '';

    // Handle "after" cursor (for forward pagination) - decode to get both height and id
    let afterHeight, afterId;
    if (after) {
      try {
        // Try to parse as compound cursor format (height:id)
        const [height, id] = after.split(':');
        afterHeight = parseInt(height, 10);
        afterId = parseInt(id, 10);

        // Check if values are valid numbers
        if (!isNaN(afterHeight) && !isNaN(afterId)) {
          // For forward pagination with "after", we want records where:
          // (height < afterHeight) OR (height = afterHeight AND id < afterId)
          queryParams.push(afterHeight, afterId);
          conditions += `\nAND (b.height < $${queryParams.length - 1} OR (b.height = $${queryParams.length - 1} AND b.id < $${queryParams.length}))`;
          console.info(
            `[INFO][QUERY][OPTIMIZATION] Using optimized query with compound cursor: height=${afterHeight}, id=${afterId}`,
          );
        } else {
          // Old cursor format - look up the height for this ID to optimize the query
          const idValue = parseInt(after, 10);
          if (!isNaN(idValue)) {
            console.info(
              `[INFO][QUERY][OPTIMIZATION] Converting old cursor format (id=${idValue}) to optimized format`,
            );

            // Get the height for this ID with a fast lookup
            const heightQuery = `SELECT height FROM "Blocks" WHERE id = $1 LIMIT 1`;
            const { rows } = await rootPgPool.query(heightQuery, [idValue]);

            if (rows.length > 0) {
              // We found the height, now use the optimized approach
              afterHeight = rows[0].height;
              afterId = idValue;

              // Use the optimized condition
              queryParams.push(afterHeight, afterId);
              conditions += `\nAND (b.height < $${queryParams.length - 1} OR (b.height = $${queryParams.length - 1} AND b.id < $${queryParams.length}))`;
              console.info(
                `[INFO][QUERY][OPTIMIZATION] Converted to optimized query: height=${afterHeight}, id=${afterId}`,
              );
            } else {
              // Fallback if we couldn't find the height
              queryParams.push(after);
              conditions += `\nAND b.id < $${queryParams.length}`;
              console.info(
                `[INFO][QUERY][OPTIMIZATION] Could not find height for id=${idValue}, using fallback approach`,
              );
            }
          } else {
            // Fallback for compatibility with old cursor format
            queryParams.push(after);
            conditions += `\nAND b.id < $${queryParams.length}`;
            console.info(
              `[INFO][QUERY][OPTIMIZATION] Using fallback approach with cursor=${after}`,
            );
          }
        }
      } catch (e: unknown) {
        // Fallback for compatibility with old cursor format
        queryParams.push(after);
        conditions += `\nAND b.id < $${queryParams.length}`;
        console.info(
          `[INFO][QUERY][OPTIMIZATION] Error parsing cursor, using fallback approach: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // Handle "before" cursor (for backward pagination) - decode to get both height and id
    let beforeHeight, beforeId;
    if (before) {
      try {
        // Try to parse as compound cursor format (height:id)
        const [height, id] = before.split(':');
        beforeHeight = parseInt(height, 10);
        beforeId = parseInt(id, 10);

        // Check if values are valid numbers
        if (!isNaN(beforeHeight) && !isNaN(beforeId)) {
          // For backward pagination with "before", we want records where:
          // (height > beforeHeight) OR (height = beforeHeight AND id > beforeId)
          queryParams.push(beforeHeight, beforeId);
          conditions += `\nAND (b.height > $${queryParams.length - 1} OR (b.height = $${queryParams.length - 1} AND b.id > $${queryParams.length}))`;
          console.info(
            `[INFO][QUERY][OPTIMIZATION] Using optimized query with compound cursor: height=${beforeHeight}, id=${beforeId}`,
          );
        } else {
          // Old cursor format - look up the height for this ID to optimize the query
          const idValue = parseInt(before, 10);
          if (!isNaN(idValue)) {
            console.info(
              `[INFO][QUERY][OPTIMIZATION] Converting old cursor format (id=${idValue}) to optimized format`,
            );

            // Get the height for this ID with a fast lookup
            const heightQuery = `SELECT height FROM "Blocks" WHERE id = $1 LIMIT 1`;
            const { rows } = await rootPgPool.query(heightQuery, [idValue]);

            if (rows.length > 0) {
              // We found the height, now use the optimized approach
              beforeHeight = rows[0].height;
              beforeId = idValue;

              // Use the optimized condition
              queryParams.push(beforeHeight, beforeId);
              conditions += `\nAND (b.height > $${queryParams.length - 1} OR (b.height = $${queryParams.length - 1} AND b.id > $${queryParams.length}))`;
              console.info(
                `[INFO][QUERY][OPTIMIZATION] Converted to optimized query: height=${beforeHeight}, id=${beforeId}`,
              );
            } else {
              // Fallback if we couldn't find the height
              queryParams.push(before);
              conditions += `\nAND b.id > $${queryParams.length}`;
              console.info(
                `[INFO][QUERY][OPTIMIZATION] Could not find height for id=${idValue}, using fallback approach`,
              );
            }
          } else {
            // Fallback for compatibility with old cursor format
            queryParams.push(before);
            conditions += `\nAND b.id > $${queryParams.length}`;
            console.info(
              `[INFO][QUERY][OPTIMIZATION] Using fallback approach with cursor=${before}`,
            );
          }
        }
      } catch (e: unknown) {
        // Fallback for compatibility with old cursor format
        queryParams.push(before);
        conditions += `\nAND b.id > $${queryParams.length}`;
        console.info(
          `[INFO][QUERY][OPTIMIZATION] Error parsing cursor, using fallback approach: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (chainIds?.length) {
      queryParams.push(chainIds);
      conditions += `\nAND b."chainId" = ANY($${queryParams.length})`;
    }

    if (endHeight && endHeight - startHeight < 20) {
      queryParams.push(endHeight);
      conditions += `\nAND b."height" <= $${queryParams.length}`;
    }

    // Record the start time to measure performance
    const startTime = Date.now();

    const query = `
      SELECT b.id,
        b.hash,
        b."chainId",
        b."creationTime",
        b."epochStart",
        b."featureFlags",
        b.height as "height",
        b.nonce as "nonce",
        b."payloadHash" as "payloadHash",
        b.weight as "weight",
        b.target as "target",
        b.adjacents as "adjacents",
        b.parent as "parent"
      FROM "Blocks" b
      WHERE b.height >= $2
      ${conditions}
      ORDER BY b.height ${order}, b.id ${order}
      LIMIT $1;
    `;

    const { rows: blockRows } = await rootPgPool.query(query, queryParams);

    // Log the query performance
    const endTime = Date.now();
    console.info(
      `[INFO][QUERY][PERFORMANCE] Block query executed in ${endTime - startTime}ms, returned ${blockRows.length} rows`,
    );

    // Create edges with a compound cursor containing both height and id
    const edges = blockRows.map(row => ({
      cursor: `${row.height}:${row.id}`, // Compound cursor for better pagination
      node: blockValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Retrieves miner account information for a specific block
   *
   * This method fetches the account details of the miner who produced a
   * specific block, including their balance and guard (security predicate).
   * The data is retrieved from both the database and the blockchain node.
   *
   * @param hash - The block hash to look up
   * @param chainId - The chain ID where the block exists
   * @returns Promise resolving to the miner's account information
   * @throws Error if the miner account is not found
   */
  async getMinerData(hash: string, chainId: string) {
    const balanceRows = await sequelize.query(
      `SELECT ba.id,
              ba.account,
              ba.balance,
              ba."chainId",
              ba.module
        FROM "Blocks" b
        JOIN "Balances" ba ON ba.account = b."minerData"->>'account'
        WHERE b.hash = :hash
        AND ba."chainId" = :chainId`,
      {
        model: Balance,
        mapToModel: true,
        replacements: { hash, chainId },
        type: QueryTypes.SELECT,
      },
    );

    const [balanceRow] = balanceRows;

    if (!balanceRow) {
      throw new Error("Miner didn't exist.");
    }

    const res = await handleSingleQuery({
      chainId: chainId.toString(),
      code: `(${balanceRow.module}.details \"${balanceRow.account}\")`,
    });

    return {
      id: balanceRow.id.toString(),
      accountName: balanceRow.account,
      balance: Number(balanceRow.balance),
      chainId: balanceRow.chainId.toString(),
      fungibleName: balanceRow.module,
      guard: formatGuard_NODE(res),
    };
  }

  /**
   * Retrieves all chain IDs from the blockchain node
   *
   * This method fetches the list of active chain IDs from the cached
   * node information, which is useful for queries that need to access
   * data across all chains.
   *
   * @returns Promise resolving to an array of chain IDs
   */
  async getChainIds() {
    const nodeInfo = MEMORY_CACHE.get(NODE_INFO_KEY) as GetNodeInfo;
    return nodeInfo.nodeChains.map(chainId => Number(chainId));
  }

  /**
   * Retrieves information about completed blocks with pagination
   *
   * This method identifies blocks that have been fully processed by the
   * indexer, which is useful for determining blockchain synchronization
   * status and identifying potential gaps in indexed data.
   *
   * @param params - Object containing filter and pagination parameters
   * @returns Promise resolving to page info and block edges
   */
  async getCompletedBlocks(params: GetCompletedBlocksParams) {
    const {
      first,
      last,
      before: beforeEncoded,
      after: afterEncoded,
      chainIds: chainIdsParam,
      completedHeights,
      heightCount,
    } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const chainIds = chainIdsParam?.length ? chainIdsParam : await this.getChainIds();

    if (completedHeights) {
      const query = `
        SELECT height
        FROM "Blocks"
        GROUP BY height
        HAVING COUNT(*) >= $1
        ORDER BY height DESC
        LIMIT $2;
      `;

      const { rows: heightRows } = await rootPgPool.query(query, [chainIds.length, heightCount]);

      const totalCompletedHeights = heightRows.map(r => r.height) as number[];

      if (totalCompletedHeights.length > 0) {
        const queryParams: any[] = [
          limit,
          chainIds,
          totalCompletedHeights,
          totalCompletedHeights[0],
        ];

        let conditions = '';

        if (after) {
          queryParams.push(after);
          conditions += '\nAND id < $5';
        }

        if (before) {
          queryParams.push(before);
          conditions += '\nAND id > $5';
        }

        let queryOne = `
          SELECT *
          FROM "Blocks"
          WHERE "chainId" = ANY($2)
          AND (height = ANY($3) OR height > $4)
          ${conditions}
          ORDER BY id ${order}
          LIMIT $1
        `;

        const { rows: blockRows } = await rootPgPool.query(queryOne, queryParams);

        const edges = blockRows.map(row => ({
          cursor: row.id.toString(),
          node: blockValidator.validate(row),
        }));

        const pageInfo = getPageInfo({ edges, order, limit, after, before });
        return pageInfo;
      }
    }

    const queryTwo = `
      SELECT height, COUNT(*)
      FROM "Blocks"
      GROUP BY height
      HAVING COUNT(*) > 1
      ORDER BY height DESC
      LIMIT $1
    `;

    const { rows: heightRows } = await rootPgPool.query(queryTwo, [heightCount]);

    const totalCompletedHeights = heightRows.map(r => r.height) as number[];

    const queryParams: any[] = [limit, chainIds, totalCompletedHeights];

    let conditions = '';

    if (after) {
      queryParams.push(after);
      conditions += '\nAND id < $4';
    }

    if (before) {
      queryParams.push(before);
      conditions += '\nAND id > $4';
    }

    let queryThree = `
      SELECT *
      FROM "Blocks"
      WHERE "chainId" = ANY($2)
      AND height = ANY($3)
      ${conditions}
      ORDER BY id ${order}
      LIMIT $1
    `;

    const { rows: blockRows } = await rootPgPool.query(queryThree, queryParams);

    const edges = blockRows.map(row => ({
      cursor: row.id.toString(),
      node: blockValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Retrieves blocks associated with specific event IDs
   *
   * This batch-oriented method is designed for use with DataLoader,
   * fetching multiple blocks in a single database query when given
   * a list of event IDs.
   *
   * @param eventIds - Array of event IDs to find blocks for
   * @returns Promise resolving to an array of blocks
   */
  async getBlocksByEventIds(eventIds: readonly string[]) {
    console.info('[INFO][INFRA][INFRA_CONFIG] Batching for event IDs:', eventIds);

    const { rows: blockRows } = await rootPgPool.query(
      `SELECT b.*, e.id as "eventId"
        FROM "Events" e
        JOIN "Transactions" t ON t.id = e."transactionId"
        JOIN "Blocks" b ON b.id = t."blockId"
        WHERE e.id = ANY($1::int[])`,
      [eventIds],
    );

    if (blockRows.length !== eventIds.length) {
      throw new Error('There was an issue fetching blocks for event IDs.');
    }

    const blockMap = blockRows.reduce(
      (acum, row) => ({
        ...acum,
        [row.eventId]: blockValidator.validate(row),
      }),
      {},
    );

    return eventIds.map(eventId => blockMap[eventId]) as BlockOutput[];
  }

  /**
   * Retrieves blocks associated with specific transaction IDs
   *
   * This batch-oriented method is designed for use with DataLoader,
   * fetching multiple blocks in a single database query when given
   * a list of transaction IDs.
   *
   * @param transactionIds - Array of transaction IDs to find blocks for
   * @returns Promise resolving to an array of blocks
   */
  async getBlocksByTransactionIds(transactionIds: string[]) {
    console.info('[INFO][INFRA][INFRA_CONFIG] Batching for transactionIds IDs:', transactionIds);

    const { rows: blockRows } = await rootPgPool.query(
      `SELECT b.id,
        b.hash,
        b."chainId",
        b."creationTime",
        b."epochStart",
        b."featureFlags",
        b.height as "height",
        b.nonce as "nonce",
        b."payloadHash" as "payloadHash",
        b.weight as "weight",
        b.target as "target",
        b.adjacents as "adjacents",
        b.parent as "parent",
        t.id as "transactionId"
        FROM "Blocks" b
        JOIN "Transactions" t ON b.id = t."blockId"
        WHERE t.id = ANY($1::int[])`,
      [transactionIds],
    );

    if (blockRows.length !== transactionIds.length) {
      throw new Error('There was an issue fetching blocks for transaction IDs.');
    }

    const blockMap = blockRows.reduce(
      (acum, row) => ({
        ...acum,
        [row.transactionId]: blockValidator.validate(row),
      }),
      {},
    );

    return transactionIds.map(id => blockMap[id]) as BlockOutput[];
  }

  /**
   * Retrieves multiple blocks by their hashes in a single query
   *
   * This batch-oriented method is designed for use with DataLoader,
   * efficiently fetching multiple blocks in a single database query
   * when given a list of block hashes.
   *
   * @param hashes - Array of block hashes to retrieve
   * @returns Promise resolving to an array of blocks
   */
  async getBlockByHashes(hashes: string[]): Promise<BlockOutput[]> {
    console.info('[INFO][INFRA][INFRA_CONFIG] Batching for hashes:', hashes);

    const { rows: blockRows } = await rootPgPool.query(
      `SELECT b.id,
        b.hash,
        b."chainId",
        b."creationTime",
        b."epochStart",
        b."featureFlags",
        b.height as "height",
        b.nonce as "nonce",
        b."payloadHash" as "payloadHash",
        b.weight as "weight",
        b.target as "target",
        b.adjacents as "adjacents",
        b.parent as "parent"
        FROM "Blocks" b
        WHERE b.hash = ANY($1::text[])`,
      [hashes],
    );

    if (blockRows.length !== hashes.length) {
      throw new Error('There was an issue fetching blocks for transaction IDs.');
    }

    const blockMap = blockRows.reduce(
      (acum, row) => ({
        ...acum,
        [row.hash]: blockValidator.validate(row),
      }),
      {},
    );

    return hashes.map(hash => blockMap[hash]) as BlockOutput[];
  }

  /**
   * Retrieves the height of the lowest indexed block
   *
   * This method queries the database for the minimum block height, which
   * is useful for determining the earliest point in blockchain history
   * that has been indexed.
   *
   * @returns Promise resolving to the lowest block height
   */
  async getLowestBlockHeight(): Promise<number> {
    const block = await BlockModel.findOne({
      order: [['height', 'ASC']],
      attributes: ['height'],
    });

    return block?.height || 0;
  }

  /**
   * Retrieves the height of the most recent indexed block
   *
   * This method queries the database for the maximum block height, which
   * is useful for determining how up-to-date the indexer is with the
   * blockchain head.
   *
   * @returns Promise resolving to the highest block height
   */
  async getLastBlockHeight(): Promise<number> {
    const block = await BlockModel.findOne({
      order: [['height', 'DESC']],
      attributes: ['height'],
    });

    return block?.height || 0;
  }

  /**
   * Counts the total number of events in a specific block
   *
   * This method performs a COUNT query to determine how many events
   * were emitted during the transactions in a particular block.
   *
   * @param blockHash - The hash of the block to count events for
   * @returns Promise resolving to the total count of events in the block
   */
  async getTotalCountOfBlockEvents(blockHash: string): Promise<number> {
    const block = await BlockModel.findOne({
      where: { hash: blockHash },
      attributes: ['transactionsCount'],
    });

    return block?.transactionsCount || 0;
  }

  /**
   * Retrieves the most recent blocks created after a specific timestamp
   *
   * This method is useful for real-time data synchronization and
   * subscription features that need to track the latest blocks.
   *
   * @param params - Object containing timestamp and filters
   * @returns Promise resolving to an array of recent blocks
   */
  async getLatestBlocks(params: GetLatestBlocksParams): Promise<BlockOutput[]> {
    const { creationTime, lastBlockId, chainIds = [] } = params;
    const blocks = await BlockModel.findAll({
      where: {
        ...(lastBlockId && { id: { [Op.gt]: lastBlockId } }),
        creationTime: { [Op.gt]: creationTime },
        ...(chainIds.length && { chainId: { [Op.in]: chainIds } }),
      },
      limit: 100,
      order: [['id', 'DESC']],
    });

    const output = blocks.map(b => blockValidator.mapFromSequelize(b));
    return output;
  }

  /**
   * Orders transactions by the confirmation depth of their containing blocks
   *
   * This method sorts a list of transactions based on how deeply confirmed
   * their blocks are in the blockchain, which is useful for determining
   * transaction finality and security.
   *
   * @param transactions - Array of transactions to order
   * @returns Promise resolving to the ordered array of transactions
   */
  async getTransactionsOrderedByBlockDepth(
    transactions: TransactionOutput[],
  ): Promise<TransactionOutput[]> {
    const query = `
      WITH RECURSIVE BlockDescendants AS (
        SELECT hash, parent, hash AS root_hash, 0 AS depth, height, "chainId"
        FROM "Blocks"
        WHERE hash = ANY($1::text[])
        UNION ALL
        SELECT b.hash, b.parent, d.root_hash, d.depth + 1 AS depth, b.height, b."chainId"
        FROM BlockDescendants d
        JOIN "Blocks" b ON d.hash = b.parent
          AND b.height = d.height + 1
          AND b."chainId" = d."chainId"
        WHERE d.depth <= 6
      )
      SELECT root_hash, MAX(depth) AS depth
      FROM BlockDescendants
      GROUP BY root_hash;
    `;

    const { rows } = await rootPgPool.query(query, [transactions.map(t => t.blockHash)]);

    rows.sort((a, b) => b.depth - a.depth);

    const output = rows.map(r => transactions.find(t => t.blockHash === r.root_hash)) as any;

    return output;
  }
}
