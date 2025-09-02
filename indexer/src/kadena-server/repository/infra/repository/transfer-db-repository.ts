/**
 * Database implementation of the TransferRepository interface
 *
 * This file provides a concrete implementation of the TransferRepository interface
 * for retrieving token transfer data from the PostgreSQL database. Transfers represent
 * the movement of tokens (both fungible and non-fungible) between accounts on the
 * Kadena blockchain.
 *
 * The implementation includes support for:
 * - Retrieving transfers with complex filtering options
 * - Querying transfers by block, transaction, or account
 * - Supporting cross-chain transfers through pact IDs
 * - Paginated access with cursor-based navigation
 * - Counting transfers for statistics and pagination
 */

import { rootPgPool } from '../../../../config/database';
import TransferRepository, {
  GetCrossChainTransferByPactIdParams,
  GetTotalCountParams,
  GetTransfersByTransactionIdParams,
  GetTransfersParams,
} from '../../application/transfer-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';
import { transferSchemaValidator } from '../schema-validator/transfer-schema-validator';

const operator = (paramsLength: number) => (paramsLength > 2 ? `AND` : 'WHERE');

/**
 * Database implementation of the TransferRepository interface
 *
 * This class provides methods to access and query token transfer data
 * stored in the PostgreSQL database. It handles complex SQL queries needed
 * to filter transfers based on various criteria and supports efficient
 * pagination for navigating large result sets.
 */
