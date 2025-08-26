import { createClient, ClickHouseClient, ClickHouseClientConfigOptions } from '@clickhouse/client';

let client: ClickHouseClient | null = null;

export type ClickHouseEnv = {
  CLICKHOUSE_URL?: string;
  CLICKHOUSE_USER?: string;
  CLICKHOUSE_PASSWORD?: string;
  CLICKHOUSE_DATABASE?: string;
};

export function getClickHouseClient(env?: Partial<ClickHouseEnv>): ClickHouseClient {
  if (client) return client;

  const mergedEnv: ClickHouseEnv = {
    CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
    CLICKHOUSE_USER: process.env.CLICKHOUSE_USER,
    CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD,
    CLICKHOUSE_DATABASE: process.env.CLICKHOUSE_DATABASE,
    ...(env ?? {}),
  };

  const url = mergedEnv.CLICKHOUSE_URL;
  if (!url) {
    throw new Error('CLICKHOUSE_URL is not defined');
  }

  const config: ClickHouseClientConfigOptions = {
    url,
    username: mergedEnv.CLICKHOUSE_USER,
    password: mergedEnv.CLICKHOUSE_PASSWORD,
    database: mergedEnv.CLICKHOUSE_DATABASE,
  };

  client = createClient(config);
  return client;
}

export async function ensureTableExists(): Promise<void> {
  const ch = getClickHouseClient();
  // DDL is idempotent; keeps bootstrap simple.
  await ch.exec({
    query: `
      CREATE TABLE IF NOT EXISTS transactions_code_v1
      (
        id UInt64,
        requestKey String,
        chainId UInt16,
        creationTime UInt64,
        height UInt64,
        canonical UInt8,
        sender LowCardinality(String),
        gas String,
        gasLimit String,
        gasPrice String,
        code String,
        INDEX idx_code_ngram code TYPE ngrambf_v1(3, 256, 2, 0) GRANULARITY 4
      )
      ENGINE = MergeTree()
      PARTITION BY toYYYYMM(toDateTime(creationTime))
      ORDER BY (creationTime, id)
      SETTINGS index_granularity = 8192
    `,
  });
}
