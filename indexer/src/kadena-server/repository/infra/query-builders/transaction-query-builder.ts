/**
 * Specialized class for building SQL queries related to blockchain transactions
 *
 * This class encapsulates the complex logic for constructing SQL queries
 * to retrieve transactions from the database with various filtering criteria.
 */
import { GetTransactionsParams } from '../../../repository/application/transaction-repository';

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
    queryParams: Array<string | number>,
  ) {
    const { blockHash, chainId, maxHeight, minHeight, minimumDepth } = params;
    let blocksConditions = '';
    const blockParams: (string | number)[] = [...queryParams];

    // Add block hash condition if specified
    if (blockHash) {
      blockParams.push(blockHash);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b.hash = $${blockParams.length}`;
    }

    // Add chain ID condition if specified
    if (chainId) {
      blockParams.push(chainId);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."chainId" = $${blockParams.length}`;
    }

    // Add maximum height condition if specified
    if (maxHeight) {
      blockParams.push(maxHeight);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."height" <= $${blockParams.length}`;
    }

    // Add minimum height condition if specified
    if (minHeight) {
      blockParams.push(minHeight);
      const op = this.operator(blockParams.length);
      blocksConditions += `${op} b."height" >= $${blockParams.length}`;
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
    queryParams: Array<string | number>,
  ) {
    const { accountName, after, before, requestKey, fungibleName, hasTokenId = false } = params;
    let conditions = '';

    const transactionParams: (string | number)[] = [];

    const localOperator = (paramsLength: number) => (paramsLength > 1 ? `\nAND` : 'WHERE');

    // Add sender account condition for regular (non-NFT) transactions
    if (accountName && !hasTokenId) {
      transactionParams.push(accountName);
      const op = localOperator(transactionParams.length);
      conditions += `${op} t.sender = $${queryParams.length + transactionParams.length}`;
    }

    // Add 'after' cursor condition for pagination
    if (after) {
      transactionParams.push(after);
      const op = localOperator(transactionParams.length);
      conditions += `${op} t.creationtime < $${queryParams.length + transactionParams.length}`;
    }

    // Add 'before' cursor condition for pagination
    if (before) {
      transactionParams.push(before);
      const op = localOperator(transactionParams.length);
      conditions += `${op} t.creationtime > $${queryParams.length + transactionParams.length}`;
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
      const op = localOperator(queryParams.length + transactionParams.length);
      conditions += `
        ${op} EXISTS
        (
          SELECT 1
          FROM "Transfers" t
          WHERE (t."from_acct" = $${transactionParams.length} OR t."to_acct" = $${transactionParams.length})
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
    params: GetTransactionsParams & {
      after?: string | null;
      before?: string | null;
      order: string;
      limit: number;
    },
  ) {
    const { blockHash, chainId, maxHeight, minHeight, minimumDepth, limit, order, after, before } =
      params;

    // Determine if block-based filtering is the primary access pattern
    const isBlockQueryFirst = blockHash || minHeight || maxHeight || minimumDepth || chainId;

    // Initialize query parameters and condition strings
    const queryParams: (string | number)[] = [];
    let blocksConditions = '';
    let transactionsConditions = '';

    // Build query conditions based on the primary access pattern
    if (isBlockQueryFirst) {
      // Start with block conditions when block filtering is primary
      const { blockParams, blocksConditions: bConditions } = this.createBlockConditions(params, [
        limit,
      ]);

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
          td.nonce AS "nonceTransaction",
          td.sigs AS sigs,
          td.continuation AS continuation,
          t.num_events AS "eventCount",
          td.pactid AS "pactId",
          td.proof AS proof,
          td.rollback AS rollback,
          t.txid AS txid,
          b.height AS "height",
          b."hash" AS "blockHash",
          b."chainId" AS "chainId",
          td.gas AS "gas",
          td.step AS step,
          td.data AS data,
          td.code AS code,
          t.logs AS "logs",
          t.result AS "result",
          t.requestkey AS "requestKey"
        FROM filtered_block b
        JOIN "Transactions" t ON b.id = t."blockId"
        LEFT JOIN "TransactionDetails" td ON t.id = td."transactionId"
        ${transactionsConditions}
        ORDER BY t.creationtime ${order}
        LIMIT $1
      `;
    } else {
      // Transaction-first query strategy: filter transactions first, then join to blocks
      query = `
        WITH filtered_transactions AS (
          SELECT t.id, t."blockId", t.hash, t.num_events, t.txid, t.logs, t.result, t.requestkey, t."chainId", t.creationtime
          FROM "Transactions" t
          ${transactionsConditions}
          ORDER BY t.creationtime ${order}
          LIMIT $1
        )
        SELECT
          t.id AS id,
          t.creationtime AS "creationTime",
          t.hash AS "hashTransaction",
          td.nonce AS "nonceTransaction",
          td.sigs AS sigs,
          td.continuation AS continuation,
          t.num_events AS "eventCount",
          td.pactid AS "pactId",
          td.proof AS proof,
          td.rollback AS rollback,
          t.txid AS txid,
          b.height AS "height",
          b."hash" AS "blockHash",
          b."chainId" AS "chainId",
          td.gas AS "gas",
          td.step AS step,
          td.data AS data,
          td.code AS code,
          td.nonce,
          td.sigs,
          t.logs AS "logs",
          t.result AS "result",
          t.requestkey AS "requestKey"
        FROM filtered_transactions t
        JOIN "Blocks" b ON b.id = t."blockId"
        LEFT JOIN "TransactionDetails" td ON t.id = td."transactionId"
        ${blocksConditions}
      `;
    }

    return { query, queryParams };
  }
}
