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

    if (accountName) {
      queryParams.push(accountName);
      const op = operator(queryParams.length);
      conditions += `\n${op} (transfers.from_acct = $${queryParams.length} OR transfers.to_acct = $${queryParams.length})`;
    }

    if (hasTokenId) {
      queryParams.push('marmalade-v2.ledger');
      queryParams.push('marmalade.ledger');
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.modulename IN ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (after) {
      const [creationTime, id] = after.split(':');
      queryParams.push(creationTime);
      const op = operator(queryParams.length);
      queryParams.push(id);
      conditions += `\n${op} (t.creationtime, t.id) < ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (before) {
      const [creationTime, id] = before.split(':');
      queryParams.push(creationTime);
      const op = operator(queryParams.length);
      queryParams.push(id);
      conditions += `\n${op} (t.creationtime, t.id) > ($${queryParams.length - 1}, $${queryParams.length})`;
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

    let query = '';

    if (blockHash) {
      if (requestKey) {
        queryParams.push(requestKey);
        conditions += `\nAND t.requestkey = $${queryParams.length}`;
      }
      queryParams.push(blockHash);
      query = `
        WITH filtered_block AS (
          SELECT id, height, hash
          FROM "Blocks" b
          WHERE b.hash = $${queryParams.length}
        )
        select transfers.id as id,
        transfers.amount as "transferAmount",
        t."chainId" as "chainId",
        t."creationtime" as "creationTime",
        t.id as "transactionId",
        b.height as "height",
        b.hash as "blockHash",
        transfers."from_acct" as "senderAccount",
        transfers."to_acct" as "receiverAccount",
        transfers.modulename as "moduleName",
        transfers.modulehash as "moduleHash",
        transfers.requestkey as "requestKey",
        transfers."orderIndex" as "orderIndex",
        td.pactid as "pactId"
        from filtered_block b
        join "Transactions" t on b.id = t."blockId"
        join "Transfers" transfers on transfers."transactionId" = t.id
        left join "TransactionDetails" td on t.id = td."transactionId"
        ${conditions}
        ORDER BY t."creationtime" ${order}, transfers.id ${order}
        LIMIT $1
      `;
    } else if (requestKey) {
      if (blockHash) {
        queryParams.push(blockHash);
        conditions += `\nAND b.hash = $${queryParams.length}`;
      }

      queryParams.push(requestKey);
      query = `
        WITH filtered_transaction AS (
          SELECT t.id, t."chainId", t."creationtime", t."blockId"
          FROM "Transactions" t
          WHERE t.requestkey = $${queryParams.length}
        )
        select transfers.id as id,
        transfers.amount as "transferAmount",
        t."chainId" as "chainId",
        t."creationtime" as "creationTime",
        t.id as "transactionId",
        b.height as "height",
        b.hash as "blockHash",
        transfers."from_acct" as "senderAccount",
        transfers."to_acct" as "receiverAccount",
        transfers.modulename as "moduleName",
        transfers.modulehash as "moduleHash",
        transfers.requestkey as "requestKey",
        transfers."orderIndex" as "orderIndex",
        td.pactid as "pactId"
        from filtered_transaction t
        join "Blocks" b on b.id = t."blockId"
        join "Transfers" transfers on transfers."transactionId" = t.id
        left join "TransactionDetails" td on t.id = td."transactionId"
        ${conditions}
        ORDER BY t."creationtime" ${order}, transfers.id ${order}
        LIMIT $1
      `;
    } else {
      query = `
        select transfers.id as id,
        transfers.amount as "transferAmount",
        t."chainId" as "chainId",
        t."creationtime" as "creationTime",
        t.id as "transactionId",
        b.height as "height",
        b.hash as "blockHash",
        transfers."from_acct" as "senderAccount",
        transfers."to_acct" as "receiverAccount",
        transfers.modulename as "moduleName",
        transfers.modulehash as "moduleHash",
        transfers.requestkey as "requestKey",
        transfers."orderIndex" as "orderIndex",
        td.pactid as "pactId"
        from "Transfers" transfers
        join "Transactions" t on t.id = transfers."transactionId"
        join "Blocks" b on b."id" = t."blockId"
        left join "TransactionDetails" td on t.id = td."transactionId"
        ${conditions}
        ORDER BY t."creationtime" ${order}, transfers.id ${order}
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
    pactId,
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
      where td.pactid = $1
      and transfers.amount = $2
      ${conditions}
    `;

    const { rows } = await rootPgPool.query(query, [pactId, amount]);
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
    const queryParams: (string | number)[] = [];
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

    if (hasTokenId) {
      queryParams.push('marmalade-v2.ledger');
      queryParams.push('marmalade.ledger');
      const op = localOperator(queryParams.length);
      conditions += `${op} trans.modulename IN ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (requestKey) {
      queryParams.push(requestKey);
      const op = localOperator(queryParams.length);
      conditions += `${op} t.requestkey = $${queryParams.length}`;
    }

    const totalCountQuery = `
      SELECT COUNT(*) as count
      from "Blocks" b
      join "Transactions" t on b.id = t."blockId"
      join "Transfers" trans on trans."transactionId" = t.id 
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
    const { transactionId, after: afterEncoded, before: beforeEncoded, first, last } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const queryParams: (string | number)[] = [limit, transactionId];
    let conditions = '';

    if (before) {
      queryParams.push(before);
      conditions += `\nAND transfers.id > $3`;
    }

    if (after) {
      queryParams.push(after);
      conditions += `\nAND transfers.id < $3`;
    }

    const query = `
      select transfers.id as id,
      transfers.amount as "transferAmount",
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
      td.pactid as "pactId"
      from "Blocks" b
      join "Transactions" transactions on b.id = transactions."blockId"
      join "Transfers" transfers on transfers."transactionId" = transactions.id 
      left join "TransactionDetails" td on transactions.id = td."transactionId"
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
