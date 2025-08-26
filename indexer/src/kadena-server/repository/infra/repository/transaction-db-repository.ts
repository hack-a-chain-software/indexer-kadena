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
  GetTransactionsByPactCodeParams,
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
import BlockDbRepository from './block-db-repository';
import TransactionQueryBuilder from '../query-builders/transaction-query-builder';
import { isNullOrUndefined } from '@/utils/helpers';
import { transactionSummaryValidator } from '@/kadena-server/repository/infra/schema-validator/transaction-summary-schema-validator';

/**
 * Database-specific implementation of the TransactionRepository interface.
 * This class handles all transaction-related database operations using PostgreSQL.
 */
export default class TransactionDbRepository implements TransactionRepository {
  private queryBuilder = new TransactionQueryBuilder();

  /**
   * Batch fetch TransactionDetails for a set of transaction IDs and return a map by transactionId
   */
  private async fetchTransactionDetailsMap(transactionIds: number[]): Promise<Record<number, any>> {
    if (transactionIds.length === 0) return {};

    const query = `
      SELECT
        td."transactionId" as "transactionId",
        td.nonce AS "nonceTransaction",
        td.sigs AS sigs,
        td.continuation AS continuation,
        td.pactid AS "pactId",
        td.proof AS proof,
        td.rollback AS rollback,
        td.gas AS "gas",
        td.step AS step,
        td.data AS data,
        td.code AS code
      FROM "TransactionDetails" td
      WHERE td."transactionId" = ANY($1::int[])
    `;

    const { rows } = await rootPgPool.query(query, [transactionIds]);
    return rows.reduce<Record<number, any>>((map, row) => {
      map[row.transactionId] = row;
      return map;
    }, {});
  }

  /**
   * Merge base transaction rows with their details using the transactionId as key
   */
  private async mergeRowsWithDetails(rows: any[]): Promise<any[]> {
    const ids = Array.from(new Set(rows.map(r => r.id))).filter(Boolean) as number[];
    const detailsMap = await this.fetchTransactionDetailsMap(ids);
    return rows.map(row => ({
      ...row,
      ...(detailsMap[row.id] ?? {}),
    }));
  }

  /**
   * Retrieves transactions based on specified parameters with pagination.
   * This method dynamically constructs SQL queries based on the provided filters,
   * optimizing the query strategy based on whether block or transaction conditions are primary.
   *
   * @param params - Transaction query parameters with filtering and pagination options
   * @returns Promise resolving to paginated transaction results
   */
  async getTransactions(params: GetTransactionsParams) {
    const { after: afterEncoded, before: beforeEncoded, first, last, ...rest } = params;

    // Process pagination parameters
    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const hasNoParamsSet = Object.values(rest).every(v => !v);
    if (hasNoParamsSet) {
      const { query, queryParams } = this.queryBuilder.buildAllTransactionsQuery({
        limit,
        order,
        after,
        before,
        isCoinbase: rest.isCoinbase,
      });

      // Execute the query with the constructed parameters
      const { rows } = await rootPgPool.query(query, queryParams);
      const rowsWithDetails = await this.mergeRowsWithDetails(rows);

      // Transform database rows into GraphQL-compatible edges with cursors
      const edges = rowsWithDetails.map(row => ({
        cursor: `${row.creationTime.toString()}:${row.id.toString()}`,
        node: transactionValidator.validate(row),
      }));

      const pageInfo = getPageInfo({ edges, order, limit, after, before });
      return pageInfo;
    }

    const maxHeightQuery = `SELECT max(height) FROM "Blocks"`;
    const maxHeightFromDb = (await rootPgPool.query(maxHeightQuery)).rows[0].max;
    // If no minimumDepth is specified, we can use the normal query approach
    if (!rest.minimumDepth) {
      // Build and execute the query using the query builder
      const { query, queryParams } = this.queryBuilder.buildTransactionsQuery({
        ...params,
        after,
        before,
        order,
        limit,
        maxHeightFromDb,
      });

      // Execute the query with the constructed parameters
      const { rows } = await rootPgPool.query(query, queryParams);
      const rowsWithDetails = await this.mergeRowsWithDetails(rows);

      // Transform database rows into GraphQL-compatible edges with cursors
      const edges = rowsWithDetails.map(row => ({
        cursor: `${row.creationTime.toString()}:${row.id.toString()}`,
        node: transactionValidator.validate(row),
      }));

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
        maxHeightFromDb,
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
        rest.minimumDepth,
      );

      // Filter transactions by block depth
      const filteredBatch = transactionBatch.filter(
        tx => blockHashToDepth[tx.blockHash] >= (rest.minimumDepth ?? 0),
      );

      // Merge details for the filtered batch
      const filteredWithDetails = await this.mergeRowsWithDetails(filteredBatch);

      allFilteredTransactions = [...allFilteredTransactions, ...filteredWithDetails];

      // Update cursor for next batch
      if (transactionBatch.length > 0) {
        const lastTransaction = transactionBatch[transactionBatch.length - 1];
        lastCursor = `${lastTransaction.creationTime.toString()}:${lastTransaction.id.toString()}`;
      }
    }

    // Create edges for paginated result and apply sorting
    const edges = allFilteredTransactions.slice(0, limit).map(tx => ({
      cursor: `${tx.creationTime.toString()}:${tx.id.toString()}`,
      node: transactionValidator.validate(tx),
    }));

