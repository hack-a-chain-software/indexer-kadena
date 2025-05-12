/**
 * Transaction Database Repository Implementation
 *
 * This module provides the concrete PostgreSQL implementation of the TransactionRepository interface.
 * It handles all database operations related to blockchain transactions, including complex queries,
 * pagination, filtering, and relationships with other entities.
 *
 * Key features:
 * 1. Dynamic SQL query construction based on filtering parameters
 * 2. Optimized query strategies for different access patterns
 * 3. Implementation of cursor-based pagination
 * 4. Data validation against schema validators
 * 5. Caching integration for performance optimization
 * 6. Support for complex transaction relationships (events, transfers, signers)
 *
 * This implementation uses raw SQL queries for maximum performance and flexibility,
 * particularly when dealing with complex joins and conditions across multiple tables.
 */

import { rootPgPool } from '../../../../config/database';
import TransactionRepository, {
  GetSignersParams,
  GetTransactionsByPublicKeyParams,
  GetTransactionsByRequestKey,
  GetTransactionsCountParams,
  GetTransactionsParams,
  TransactionOutput,
} from '../../application/transaction-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';
import { transactionMetaValidator } from '../schema-validator/transaction-meta-schema-validator';
import { transactionValidator } from '../schema-validator/transaction-schema-validator';
import { signerMetaValidator } from '../schema-validator/signer-schema-validator';
import { MEMORY_CACHE } from '../../../../cache/init';
import { NETWORK_STATISTICS_KEY } from '../../../../cache/keys';
import { NetworkStatistics } from '../../application/network-repository';
import BlockDbRepository from './block-db-repository';
import TransactionQueryBuilder from '../query-builders/transaction-query-builder';

/**
 * Database-specific implementation of the TransactionRepository interface.
 * This class handles all transaction-related database operations using PostgreSQL.
 */
export default class TransactionDbRepository implements TransactionRepository {
  private queryBuilder = new TransactionQueryBuilder();

  /**
   * Retrieves transactions based on specified parameters with pagination.
   * This method dynamically constructs SQL queries based on the provided filters,
   * optimizing the query strategy based on whether block or transaction conditions are primary.
   *
   * @param params - Transaction query parameters with filtering and pagination options
   * @returns Promise resolving to paginated transaction results
   */
  async getTransactions(params: GetTransactionsParams) {
    const { after: afterEncoded, before: beforeEncoded, first, last, minimumDepth } = params;

    // Process pagination parameters
    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    // If no minimumDepth is specified, we can use the normal query approach
    if (!minimumDepth) {
      // Build and execute the query using the query builder
      const { query, queryParams } = this.queryBuilder.buildTransactionsQuery({
        ...params,
        after,
        before,
        order,
        limit,
      });

      // Execute the query with the constructed parameters
      const { rows } = await rootPgPool.query(query, queryParams);

      // Transform database rows into GraphQL-compatible edges with cursors
      const edges = rows
        .map(row => ({
          cursor: row.creationTime.toString(),
          node: transactionValidator.validate(row),
        }))
        .sort((a, b) => {
          // Primary sort is already done by DB query (creationTime DESC)
          // Add secondary sort by id for consistent ordering when creationTimes are equal
          const aNode = a.node as unknown as { id: string };
          const bNode = b.node as unknown as { id: string };
          if (a.cursor === b.cursor) {
            return aNode.id > bNode.id ? 1 : -1;
          }
          return 0; // Maintain existing order from DB for different creationTimes
        });

      const pageInfo = getPageInfo({ edges, order, limit, after, before });
      return pageInfo;
    }

    // When minimumDepth is specified, handle batch fetching and depth filtering
    let allFilteredTransactions: any[] = [];
    let lastCursor: string | null = null;
    let hasMoreTransactions = true;
    const batchSize = Math.max(limit * 3, 50); // Fetch more than needed for depth filtering

    // Continue fetching batches until we have enough transactions that meet depth requirement
    while (allFilteredTransactions.length < limit && hasMoreTransactions) {
      // Build and execute query for this batch
      const { query, queryParams } = this.queryBuilder.buildTransactionsQuery({
        ...params,
        after: lastCursor || after,
        before,
        order,
        limit: batchSize,
      });

      const { rows: transactionBatch } = await rootPgPool.query(query, queryParams);

      hasMoreTransactions = transactionBatch.length === batchSize;

      if (transactionBatch.length === 0) {
        break; // No more transactions to process
      }

      // Extract block hashes and get depth map
      const blockHashes = Array.from(new Set(transactionBatch.map(tx => tx.blockHash)));
      const blockRepository = new BlockDbRepository();
      const blockHashToDepth = await blockRepository.createBlockDepthMap(
        blockHashes.map(hash => ({ hash })),
        'hash',
        minimumDepth,
      );

      // Filter transactions by block depth
      const filteredBatch = transactionBatch.filter(
        tx => blockHashToDepth[tx.blockHash] >= minimumDepth,
      );

      allFilteredTransactions = [...allFilteredTransactions, ...filteredBatch];

      // Update cursor for next batch
      if (transactionBatch.length > 0) {
        const lastTransaction = transactionBatch[transactionBatch.length - 1];
        lastCursor = lastTransaction.creationTime.toString();
      }
    }

    // Create edges for paginated result and apply sorting
    const edges = allFilteredTransactions
      .slice(0, limit)
      .map(tx => ({
        cursor: tx.creationTime.toString(),
        node: transactionValidator.validate(tx),
      }))
      .sort((a, b) => {
        // Apply same sorting as in non-minimumDepth case
        const aNode = a.node as unknown as { id: string };
        const bNode = b.node as unknown as { id: string };
        if (a.cursor === b.cursor) {
          return aNode.id > bNode.id ? 1 : -1;
        }
        return 0;
      });

    return getPageInfo({ edges, order, limit, after, before });
  }

