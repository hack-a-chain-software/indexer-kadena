import { rootPgPool } from "../../../../config/database";
import TransferRepository, {
  GetCrossChainTransferByPactIdParams,
  GetTotalCountParams,
  GetTransfersByTransactionIdParams,
  GetTransfersParams,
} from "../../application/transfer-repository";
import { getPageInfo } from "../../pagination";
import { transferSchemaValidator } from "../schema-validator/transfer-schema-validator";

const operator = (paramsLength: number) => (paramsLength > 2 ? `AND` : "WHERE");

export default class TransferDbRepository implements TransferRepository {
  async getTransfers(params: GetTransfersParams) {
    const {
      blockHash,
      after,
      before,
      first,
      last,
      chainId,
      accountName,
      fungibleName,
      orderIndex,
      requestKey,
      moduleHash,
    } = params;

    const queryParams: (string | number)[] = [before ? last : first];
    let conditions = "";

    if (accountName) {
      queryParams.push(accountName);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.from_acct = $${queryParams.length}`;
    }

    if (blockHash) {
      queryParams.push(blockHash);
      const op = operator(queryParams.length);
      conditions += `\n${op} b.hash = $${queryParams.length}`;
    }

    if (after) {
      queryParams.push(after);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.id > $${queryParams.length}`;
    }

    if (before) {
      queryParams.push(before);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.id < $${queryParams.length}`;
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

    if (requestKey) {
      queryParams.push(requestKey);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.requestkey = $${queryParams.length}`;
    }

    // if (orderIndex) { // TODO(STREAMING)
    //   queryParams.push(orderIndex);
    //   const op = operator(queryParams.length);
    //   conditions += `\n${op} transfers."orderIndex" = $${queryParams.length}`;
    // }

    if (moduleHash) {
      queryParams.push(moduleHash);
      const op = operator(queryParams.length);
      conditions += `\n${op} transfers.modulehash = $${queryParams.length}`;
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
      transactions.pactid as "pactId"
      from "Blocks" b
      join "Transactions" transactions on b.id = transactions."blockId"
      join "Transfers" transfers on transfers."transactionId" = transactions.id 
      ${conditions}
      ORDER BY transfers.id ${before ? "DESC" : "ASC"}
      LIMIT $1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map((row) => ({
      cursor: row.id.toString(),
      node: transferSchemaValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ rows: edges, first, last });

    return {
      edges,
      pageInfo,
    };
  }

  async getCrossChainTransferByPactId({
    amount,
    pactId,
  }: GetCrossChainTransferByPactIdParams) {
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
      transactions.pactid as "pactId"
      from "Blocks" b
      join "Transactions" transactions on b.id = transactions."blockId"
      join "Transfers" transfers on transfers."transactionId" = transactions.id 
      where transactions.requestKey = $1
      and transfers.amount = $2
    `;

    const { rows } = await rootPgPool.query(query, [pactId, amount]);

    const [row] = rows;
    const output = transferSchemaValidator.validate(row);
    return output;
  }

  async getTotalCountOfTransfers(params: GetTotalCountParams): Promise<number> {
    const {
      blockHash,
      accountName,
      chainId,
      transactionId,
      fungibleName,
      requestKey,
    } = params;
    const queryParams: (string | number)[] = [];
    let conditions = "";

    const localOperator = (length: number) => (length > 1 ? `\nAND` : "WHERE");

    if (accountName) {
      queryParams.push(accountName);
      const op = localOperator(queryParams.length);
      conditions += `${op} trans.from_acct = $${queryParams.length}`;
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
      conditions += `${op} transactions."requestKey" = $${queryParams.length}`;
    }

    const totalCountQuery = `
      SELECT COUNT(*) as count
      from "Blocks" b
      join "Transactions" t on b.id = t."blockId"
      join "Transfers" trans on trans."transactionId" = t.id 
      ${conditions}
    `;

    const { rows: countResult } = await rootPgPool.query(
      totalCountQuery,
      queryParams,
    );

    const totalCount = parseInt(countResult[0].count, 10);
    return totalCount;
  }

  async getTransfersByTransactionId(params: GetTransfersByTransactionIdParams) {
    const { transactionId, after, before, first, last } = params;

    const queryParams: (string | number)[] = [
      before ? last : first,
      transactionId,
    ];
    let conditions = "";

    if (before) {
      queryParams.push(before);
      conditions += `\nAND transfers.id < $3`;
    }

    if (after) {
      queryParams.push(after);
      conditions += `\nAND transfers.id > $3`;
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
      transactions.pactid as "pactId"
      from "Blocks" b
      join "Transactions" transactions on b.id = transactions."blockId"
      join "Transfers" transfers on transfers."transactionId" = transactions.id 
      WHERE transactions.id = $2
      ${conditions}
      ORDER BY transfers.id ${before ? "DESC" : "ASC"}
      LIMIT $1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map((row) => ({
      cursor: row.id.toString(),
      node: transferSchemaValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ rows: edges, first, last });

    return {
      edges,
      pageInfo,
    };
  }
}