export default class TransferDbRepository implements TransferRepository {
  /**
   * Retrieves transfers with extensive filtering options
   *
   * This method provides a powerful way to query transfers with support for numerous
   * filtering criteria including:
   * - Block hash filtering
   * - Chain ID filtering
   * - Account name filtering (sender or receiver)
   * - Token module filtering
   * - Transaction request key filtering
   * - Module hash filtering
   *
   * Results are paginated and can be navigated using cursor-based pagination.
   *
   * @param params - Object containing various filtering options for transfers
   * @returns Promise resolving to page info and transfer edges
   */
  async getTransfers(params: GetTransfersParams) {
    const {
      blockHash,
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
      chainId,
      accountName,
      fungibleName,
      orderIndex,
      requestKey,
      moduleHash,
      hasTokenId,
    } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });
    const queryParams: (string | number | boolean)[] = [limit];
    let conditions = '';

    if (after) {
      const [creationTime, id] = after.split(':');
      queryParams.push(creationTime);
      const op = operator(queryParams.length);
      queryParams.push(id);
      conditions += `\n${op} (transfers.creationtime, transfers.id) < ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (before) {
      const [creationTime, id] = before.split(':');
      queryParams.push(creationTime);
      const op = operator(queryParams.length);
      queryParams.push(id);
      conditions += `\n${op} (transfers.creationtime, transfers.id) > ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (chainId) {
      queryParams.push(chainId);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers."chainId" = $${queryParams.length}`;
    }

    if (fungibleName) {
      queryParams.push(fungibleName);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers."modulename" = $${queryParams.length}`;
    }

    if (orderIndex) {
      queryParams.push(orderIndex);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers."orderIndex" = $${queryParams.length}`;
    }

    if (moduleHash) {
      queryParams.push(moduleHash);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.modulehash = $${queryParams.length}`;
    }

    if (requestKey) {
      queryParams.push(requestKey);
      const op = operator(queryParams.length);
      conditions += `\n${op} t.requestkey = $${queryParams.length}`;
    }

    if (blockHash) {
      queryParams.push(blockHash);
      const op = operator(queryParams.length);
      conditions += `\n${op} b.hash = $${queryParams.length}`;
    }

    queryParams.push(hasTokenId ?? false);
    const op = operator(queryParams.length);
    conditions += `\n${op} transfers."hasTokenId" = $${queryParams.length}`;

    let query = '';
    if (accountName) {
      queryParams.push(accountName);

      const columns = `
        id,
        amount as "transferAmount",
        "chainId" as "chainId",
        "creationtime" as "creationTime",
        "transactionId" as "transactionId",
        "from_acct" as "senderAccount",
        "to_acct" as "receiverAccount", 
        modulename as "moduleName",
        modulehash as "moduleHash",
        requestkey as "requestKey",
        "orderIndex",
        "tokenId",
        "hasTokenId"
      `;
      query = `
        WITH from_transfers AS (
          SELECT ${columns}
          FROM "Transfers" transfers
          ${conditions}
          AND transfers."from_acct" = $${queryParams.length}
          ORDER BY transfers."creationtime" ${order}, transfers.id ${order}
          LIMIT 100
        ),
        to_transfers AS (
          SELECT ${columns}
          FROM "Transfers" transfers
          ${conditions}
          AND transfers."to_acct" = $${queryParams.length}
          ORDER BY transfers."creationtime" ${order}, transfers.id ${order}
          LIMIT 100
        )
        SELECT
        transfers.*,
        b.height as "height",
        b.hash as "blockHash"
        FROM (
          SELECT * FROM from_transfers
          UNION ALL
          SELECT * FROM to_transfers
        ) transfers
        JOIN "Transactions" t on t.id = transfers."transactionId"
        JOIN "Blocks" b on b.id = t."blockId"
        ORDER BY transfers."creationTime" ${order}, transfers.id ${order}
        LIMIT $1
      `;
    } else {
      query = `
        select transfers.id,
        transfers.amount as "transferAmount",
        transfers."chainId" as "chainId",
        transfers."creationtime" as "creationTime",
        transfers."transactionId" as "transactionId",
        b.height as "height",
        b.hash as "blockHash",
        transfers."from_acct" as "senderAccount",
        transfers."to_acct" as "receiverAccount",
        transfers.modulename as "moduleName",
        transfers.modulehash as "moduleHash",
        transfers.requestkey as "requestKey",
        transfers."orderIndex" as "orderIndex",
        transfers."tokenId" as "tokenId"
        from "Transfers" transfers
        join "Transactions" t on t.id = transfers."transactionId"
        join "Blocks" b on b.id = t."blockId"
        ${conditions}
        ORDER BY transfers.creationtime ${order}, transfers.id ${order}
        LIMIT $1
      `;
    }

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: `${row.creationTime.toString()}:${row.id.toString()}`,
      node: transferSchemaValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Retrieves cross-chain transfer information by its Pact ID
   *
   * This method is specifically designed to locate transfers that occur
   * across different chains in the Kadena network. It uses both the pactId
   * (which links related cross-chain operations) and the transfer amount
   * to uniquely identify the transfer.
   *
   * @param params - Object containing pactId and amount to identify the cross-chain transfer
   * @returns Promise resolving to the transfer data if found
   */
  async getCrossChainTransferByPactId({
    amount,
    transactionId,
    receiverAccount,
    senderAccount,
  }: GetCrossChainTransferByPactIdParams) {
    let conditions = '';

    if (senderAccount === '') {
      conditions += `\nAND transfers."to_acct" = ''`;
    }
    if (receiverAccount === '') {
      conditions += `\nAND transfers."from_acct" = ''`;
    }

    const query = `
      select transfers.id as id,
      transfers.amount as "transferAmount",
      transactions."chainId" as "chainId",
      transactions."creationtime" as "creationTime",
      transactions.id as "transactionId",
      b.height as "height",
      b.hash as "blockHash",
      transfers."from_acct" as "senderAccount",
      transfers."to_acct" as "receiverAccount",
      transfers.modulename as "moduleName",
      transfers.modulehash as "moduleHash",
      transfers.requestkey as "requestKey",
      transfers."orderIndex" as "orderIndex",
      td.pactid as "pactId"
      from "Blocks" b
      join "Transactions" transactions on b.id = transactions."blockId"
      join "Transfers" transfers on transfers."transactionId" = transactions.id 
      left join "TransactionDetails" td on transactions.id = td."transactionId"
      where td.pactid = (SELECT pactid FROM "TransactionDetails" WHERE "transactionId" = $1)
      and transfers.amount = $2
      ${conditions}
    `;

    const { rows } = await rootPgPool.query(query, [transactionId, amount]);
    const [row] = rows;
    if (!row) return null;
    const output = transferSchemaValidator.validate(row);
    return output;
  }

  /**
   * Counts the total number of transfers matching specific filter criteria
   *
   * This method performs a COUNT query to determine how many transfers
   * match a given set of filtering criteria, including block hash, account name,
   * chain ID, transaction ID, token module name, and request key.
   *
   * For efficiency, if no parameters are provided, it uses a sequence value
   * to get the total count of all transfers in the system.
   *
   * @param params - Object containing filtering criteria for transfers
   * @returns Promise resolving to the total count of matching transfers
   */
  async getTotalCountOfTransfers(params: GetTotalCountParams): Promise<number> {
    const hasNoParams = Object.values(params).every(v => !v);

    if (hasNoParams) {
      const totalTransfersCountQuery = `
        SELECT last_value as "totalTransfersCount" from "Transfers_id_seq"
      `;
      const { rows } = await rootPgPool.query(totalTransfersCountQuery);
      const transfersCount = parseInt(rows[0].totalTransfersCount, 10);
      return transfersCount;
    }

    const { blockHash, accountName, chainId, transactionId, fungibleName, requestKey, hasTokenId } =
      params;
    const queryParams: (string | number | boolean)[] = [];
    let conditions = '';

    const localOperator = (length: number) => (length > 1 ? `\nAND` : 'WHERE');

    if (accountName) {
      queryParams.push(accountName);
      const op = localOperator(queryParams.length);
      conditions += `\n${op} (trans.from_acct = $${queryParams.length} OR trans.to_acct = $${queryParams.length})`;
    }

    if (blockHash) {
      queryParams.push(blockHash);
      const op = localOperator(queryParams.length);
      conditions += `${op} b.hash = $${queryParams.length}`;
    }

    if (chainId) {
      queryParams.push(chainId);
      const op = localOperator(queryParams.length);
      conditions += `${op} b."chainId" = $${queryParams.length}`;
    }

    if (transactionId) {
      queryParams.push(transactionId);
      const op = localOperator(queryParams.length);
      conditions += `${op} t.id = $${queryParams.length}`;
    }

    if (fungibleName) {
      queryParams.push(fungibleName);
      const op = localOperator(queryParams.length);
      conditions += `${op} trans.modulename = $${queryParams.length}`;
    }

    if (requestKey) {
      queryParams.push(requestKey);
      const op = localOperator(queryParams.length);
      conditions += `${op} t.requestkey = $${queryParams.length}`;
    }

    queryParams.push(hasTokenId ?? false);
    const op = localOperator(queryParams.length);
    conditions += `${op} trans."hasTokenId" = $${queryParams.length}`;

    const totalCountQuery = `
      SELECT COUNT(*) as count
      FROM "Transfers" trans
      join "Transactions" t on t.id = trans."transactionId"
      join "Blocks" b on b.id = t."blockId"
      ${conditions}
    `;

    const { rows: countResult } = await rootPgPool.query(totalCountQuery, queryParams);

    const totalCount = parseInt(countResult[0].count, 10);
    return totalCount;
  }

  /**
   * Retrieves transfers from a specific transaction with pagination support
   *
   * This method fetches transfers that were created during the execution of a
   * specific transaction, supporting cursor-based pagination for efficient
   * navigation through large result sets.
   *
   * @param params - Object containing transaction ID and pagination parameters
   * @returns Promise resolving to page info and transfer edges
   */
  async getTransfersByTransactionId(params: GetTransfersByTransactionIdParams) {
    const {
      transactionId,
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
      hasTokenId,
    } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const queryParams: (string | number | boolean)[] = [limit, transactionId, hasTokenId ?? false];
    let conditions = '\nAND transfers."hasTokenId" = $3';

    if (before) {
      queryParams.push(before);
      conditions += `\nAND transfers.id > $4`;
    }

    if (after) {
      queryParams.push(after);
      conditions += `\nAND transfers.id < $4`;
    }

    const query = `
      select transfers.id as id,
      transfers.amount as "transferAmount",
      transactions.id as "transactionId",
      transactions."chainId" as "chainId",
      transactions."creationtime" as "creationTime",
      b.height as "height",
      b.hash as "blockHash",
      transfers."from_acct" as "senderAccount",
      transfers."to_acct" as "receiverAccount",
      transfers.modulename as "moduleName",
      transfers.modulehash as "moduleHash",
      transfers.requestkey as "requestKey",
      transfers."orderIndex" as "orderIndex",
      transfers."tokenId" as "tokenId"
      from "Blocks" b
      join "Transactions" transactions on b.id = transactions."blockId"
      join "Transfers" transfers on transfers."transactionId" = transactions.id 
      WHERE transactions.id = $2
      ${conditions}
      ORDER BY transfers.id ${order}
      LIMIT $1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: row.id.toString(),
      node: transferSchemaValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }
}