  /**
   * Retrieves a transaction associated with a specific transfer.
   * This method finds the transaction that contains a specific transfer by ID.
   *
   * @param transferId - ID of the transfer
   * @returns Promise resolving to the associated transaction
   */
  async getTransactionByTransferId(transferId: string) {
    const query = `
      SELECT t.id as id,
      t.hash as "hashTransaction",
      td.nonce as "nonceTransaction",
      td.sigs as sigs,
      td.continuation as continuation,
      t.num_events as "eventCount",
      td.pactid as "pactId",
      td.proof as proof,
      td.rollback as rollback,
      t.txid AS txid,
      b.height as "height",
      b."hash" as "blockHash",
      b."chainId" as "chainId",
      td.gas as "gas",
      td.step as step,
      td.data as data,
      td.code as code,
      t.logs as "logs",
      t.result as "result",
      t.requestkey as "requestKey"
      FROM "Transactions" t
      JOIN "Blocks" b on t."blockId" = b.id
      JOIN "Transfers" tr on tr."transactionId" = t.id
      LEFT JOIN "TransactionDetails" td on t.id = td."transactionId"
      WHERE tr.id = $1
    `;

    const { rows } = await rootPgPool.query(query, [transferId]);

    if (!rows?.length) {
      throw new Error(`[ERROR][DB][DATA_MISSING] Transfer with id ${transferId} not found`);
    }

    const [row] = rows;
    const output = transactionValidator.validate(row);
    return output;
  }

  /**
   * Retrieves metadata for a transaction by its ID.
   * This method handles the specific case of transaction metadata retrieval,
   * validating the result against the expected schema.
   *
   * @param transactionId - ID of the transaction
   * @returns Promise resolving to the transaction metadata
   */
  async getTransactionMetaInfoById(transactionId: string) {
    const query = `
      SELECT t.id as id,
      t."chainId" as "chainId",
      t.creationtime as "creationTime",
      td.gaslimit as "gasLimit",
      td.gasprice as "gasPrice",
      t.sender as sender,
      td.ttl as ttl
      FROM "Transactions" t
      LEFT JOIN "TransactionDetails" td on t.id = td."transactionId"
      WHERE t.id = $1
    `;

    const { rows } = await rootPgPool.query(query, [transactionId]);

    const [row] = rows;
    const output = transactionMetaValidator.validate(row);
    return output;
  }

