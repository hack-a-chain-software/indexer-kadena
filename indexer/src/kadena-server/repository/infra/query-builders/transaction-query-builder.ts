/**
 * Specialized class for building SQL queries related to blockchain transactions
 *
 * This class encapsulates the complex logic for constructing SQL queries
 * to retrieve transactions from the database with various filtering criteria.
 */
import { isNullOrUndefined } from '@/utils/helpers';
import {
  GetTransactionsCountParams,
  GetTransactionsParams,
} from '../../../repository/application/transaction-repository';

export default class TransactionQueryBuilder {
  /**
   * Helper function to determine the appropriate SQL operator based on parameter position.
   * For the first condition in a query, we use 'WHERE', for subsequent conditions, we use 'AND'.
   *
   * @param paramsLength - The current number of parameters in the query
   * @returns The appropriate SQL operator ('WHERE' or 'AND')
   */
  private operator(paramsLength: number): string {
    return paramsLength > 2 ? `\nAND` : 'WHERE';
  }

  /**
   * Creates SQL conditions for filtering transactions by block-related attributes.
   * This handles conditions like block hash, chain ID, height range, and confirmation depth.
   *
   * @param params - Transaction query parameters containing block filter conditions
   * @param queryParams - Current array of query parameters (for parameter indexing)
   * @returns Object containing the generated SQL conditions and updated parameter array
   */
  private createBlockConditions(
    params: GetTransactionsParams,
    queryParams: Array<string | number | boolean>,
    maxHeightFromDb: number,
  ) {
    const { blockHash, chainId, maxHeight, minHeight, accountName } = params;
    let blocksConditions = '';
    const blockParams: (string | number | boolean)[] = [...queryParams];

    blockParams.push(true);
    blocksConditions += `WHERE b.canonical = $${blockParams.length}`;

    if (blockHash) {
      blockParams.push(blockHash);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b.hash = $${blockParams.length}`;
    }

    if (isNullOrUndefined(accountName) && maxHeight && !minHeight) {
      blockParams.push(maxHeight);
      const op = this.operator(blockParams.length);
      const secondCondition = `LEAST($${blockParams.length}, ${maxHeightFromDb}) - 20`;
      blocksConditions += `${op} b."height" <= $${blockParams.length} AND b."height" >= ${secondCondition}`;
    }

    if (isNullOrUndefined(accountName) && minHeight && !maxHeight) {
      if (minHeight < 0) {
        throw new Error('minHeight cannot be less than 0');
      }
      blockParams.push(minHeight);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."height" >= $${blockParams.length} AND b."height" <= $${blockParams.length} + 20`;
    }

    if (isNullOrUndefined(accountName) && minHeight && maxHeight) {
      if (minHeight > maxHeight) {
        throw new Error('minHeight cannot be greater than maxHeight');
      }

      blockParams.push(minHeight);
      const op = this.operator(blockParams.length);
      blockParams.push(maxHeight);
      const secondCondition = `LEAST($${blockParams.length - 1} + 20, $${blockParams.length})`;
      blocksConditions += `${op} b."height" >= $${blockParams.length - 1} AND b."height" <= ${secondCondition}`;
    }

    if (!isNullOrUndefined(accountName) && minHeight) {
      blockParams.push(minHeight);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."height" >= $${blockParams.length}`;
    }

    if (!isNullOrUndefined(accountName) && maxHeight) {
      blockParams.push(maxHeight);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."height" <= $${blockParams.length}`;
    }

    if (!isNullOrUndefined(accountName) && minHeight && maxHeight) {
      blockParams.push(minHeight);
      const op = this.operator(blockParams.length);
      blockParams.push(maxHeight);
      blocksConditions += `${op} b."height" >= $${blockParams.length - 1} AND b."height" <= $${blockParams.length}`;
    }

    if (chainId) {
      blockParams.push(chainId);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."chainId" = $${blockParams.length}`;
    }

    return { blocksConditions, blockParams };
  }

  /**
   * Creates SQL conditions for filtering transactions by transaction-specific attributes.
   * This handles conditions like account name, cursor-based pagination, request key,
   * fungible token name, and NFT token ownership.
   *
   * @param params - Transaction query parameters containing transaction filter conditions
   * @param queryParams - Current array of query parameters (for parameter indexing)
   * @returns Object containing the generated SQL conditions and updated parameter array
   */
  private createTransactionConditions(
    params: GetTransactionsParams,
    queryParams: Array<string | number | boolean>,
  ) {
    const {
      accountName,
      after,
      before,
      requestKey,
      fungibleName,
      hasTokenId = false,
      isCoinbase,
    } = params;
    let conditions = '';

    const transactionParams: (string | number)[] = [];

    const localOperator = (paramsLength: number) => (paramsLength > 1 ? `\nAND` : 'WHERE');

    // Add sender account condition for regular (non-NFT) transactions
    if (accountName && !hasTokenId) {
      transactionParams.push(accountName);
      const op = localOperator(transactionParams.length);
      conditions += `${op} t.sender = $${queryParams.length + transactionParams.length}`;
    } else if (!isCoinbase) {
      transactionParams.push('coinbase');
      const op = localOperator(transactionParams.length);
      conditions += `${op} t.sender != $${queryParams.length + transactionParams.length}`;
    }

    // Add 'after' cursor condition for pagination
    if (after) {
      const [creationTime, id] = after.split(':');
      transactionParams.push(creationTime);
      const op = localOperator(transactionParams.length);
      transactionParams.push(id);
      conditions += `${op} (t.creationtime, t.id) < ($${queryParams.length + transactionParams.length - 1}, $${queryParams.length + transactionParams.length})`;
    }

    // Add 'before' cursor condition for pagination
    if (before) {
      const [creationTime, id] = before.split(':');
      transactionParams.push(creationTime);
      const op = localOperator(transactionParams.length);
      transactionParams.push(id);
      conditions += `${op} (t.creationtime, t.id) > ($${queryParams.length + transactionParams.length - 1}, $${queryParams.length + transactionParams.length})`;
    }

    // Add request key condition for exact transaction lookup
    if (requestKey) {
      transactionParams.push(requestKey);
      const op = localOperator(transactionParams.length);
      conditions += `${op} t."requestkey" = $${queryParams.length + transactionParams.length}`;
    }

    // Add fungible token name condition using a subquery on Events table
    if (fungibleName) {
      transactionParams.push(fungibleName);
      const op = localOperator(transactionParams.length);
      conditions += `
        ${op} EXISTS
        (
          SELECT 1
          FROM "Events" e
          WHERE e."transactionId" = t.id
          AND e."module" = $${queryParams.length + transactionParams.length}
        )`;
    }

    // Add NFT ownership condition using a subquery on Transfers table
    if (accountName && hasTokenId) {
      transactionParams.push(accountName);
      const op = localOperator(transactionParams.length);
      conditions += `
        ${op} EXISTS
        (
          SELECT 1
          FROM "Transfers" t
          WHERE (t."from_acct" = $${queryParams.length + transactionParams.length} OR t."to_acct" = $${queryParams.length + transactionParams.length})
          AND t."modulename" = 'marmalade-v2.ledger'
        )`;
    }

    return { conditions, params: [...queryParams, ...transactionParams] };
  }

  /**
   * Builds the complete SQL query for retrieving transactions with various filter criteria
   *
   * @param params Parameters for building the transactions query
   * @returns Object containing the query string and parameters array
   */
  buildTransactionsQuery(
    params: GetTransactionsCountParams & {
      after?: string | null;
      before?: string | null;
      order: string;
      limit: number;
      maxHeightFromDb: number;
    },
  ) {
    const {
      blockHash,
      chainId,
      maxHeight,
      minHeight,
      minimumDepth,
      limit,
      order,
      after,
      before,
      maxHeightFromDb,
    } = params;

    // Determine if block-based filtering is the primary access pattern
    const isBlockQueryFirst = blockHash || minHeight || maxHeight || minimumDepth || chainId;

    // Initialize query parameters and condition strings
    const queryParams: (string | number | boolean)[] = [];
    let blocksConditions = '';
    let transactionsConditions = '';

    // Build query conditions based on the primary access pattern
    if (isBlockQueryFirst) {
      // Start with block conditions when block filtering is primary
      const { blockParams, blocksConditions: bConditions } = this.createBlockConditions(
        params,
        [limit],
        maxHeightFromDb,
      );

      const { params: txParams, conditions: txConditions } = this.createTransactionConditions(
        { ...params, after, before },
        blockParams,
      );

      queryParams.push(...txParams);
      transactionsConditions = txConditions;
      blocksConditions = bConditions;
    } else {
      // Start with transaction conditions when transaction filtering is primary
      const { conditions, params: txParams } = this.createTransactionConditions(
        { ...params, after, before },
        [limit],
      );
      const { blocksConditions: bConditions, blockParams } = this.createBlockConditions(
        params,
        txParams,
        maxHeightFromDb,
      );

      queryParams.push(...blockParams);
      transactionsConditions = conditions;
      blocksConditions = bConditions;
    }

    // Construct the appropriate SQL query based on the primary access pattern
    let query = '';
    if (isBlockQueryFirst) {
      // Block-first query strategy: filter blocks first, then join to transactions
      query = `
        WITH filtered_block AS (
          SELECT b.id, b.hash, b."chainId", b.height
          FROM "Blocks" b
          ${blocksConditions}
        )
        SELECT
          t.id AS id,
          t.creationtime AS "creationTime",
          t.hash AS "hashTransaction",
          NULL AS "nonceTransaction",
          NULL AS sigs,
          NULL AS continuation,
          t.num_events AS "eventCount",
          NULL AS "pactId",
          NULL AS proof,
          NULL AS rollback,
          t.txid AS txid,
          b.height AS "height",
          b."hash" AS "blockHash",
          b."chainId" AS "chainId",
          NULL AS "gas",
          NULL AS step,
          NULL AS data,
          NULL AS code,
          t.logs AS "logs",
          t.result AS "result",
          t.requestkey AS "requestKey"
        FROM filtered_block b
        JOIN "Transactions" t ON b.id = t."blockId"
        ${transactionsConditions}
        ORDER BY t.creationtime ${order}, t.id ${order}
        LIMIT $1
      `;
    } else {
      // Transaction-first query strategy: filter transactions first, then join to blocks
      query = `
        WITH filtered_transactions AS (
          SELECT t.id, t."blockId", t.hash, t.num_events, t.txid, t.logs, t.result, t.requestkey, t."chainId", t.creationtime
          FROM "Transactions" t
          ${transactionsConditions}
          ORDER BY t.creationtime ${order}, t.id ${order}
        )
        SELECT
          t.id AS id,
          t.creationtime AS "creationTime",
          t.hash AS "hashTransaction",
          NULL AS "nonceTransaction",
          NULL AS sigs,
          NULL AS continuation,
          t.num_events AS "eventCount",
          NULL AS "pactId",
          NULL AS proof,
          NULL AS rollback,
          t.txid AS txid,
          b.height AS "height",
          b."hash" AS "blockHash",
          b."chainId" AS "chainId",
          NULL AS "gas",
          NULL AS step,
          NULL AS data,
          NULL AS code,
          t.logs AS "logs",
          t.result AS "result",
          t.requestkey AS "requestKey"
        FROM filtered_transactions t
        JOIN "Blocks" b ON b.id = t."blockId"
        ${blocksConditions}
        LIMIT $1
      `;
    }

    return { query, queryParams };
  }

  buildAllTransactionsQuery(params: {
    after?: string | null;
    before?: string | null;
    order: string;
    limit: number;
    isCoinbase?: boolean | null;
  }) {
    let whereCondition = '';
    let queryParams: (string | number)[] = [params.limit];

    if (!params.after && !params.before && params.order === 'DESC') {
      const currentTime = Date.now() - 10000000;
      queryParams.push(currentTime, 0);
      whereCondition = ` WHERE t.creationtime > $2 AND t.id > $3`;
    }

    if (!params.after && !params.before && params.order === 'ASC') {
      const currentTime = 1572404687 + 1000;
      queryParams.push(currentTime, 1000);
      whereCondition = ` WHERE t.creationtime < $2 AND t.id < $3`;
    }

    if (params.after) {
      const [creationTime, id] = params.after.split(':');
      queryParams.push(creationTime, id);
      whereCondition = ` WHERE (t.creationtime, t.id) < ($2, $3)`;
    }
    if (params.before) {
      const [creationTime, id] = params.before.split(':');
      queryParams.push(creationTime, id);
      whereCondition = ` WHERE (t.creationtime, t.id) > ($2, $3)`;
    }

    if (!params.isCoinbase) {
      whereCondition += ` AND t.sender != 'coinbase'`;
    }

    whereCondition += ` AND b.canonical = true`;

    let query = `
      SELECT
        t.id AS id,
        t.creationtime AS "creationTime",
        t.hash AS "hashTransaction",
        NULL AS "nonceTransaction",
        NULL AS sigs,
        NULL AS continuation,
        t.num_events AS "eventCount",
        NULL AS "pactId",
        NULL AS proof,
        NULL AS rollback,
        t.txid AS txid,
        b.height AS "height",
        b."hash" AS "blockHash",
        b."chainId" AS "chainId",
        NULL AS "gas",
        NULL AS step,
        NULL AS data,
        NULL AS code,
        t.logs AS "logs",
        t.result AS "result",
        t.requestkey AS "requestKey"
      FROM "Transactions" t
      JOIN "Blocks" b ON b.id = t."blockId"
      ${whereCondition}
      ORDER BY t.creationtime ${params.order}, t.id ${params.order}
      LIMIT $1
    `;

    return { query, queryParams };
  }

  buildTransactionByCodeQuery(params: {
    after?: string | null;
    before?: string | null;
    order: string;
    limit: number;
    transactionCode: string;
  }) {
    let whereCondition = `\nWHERE td.code::text LIKE '%' || $2 || '%' AND t.sender != 'coinbase'`;
    let queryParams: (string | number | boolean)[] = [params.limit, params.transactionCode];

    if (params.after) {
      const [creationTime, id] = params.after.split(':');
      queryParams.push(creationTime, id);
      whereCondition += `\nAND (t.creationtime, t.id) < ($${queryParams.length - 1}, $${queryParams.length})`;
    }
    if (params.before) {
      const [creationTime, id] = params.before.split(':');
      queryParams.push(creationTime, id);
      whereCondition += `\nAND (t.creationtime, t.id) > ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    const query = `
      SELECT
        t.id AS id,
        t.requestkey AS "requestKey",
        t."chainId" AS "chainId",
        t.creationtime AS "creationTime",
        t.sender AS "sender",
        td.gas AS "gas",
        td.gaslimit AS "gasLimit",
        td.gasprice AS "gasPrice",
        t.result AS "result",
        b.height AS "height",
        b.canonical AS "canonical"
        FROM "TransactionDetails" td
        JOIN "Transactions" t ON t.id = td."transactionId"
        JOIN "Blocks" b ON b.id = t."blockId"
        ${whereCondition}
        ORDER BY t.creationtime ${params.order}, t.id ${params.order}
        LIMIT $1
    `;

    return { query, queryParams };
  }
}
