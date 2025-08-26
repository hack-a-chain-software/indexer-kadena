import { getClickHouseClient } from './clickhouse-client';

type SearchParams = {
  pactCode: string;
  limit: number;
  order: 'ASC' | 'DESC';
  after?: string | null;
  before?: string | null;
};

export type TxByCodeRow = {
  id: number;
  requestKey: string;
  chainId: number;
  creationTime: number; // epoch seconds
  height: number;
  canonical: boolean;
  sender: string;
  gas: string;
  gasLimit: string;
  gasPrice: string;
};

export async function searchTransactionsByPactCode({
  pactCode,
  limit,
  order,
  after,
  before,
}: SearchParams): Promise<TxByCodeRow[]> {
  const ch = getClickHouseClient();

  // Build keyset pagination condition
  let where = `position(code, {pactCode:String}) > 0 AND sender != 'coinbase'`;
  const params: Record<string, any> = { pactCode, limit };

  if (after) {
    const [creationTime, id] = after.split(':');
    where += ` AND (creationTime, id) < (toUInt64({afterCreationTime:UInt64}), toUInt64({afterId:UInt64}))`;
    params.afterCreationTime = BigInt(creationTime);
    params.afterId = BigInt(id);
  }
  if (before) {
    const [creationTime, id] = before.split(':');
    where += ` AND (creationTime, id) > (toUInt64({beforeCreationTime:UInt64}), toUInt64({beforeId:UInt64}))`;
    params.beforeCreationTime = BigInt(creationTime);
    params.beforeId = BigInt(id);
  }

  const query = `
    SELECT
      id,
      requestKey,
      chainId,
      creationTime,
      height,
      canonical = 1 as canonical,
      sender,
      gas,
      gasLimit,
      gasPrice
    FROM transactions_code_v1
    WHERE ${where}
    ORDER BY creationTime ${order}, id ${order}
    LIMIT {limit:UInt64}
  `;

  const result = await ch.query({ query, format: 'JSONEachRow', query_params: params });
  const rows = (await result.json()) as TxByCodeRow[];
  return rows;
}
