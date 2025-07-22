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

import { Op, QueryTypes } from 'sequelize';
import { rootPgPool, sequelize } from '../../../../config/database';
import BlockModel from '../../../../models/block';
import BlockRepository, {
  BlockOutput,
  GetBlocksBetweenHeightsParams,
  GetBlocksFromDepthParams,
  GetCompletedBlocksParams,
  GetLatestBlocksParams,
  UpdateCanonicalStatusParams,
} from '../../application/block-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';
import { blockValidator } from '../schema-validator/block-schema-validator';
import Balance from '../../../../models/balance';
import { handleSingleQuery } from '../../../../utils/raw-query';
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
  async getBlockByHash(hash: string): Promise<BlockOutput | null> {
    const block = await BlockModel.findOne({
      where: { hash },
    });

    if (!block) return null;

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

    let allFetchedBlocks: any[] = [];
    let lastHeight: number | null = null;
    let lastId: number | null = null;

    const batchSize = Math.max(limit * 2, 50); // Fetch more than needed in each batch
    let hasMoreBlocks = true;

    // Base query parameters and conditions for chain ID filtering
    const baseQueryParams: any[] = [batchSize];
    let baseConditions: string[] = [];

    baseConditions.push(`"height" <= (SELECT MAX(height) - ${minimumDepth} FROM "Blocks")`);

    // Add chain ID filtering - only need to do this once since chainIdsToUse doesn't change
    if (chainIds?.length) {
      baseQueryParams.push(chainIds);
      baseConditions.push(`"chainId" = ANY($${baseQueryParams.length})`);
    }

    if (after) {
      const [heightStr, idStr] = after.split(':');
      lastHeight = parseInt(heightStr, 10);
      lastId = parseInt(idStr, 10);
      if (isNaN(lastHeight) || isNaN(lastId)) {
        throw new Error('Invalid after cursor');
      }
    }

    if (before) {
      const [heightStr, idStr] = before.split(':');
      lastHeight = parseInt(heightStr, 10);
      lastId = parseInt(idStr, 10);
      if (isNaN(lastHeight) || isNaN(lastId)) {
        throw new Error('Invalid before cursor');
      }
    }

    // Keep fetching batches until we have enough blocks that meet the depth requirement
    while (allFetchedBlocks.length < limit && hasMoreBlocks) {
      const queryParams: any[] = [...baseQueryParams];
      let conditions = [...baseConditions];

      if (lastHeight !== null && lastId !== null && after) {
        queryParams.push(lastHeight, lastId);
        conditions.push(`(height, id) < ($${queryParams.length - 1}, $${queryParams.length})`);
      }

      if (lastHeight !== null && lastId !== null && before) {
        queryParams.push(lastHeight, lastId);
        conditions.push(`(height, id) > ($${queryParams.length - 1}, $${queryParams.length})`);
      }

      const query = `
        SELECT *
        FROM "Blocks"
        ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY height ${order}, id ${order}
        LIMIT $1
      `;

      const { rows: blockRows } = await rootPgPool.query(query, queryParams);

      if (blockRows.length < batchSize) {
        hasMoreBlocks = false;
      }

      if (blockRows.length === 0) {
        break; // No more blocks to process
      }

      if (minimumDepth) {
        const blockHashToDepth = await this.createBlockDepthMap(blockRows, 'hash', minimumDepth);

        const filteredBlocks = blockRows.filter(
          block => blockHashToDepth[block.hash] >= minimumDepth,
        );

        allFetchedBlocks = [...allFetchedBlocks, ...filteredBlocks];
      } else {
        allFetchedBlocks = [...allFetchedBlocks, ...blockRows];
      }

      // Update cursor for next batch using the last block's height and chainId
      const lastBlock = blockRows[blockRows.length - 1];
      lastHeight = lastBlock.height;
      lastId = lastBlock.id;
    }

    const edges = allFetchedBlocks.slice(0, limit).map(row => ({
      cursor: `${row.height}:${row.id}`,
      node: blockValidator.validate(row),
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

    const {
      limit,
      order: orderParam,
      after,
      before,
    } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const order = orderParam === 'ASC' ? 'DESC' : 'ASC';
    const queryParams: (string | number | string[])[] = [limit, startHeight];
    let conditions = '';

    if (before) {
      // Try to parse as compound cursor format (height:id)
      const [height, id] = before.split(':');
      const beforeHeight = parseInt(height, 10);
      const beforeId = parseInt(id, 10);

      if (isNaN(beforeHeight) || isNaN(beforeId)) {
        throw new Error('Invalid before cursor');
      }

      queryParams.push(beforeHeight, beforeId);
      conditions += `\nAND (b.height, b.id) > ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (after) {
      // Try to parse as compound cursor format (height:id)
      const [height, id] = after.split(':');
      const afterHeight = parseInt(height, 10);
      const afterId = parseInt(id, 10);

      if (isNaN(afterHeight) || isNaN(afterId)) {
        throw new Error('Invalid after cursor');
      }
      queryParams.push(afterHeight, afterId);
      conditions += `\nAND (b.height, b.id) < ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (chainIds?.length) {
      queryParams.push(chainIds);
      conditions += `\nAND b."chainId" = ANY($${queryParams.length})`;
    }

    if (endHeight) {
      queryParams.push(endHeight);
      conditions += `\nAND b."height" <= $${queryParams.length}`;
    }

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
        b.coinbase as "coinbase",
        b.adjacents as "adjacents",
        b.parent as "parent",
        b.canonical as "canonical"
      FROM "Blocks" b
      WHERE b.height ${before ? '<=' : '>='} $2
      ${conditions}
      ORDER BY b.height ${order}, b.id ${order}
      LIMIT $1;
    `;

    const { rows: blockRows } = await rootPgPool.query(query, queryParams);

    const edges = blockRows.map(row => ({
      cursor: `${row.height.toString()}:${row.id.toString()}`,
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
        b.coinbase as "coinbase",
        b.adjacents as "adjacents",
        b.parent as "parent",
        b.canonical as "canonical",
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
        b.coinbase as "coinbase",
        b.adjacents as "adjacents",
        b.parent as "parent",
        b.canonical as "canonical"
        FROM "Blocks" b
        WHERE b.hash = ANY($1::text[])`,
      [hashes],
    );

    if (blockRows.length !== hashes.length) {
      return [];
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
   * Counts the total number of transactions in a specific block
   *
   * This method performs a COUNT query to determine how many transactions
   * are associated to a particular block.
   *
   * @param blockHash - The hash of the block to count transactions for
   * @returns Promise resolving to the total count of transactions in the block
   */
  async getTotalCountOfBlockTransactions(blockHash: string): Promise<number> {
    const { rows } = await rootPgPool.query(
      `SELECT COUNT(*) as "totalCount"
        FROM "Blocks" b
        JOIN "Transactions" t ON t."blockId" = b.id
        WHERE b.hash = $1`,
      [blockHash],
    );

    return rows[0].totalCount ?? 0;
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

  async getLastBlocksWithDepth(
    chainIdsParam: string[],
    minimumDepth: number,
    startingTimestamp: number,
    id?: string,
  ): Promise<BlockOutput[]> {
    const chainIds = chainIdsParam.length ? chainIdsParam.map(Number) : await this.getChainIds();
    const maxHeights = await this.getMaxHeights();

    const queryParams: any[] = [];
    const conditions: string[] = [];

    chainIds.forEach(chainId => {
      const maxHeight = maxHeights[chainId];
      if (maxHeight !== undefined) {
        conditions.push(
          `("chainId" = $${queryParams.length + 1} AND height <= $${queryParams.length + 2})`,
        );
        queryParams.push(chainId, maxHeight - minimumDepth);
      }
    });

    queryParams.push(startingTimestamp.toFixed());

    let query = `
      SELECT *
      FROM "Blocks"
      WHERE ${conditions.join(' OR ')}
      AND "creationTime" > $${queryParams.length}
    `;

    if (id) {
      queryParams.push(id);
      query += `
        AND id > $${queryParams.length}
        ORDER BY id DESC
        LIMIT 100
      `;
    } else {
      query += `
        ORDER BY id DESC
        LIMIT 5
      `;
    }

    const { rows: blockRows } = await rootPgPool.query(query, queryParams);

    const blocksToReturn = blockRows.map(row => blockValidator.validate(row));
    const blockHashToDepth = await this.createBlockDepthMap(blocksToReturn, 'hash', minimumDepth);

    return blocksToReturn.filter(block => blockHashToDepth[block.hash] >= minimumDepth);
  }

  async getConfirmationDepth(blockHash: string, minimumDepth: number): Promise<number> {
    const query = `
      WITH RECURSIVE BlockDescendants AS (
        SELECT hash, parent, 0 AS depth, height, "chainId"
        FROM "Blocks"
        WHERE hash = $1
        UNION ALL
        SELECT b.hash, b.parent, d.depth + 1 AS depth, b.height, b."chainId"
        FROM BlockDescendants d
        JOIN "Blocks" b ON d.hash = b.parent AND b.height = d.height + 1 AND b."chainId" = d."chainId"
        WHERE d.depth <= $2
      )
      SELECT MAX(depth) AS depth
      FROM BlockDescendants;
    `;

    const { rows } = await rootPgPool.query(query, [blockHash, minimumDepth]);

    if (rows.length && rows[0].depth) {
      return Number(rows[0].depth);
    } else {
      return 0;
    }
  }

  /**
   *
   * @param items - all the items to create a block depth map for
   * @param hashProp - the property of the item that contains the block hash
   * @returns a map of block hashes to their confirmation depths
   */
  async createBlockDepthMap<T>(
    items: T[],
    hashProp: keyof T,
    minimumDepth: number,
  ): Promise<Record<string, number>> {
    const uniqueBlockHashes = [...new Set(items.map(item => item[hashProp]))];

    const confirmationDepths = await Promise.all(
      uniqueBlockHashes.map(blockHash =>
        this.getConfirmationDepth(blockHash as string, minimumDepth),
      ),
    );

    return uniqueBlockHashes.reduce((map: Record<string, number>, blockHash, index) => {
      map[blockHash as string] = confirmationDepths[index];
      return map;
    }, {});
  }

  async getMaxHeights(): Promise<Record<string, number>> {
    const chainIds = await this.getChainIds();

    const maxHeightsByChainIdPromises = chainIds.map(async chainId => {
      const query = `
        SELECT MAX(height) as max_height
        FROM "Blocks"
        WHERE "chainId" = $1
      `;

      const { rows } = await rootPgPool.query(query, [chainId]);
      return { [chainId.toString()]: parseInt(rows[0].max_height, 10) };
    });

    const maxHeightsArray = await Promise.all(maxHeightsByChainIdPromises);

    return Object.assign({}, ...maxHeightsArray);
  }

  async getBlocksWithSameHeight(height: number, chainId: string): Promise<BlockOutput[]> {
    const query = `
      SELECT b.*
      FROM "Blocks" b
      WHERE b."height" = $1 AND b."chainId" = $2
    `;

    const { rows } = await rootPgPool.query(query, [height, chainId]);

    return rows.map(row => blockValidator.validate(row));
  }

  async getBlockNParent(depth: number, hash: string): Promise<string | undefined> {
    const query = `
      WITH RECURSIVE BlockAncestors AS (
        SELECT hash, parent, 1 AS depth, height
        FROM "Blocks"
        WHERE hash = $1
        UNION ALL
        SELECT b.hash, b.parent, d.depth + 1 AS depth, b.height
        FROM BlockAncestors d
        JOIN "Blocks" b ON d.parent = b.hash
        WHERE d.depth < $2
      )
      SELECT parent as hash, depth
      FROM BlockAncestors
      ORDER BY depth DESC
      LIMIT 1;
    `;
    const { rows } = await rootPgPool.query(query, [hash, depth]);

    return rows?.[0]?.hash;
  }

  async getBlocksWithHeightHigherThan(height: number, chainId: string): Promise<BlockOutput[]> {
    const query = `
      SELECT b.*
      FROM "Blocks" b
      WHERE b.height > $1 AND b."chainId" = $2;
    `;

    const { rows } = await rootPgPool.query(query, [height, chainId]);

    return rows.map(row => blockValidator.validate(row));
  }

  async updateCanonicalStatus(params: UpdateCanonicalStatusParams) {
    const canonicalHashes = params.blocks
      .filter(change => change.canonical)
      .map(change => change.hash);
    const nonCanonicalHashes = params.blocks
      .filter(change => !change.canonical)
      .map(change => change.hash);

    await rootPgPool.query('BEGIN');
    try {
      if (canonicalHashes.length > 0) {
        const canonicalQuery = `
          UPDATE "Blocks"
          SET "canonical" = true
          WHERE hash = ANY($1)
        `;
        await rootPgPool.query(canonicalQuery, [canonicalHashes]);
      }

      if (nonCanonicalHashes.length > 0) {
        const nonCanonicalQuery = `
          UPDATE "Blocks"
          SET "canonical" = false
          WHERE hash = ANY($1)
        `;
        await rootPgPool.query(nonCanonicalQuery, [nonCanonicalHashes]);
      }
      await rootPgPool.query('COMMIT');
    } catch (error) {
      await rootPgPool.query('ROLLBACK');
      throw error;
    }
  }
}
