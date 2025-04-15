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

export default class TransferDbRepository implements TransferRepository {
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
    } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });
    const queryParams: (string | number)[] = [limit];
    let conditions = '';

    if (accountName) {
      queryParams.push(accountName);
      const op = operator(queryParams.length);
      conditions += `\n${op} (transfers.from_acct = $${queryParams.length} OR transfers.to_acct = $${queryParams.length})`;
    }

    if (after) {
      queryParams.push(after);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.id < $${queryParams.length}`;
    }

    if (before) {
      queryParams.push(before);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.id > $${queryParams.length}`;
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
      queryParams.push(blockHash);
      const op = operator(queryParams.length);
      query = `
        WITH filtered_block AS (
          SELECT id, height, hash
          FROM "Blocks" b
          ${op} b.hash = $${queryParams.length}
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
        ORDER BY transfers.id ${order}
        LIMIT $1
      `;
    } else if (requestKey) {
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
        ORDER BY transfers.id ${order}
        LIMIT $1
      `;
    } else if (accountName) {
      query = `
        WITH filtered_transfers AS (
          SELECT id, amount, "transactionId", "from_acct", "to_acct", modulename, modulehash, requestkey, "orderIndex"
          FROM "Transfers" transfers
          ${conditions}
          ORDER BY transfers.id ${order}
          LIMIT ALL
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
        from filtered_transfers transfers
        join "Transactions" t on t.id = transfers."transactionId"
        join "Blocks" b on b."id" = t."blockId"
        left join "TransactionDetails" td on t.id = td."transactionId"
        LIMIT $1
      `;
    } else {
      query = `
        WITH filtered_transfers AS (
          SELECT id, amount, "transactionId", "from_acct", "to_acct", modulename, modulehash, requestkey, "orderIndex"
          FROM "Transfers" transfers
          ${conditions}
          ORDER BY transfers.id ${order}
          LIMIT $1
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
        from filtered_transfers transfers
        join "Transactions" t on t.id = transfers."transactionId"
        join "Blocks" b on b."id" = t."blockId"
        left join "TransactionDetails" td on t.id = td."transactionId"
      `;
    }

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: row.id.toString(),
      node: transferSchemaValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  async getCrossChainTransferByPactId({
    amount,
    pactId,
    requestKey,
  }: GetCrossChainTransferByPactIdParams) {
    let requestKeyParam = pactId;

    if (pactId === requestKey) {
      const query = `
        SELECT requestkey
        FROM "Transactions" t
        JOIN "TransactionDetails" td ON t.id = td."transactionId"
        WHERE td.pactid = $1 AND requestkey != $1
      `;
      const { rows } = await rootPgPool.query(query, [requestKey]);
      const row = rows[0];
      requestKeyParam = row.requestkey;
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
      where transactions.requestkey = $1
      and transfers.amount = $2
    `;

    const { rows } = await rootPgPool.query(query, [requestKeyParam, amount]);

    const [row] = rows;
    if (!row) return null;
    const output = transferSchemaValidator.validate(row);
    return output;
  }

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

    const { blockHash, accountName, chainId, transactionId, fungibleName, requestKey } = params;
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
      conditions += `${op} trans."chainId" = $${queryParams.length}`;
    }

    if (transactionId) {
      queryParams.push(transactionId);
      const op = localOperator(queryParams.length);
      conditions += `${op} trans.id = $${queryParams.length}`;
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