  /**
   * Retrieves transactions by their request key.
   * This is a specialized lookup method for finding transactions by their
   * unique request key identifier, with optional block filtering.
   *
   * @param params - Request key search parameters
   * @returns Promise resolving to matching transactions
   */
  async getTransactionsByRequestKey(params: GetTransactionsByRequestKey) {
    const { requestKey, blockHash, minimumDepth } = params;
    const queryParams: (string | number)[] = [requestKey];
    let conditions = '';

    if (blockHash) {
      queryParams.push(blockHash);
      conditions += `\nAND b."hash" = $${queryParams.length}`;
    }

    const query = `
      SELECT t.id as id,
      t.hash as "hashTransaction",
      td.nonce as "nonceTransaction",
      td.sigs as sigs,
      td.continuation as continuation,
      t.num_events as "eventCount",
      td.pactid as "pactId",
      td.proof as proof,
      td.rollback as rollback,
      t.txid AS txid,
      b.height as "height",
      b."hash" as "blockHash",
      b."chainId" as "chainId",
      t.result as "result",
      td.gas as "gas",
      td.step as step,
      td.data as data,
      td.code as code,
      t.logs as "logs",
      t.requestkey as "requestKey"
      FROM "Transactions" t
      JOIN "Blocks" b on t."blockId" = b.id 
      LEFT JOIN "TransactionDetails" td on t.id = td."transactionId"
      WHERE t.requestkey = $1
      ${conditions}
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    let transactions: TransactionOutput[] = [...rows];

    if (minimumDepth) {
      const blockRepository = new BlockDbRepository();
      const blockHashToDepth = await blockRepository.createBlockDepthMap(
        rows.map(row => ({ hash: row.blockHash })),
        'hash',
        minimumDepth,
      );

      const filteredTxs = rows.filter(event => blockHashToDepth[event.blockHash] >= minimumDepth);
      transactions = [...filteredTxs];
    }

    const output = transactions.map(row => transactionValidator.validate(row));
    return output;
  }

  /**
   * Retrieves transactions associated with a specific public key with pagination.
   * This method finds transactions where the specified public key is a signer,
   * supporting cursor-based pagination.
   *
   * @param params - Public key and pagination parameters
   * @returns Promise resolving to paginated transaction results
   */
  async getTransactionsByPublicKey({
    publicKey,
    first,
    before: beforeEncoded,
    after: afterEncoded,
    last,
  }: GetTransactionsByPublicKeyParams) {
    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });
    const queryParams: (string | number)[] = [limit, publicKey];

    let cursorCondition = '';

    if (after) {
      cursorCondition = `\nWHERE t.creationtime < $3`;
      queryParams.push(after);
    }

    if (before) {
      cursorCondition = `\nWHERE t.creationtime > $3`;
      queryParams.push(before);
    }

    const query = `
      SELECT
        t.id as id,
        t.creationtime as "creationTime",
        t.hash as "hashTransaction",
        td.nonce as "nonceTransaction",
        td.sigs as sigs,
        td.continuation as continuation,
        t.num_events as "eventCount",
        td.pactid as "pactId",
        td.proof as proof,
        td.rollback as rollback,
        t.txid AS txid,
        b.height as "height",
        b."hash" as "blockHash",
        b."chainId" as "chainId",
        td.gas as "gas",
        td.step as step,
        td.data as data,
        td.code as code,
        t.logs as "logs",
        t.result as "result",
        t.requestkey as "requestKey"
      FROM "Transactions" t
      JOIN "Blocks" b ON t."blockId" = b.id
      JOIN (
        SELECT DISTINCT s."transactionId"
        FROM "Signers" s
        WHERE s."pubkey" = $2
      ) filtered_signers ON t.id = filtered_signers."transactionId"
      LEFT JOIN "TransactionDetails" td on t.id = td."transactionId"
      ${cursorCondition}
      ORDER BY t.creationtime ${order}
      LIMIT $1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: row.creationTime.toString(),
      node: transactionValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Counts transactions associated with a specific public key.
   * This provides an efficient count for transactions signed by a specific key.
   *
   * @param publicKey - The public key to count transactions for
   * @returns Promise resolving to the count of matching transactions
   */
  async getTransactionsByPublicKeyCount(publicKey: string) {
    const query = `
      SELECT COUNT(*) as count
        FROM (
        SELECT DISTINCT s."transactionId"
        FROM "Signers" s
        WHERE s.pubkey = $1
      ) subquery;
    `;

    const { rows } = await rootPgPool.query(query, [publicKey]);
    const totalCount = parseInt(rows?.[0]?.count ?? '0', 10);
    return totalCount;
  }

  /**
   * Counts transactions matching the specified filter parameters.
   * This method efficiently counts matching transactions without retrieving full data.
   *
   * @param params - Filtering parameters
   * @returns Promise resolving to the count of matching transactions
   */
  async getTransactionsCount(params: GetTransactionsCountParams): Promise<number> {
    const hasNoParams = Object.values(params).every(v => !v);

    if (hasNoParams) {
      const cachedData = MEMORY_CACHE.get<NetworkStatistics>(NETWORK_STATISTICS_KEY);
      return cachedData?.transactionCount ?? 0;
    }

    const {
      blockHash,
      accountName,
      chainId,
      requestKey,
      fungibleName,
      minHeight,
      maxHeight,
      minimumDepth,
      hasTokenId,
    } = params;

    const transactionsParams: (string | number)[] = [];
    const blockParams: (string | number)[] = [];
    let transactionsConditions = '';
    let blocksConditions = '';

    const localOperator = (paramsLength: number) => (paramsLength > 1 ? `\nAND` : 'WHERE');

    if (accountName) {
      transactionsParams.push(accountName);
      const op = localOperator(transactionsParams.length);
      transactionsConditions += `${op} t.sender = $${transactionsParams.length}`;
    }

    if (requestKey) {
      transactionsParams.push(requestKey);
      const op = localOperator(transactionsParams.length);
      transactionsConditions += `${op} t."requestkey" = $${transactionsParams.length}`;
    }

    if (fungibleName) {
      transactionsParams.push(fungibleName);
      const op = localOperator(transactionsParams.length);
      transactionsConditions += `
        ${op} EXISTS
        (
          SELECT 1
          FROM "Events" e
          WHERE e."transactionId" = t.id
          AND e."module" = $${transactionsParams.length}
        )`;
    }

    if (accountName && hasTokenId) {
      transactionsParams.push(accountName);
      const op = localOperator(transactionsParams.length);
      transactionsConditions += `
        ${op} EXISTS
        (
          SELECT 1
          FROM "Transfers" t
          WHERE t."from_acct" = $${transactionsParams.length}
          AND t."hasTokenId" = true
        )`;
    }

    const paramsOffset = transactionsParams.length;
    if (blockHash) {
      blockParams.push(blockHash);
      const op = localOperator(blockParams.length);
      blocksConditions += `${op} b.hash = $${paramsOffset + blockParams.length}`;
    }

    if (chainId) {
      blockParams.push(chainId);
      const op = localOperator(blockParams.length);
      blocksConditions += `${op} b."chainId" = $${paramsOffset + blockParams.length}`;
    }

    if (maxHeight) {
      blockParams.push(maxHeight);
      const op = localOperator(blockParams.length);
      blocksConditions += `${op} b."height" <= $${paramsOffset + blockParams.length}`;
    }

    if (minHeight) {
      blockParams.push(minHeight);
      const op = localOperator(blockParams.length);
      blocksConditions += `${op} b."height" >= $${paramsOffset + blockParams.length}`;
    }

    if (minimumDepth) {
      blockParams.push(minimumDepth);
      const op = localOperator(blockParams.length);
      blocksConditions += `${op} b."minimumDepth" >= $${paramsOffset + blockParams.length}`;
    }

    const totalCountQuery = `
      WITH filtered_transactions AS (
        SELECT id, "blockId"
        FROM "Transactions" t
        ${transactionsConditions}
      )
      SELECT COUNT(*) as count
      FROM filtered_transactions t
      ${blocksConditions ? `JOIN "Blocks" b ON b.id = t."blockId"` : ''}
      ${blocksConditions}
    `;

    const { rows: countResult } = await rootPgPool.query(totalCountQuery, [
      ...transactionsParams,
      ...blockParams,
    ]);

    const totalCount = parseInt(countResult[0].count, 10);
    return totalCount;
  }

  /**
   * Retrieves transactions associated with specific events.
   * This method finds transactions that contain any of the specified event IDs.
   *
   * @param eventIds - Array of event IDs
   * @returns Promise resolving to matching transactions
   */
  async getTransactionsByEventIds(eventIds: readonly string[]): Promise<TransactionOutput[]> {
    const { rows } = await rootPgPool.query(
      `SELECT t.id as id,
      t.hash as "hashTransaction",
      td.nonce as "nonceTransaction",
      td.sigs as sigs,
      td.continuation as continuation,
      t.num_events as "eventCount",
      td.pactid as "pactId",
      td.proof as proof,
      td.rollback as rollback,
      t.txid AS txid,
      b.height as "height",
      b."hash" as "blockHash",
      b."chainId" as "chainId",
      td.gas as "gas",
      td.step as step,
      td.data as data,
      td.code as code,
      t.logs as "logs",
      t.result as "result",
      e.id as "eventId",
      t.requestkey as "requestKey"
      FROM "Transactions" t
      JOIN "Blocks" b on t."blockId" = b.id
      JOIN "Events" e on e."transactionId" = t."id"
      LEFT JOIN "TransactionDetails" td on t.id = td."transactionId"
      WHERE e.id = ANY($1::int[])`,
      [eventIds],
    );

    if (rows.length !== eventIds.length) {
      throw new Error('There was an issue fetching blocks for event IDs.');
    }

    const transactionMap = rows.reduce(
      (acum, row) => ({
        ...acum,
        [row.eventId]: transactionValidator.validate(row),
      }),
      {},
    );

    return eventIds.map(eventId => transactionMap[eventId]) as TransactionOutput[];
  }

  /**
   * Retrieves signers for a specific transaction.
   * This method gets the cryptographic signers associated with a transaction,
   * optionally filtered by order index for multi-signature transactions.
   *
   * @param params - The GetSignersParam Object
   * @param params.transactionId - The transaction unique identifier on the 'transactions' table
   * @param params.requestKey - The unique identifier of the transaction on the blockchain
   * @param params.orderIndex - Optional argument to retrieve single signer from signers list
   * @returns Promise resolving to an array of signers
   */
  async getSigners(params: GetSignersParams) {
    const { transactionId, requestKey, orderIndex } = params;
    const queryParams: Array<string | number> = [];

    let query = `
      SELECT s.pubkey as "publicKey",
        s.address as "address",
        s."orderIndex" as "signerOrderIndex",
        s.clist as "clist",
        t.requestkey as "requestKey"
      FROM "Signers" s
      JOIN "Transactions" t on s."transactionId" = t.id
    `;

    if (transactionId) {
      queryParams.push(transactionId);
      query += `\nWHERE t.id = $1`;
    }

    if (requestKey) {
      queryParams.push(requestKey);
      query += `\nWHERE t.requestkey = $1`;
    }

    if (orderIndex) {
      queryParams.push(orderIndex);
      query += `\nAND s."orderIndex" = $2`;
    }

    const { rows } = await rootPgPool.query(query, queryParams);

    const output = rows.map(row => signerMetaValidator.validate(row));

    return output;
  }
}