    return getPageInfo({ edges, order, limit, after, before });
  }

  async getLastTransactions(quantity = 20) {
    const query = `
      SELECT 
        t.id as id,
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
      LEFT JOIN "TransactionDetails" td on t.id = td."transactionId"
      WHERE t.id <= (SELECT MAX(id) FROM "Transactions")
      ORDER BY id DESC
      LIMIT $1
    `;

    const { rows } = await rootPgPool.query(query, [quantity]);
    const lastTransactions = rows.map(row => transactionValidator.validate(row));
    return lastTransactions;
  }

  /**
   * Retrieves transactions by pact code with pagination.
   *
   * @param params - Pact code and pagination parameters
   * @returns Promise resolving to paginated transaction results
   */
  async getTransactionsByPactCode(params: GetTransactionsByPactCodeParams) {
    const { after: afterEncoded, before: beforeEncoded, first, last, pactCode } = params;

    // Process pagination parameters
    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const { query, queryParams } = this.queryBuilder.buildTransactionByCodeQuery({
      after,
      before,
      order,
      limit,
      transactionCode: pactCode,
    });

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.slice(0, limit).map(tx => ({
      cursor: `${tx.creationTime.toString()}:${tx.id.toString()}`,
      node: transactionSummaryValidator.validate(tx),
    }));

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
    const { requestKey, blockHash, minimumDepth, currentChainHeights } = params;
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
      b.canonical as canonical,
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

    const canonicalTxs = rows.filter(r => r.canonical === true);
    const orphanedTxs = rows.filter(r => r.canonical === false);
    let transactions: TransactionOutput[] = [...canonicalTxs, ...orphanedTxs];

    if (minimumDepth) {
      const filteredTxs = rows.filter(
        row => currentChainHeights[row.chainId] - row.height >= minimumDepth,
      );
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
      const [creationTime, id] = after.split(':');
      cursorCondition = `\nWHERE (t.creationtime, t.id) < ($3, $4)`;
      queryParams.push(creationTime, id);
    }

    if (before) {
      const [creationTime, id] = before.split(':');
      cursorCondition = `\nWHERE (t.creationtime, t.id) > ($3, $4)`;
      queryParams.push(creationTime, id);
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
      ORDER BY t.creationtime ${order}, t.id ${order}
      LIMIT $1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: `${row.creationTime.toString()}:${row.id.toString()}`,
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
    const {
      isCoinbase: isCoinbaseParam,
      chainId: chainIdParam,
      minimumDepth: minimumDepthParam,
      ...rest
    } = params;
    const hasNoOtherParams = Object.values(rest).every(v => v === undefined || v === null);
    if (hasNoOtherParams) {
      const query = `
        SELECT sum("canonicalTransactions") as "totalTransactionsCount", sum("canonicalBlocks") as "totalBlocksCount"
        FROM "Counters"
        ${chainIdParam ? `WHERE "chainId" = $1` : ''}
      `;

      const { rows } = await rootPgPool.query(query, chainIdParam ? [chainIdParam] : []);

      const totalTransactionsCount = parseInt(rows?.[0]?.totalTransactionsCount ?? '0', 10);
      const totalBlocksCount = parseInt(rows?.[0]?.totalBlocksCount ?? '0', 10);
      const totalCount = totalTransactionsCount + (params.isCoinbase ? totalBlocksCount : 0);

      const depthDecrement = (minimumDepthParam ?? 0) * (isNullOrUndefined(chainIdParam) ? 20 : 1);
      return Math.max(totalCount - depthDecrement, 0);
    }

    const {
      accountName: accountNameParam,
      fungibleName: fungibleNameParam,
      chainId: chainIdParamTwo,
      ...rest2
    } = params;
    const hasNoOtherParams2 = Object.values(rest2).every(v => v === undefined || v === null);
    if (accountNameParam && fungibleNameParam && hasNoOtherParams2) {
      let query = `
        SELECT COUNT(*) as count
        FROM "Transactions" t
        JOIN "Events" e ON e."transactionId" = t.id
        WHERE t.sender = $1 AND e.module = $2
      `;

      if (chainIdParamTwo) {
        query += `\nAND EXISTS (
          SELECT 1
          FROM "Blocks" b
          WHERE b.id = t."blockId"
          AND b."chainId" = $3
          AND b.canonical = true
        )`;
      }

      const { rows: countResult } = await rootPgPool.query(query, [
        accountNameParam,
        fungibleNameParam,
        chainIdParamTwo,
      ]);

      const totalCount = parseInt(countResult[0].count, 10);
      const depthDecrement =
        (minimumDepthParam ?? 0) * (isNullOrUndefined(chainIdParamTwo) ? 20 : 1);
      return Math.max(totalCount - depthDecrement, 0);
    }

    const {
      blockHash,
      accountName,
      chainId,
      requestKey,
      fungibleName,
      minHeight,
      maxHeight,
      hasTokenId,
    } = params;
    const transactionsParams: (string | number)[] = [];
    const blockParams: (string | number | boolean)[] = [];
    let transactionsConditions = '';
    let blocksConditions = '';

    const localOperator = (paramsLength: number) => (paramsLength > 1 ? `\nAND` : 'WHERE');

    if (accountName) {
      transactionsParams.push(accountName);
      const op = localOperator(transactionsParams.length);
      transactionsConditions += `${op} t.sender = $${transactionsParams.length}`;
    } else if (!isCoinbaseParam) {
      transactionsParams.push('coinbase');
      const op = localOperator(transactionsParams.length);
      transactionsConditions += `${op} t.sender != $${transactionsParams.length}`;
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

    blockParams.push(true);
    blocksConditions += `\nWHERE b.canonical = $${paramsOffset + blockParams.length}`;

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
    const depthDecrement = (minimumDepthParam ?? 0) * (isNullOrUndefined(chainIdParam) ? 20 : 1);

    return Math.max(totalCount - depthDecrement, 0);
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
