import { sequelize } from '@/config/database';
import { getClickHouseClient } from '@/search/clickhouse-client';

type OutboxRow = {
  id: number;
  topic: string;
  payload: any;
};

export async function startOutboxConsumer() {
  if (!process.env.CLICKHOUSE_URL || process.env.FEATURE_CLICKHOUSE_INDEXER !== '1') return;

  const ch = getClickHouseClient();
  const BATCH_SIZE = Number(process.env.OUTBOX_CONSUMER_BATCH || 200);
  const INTERVAL_MS = Number(process.env.OUTBOX_CONSUMER_INTERVAL_MS || 2000);
  const MAX_RETRIES = Number(process.env.OUTBOX_CONSUMER_MAX_RETRIES || 5);
  const retryCount = new Map<number, number>();

  // Simple polling consumer for now
  setInterval(async () => {
    const [results]: any = await sequelize.query(
      `SELECT id, topic, payload FROM "Outbox" WHERE "processedAt" IS NULL ORDER BY id ASC LIMIT ${BATCH_SIZE}`,
    );
    if (!results?.length) return;

    for (const row of results as OutboxRow[]) {
      try {
        if (row.topic === 'canonical-flip') {
          const { chainId, height, canonical } = row.payload as {
            chainId: number;
            height: number;
            canonical: boolean;
          };
          // Update ClickHouse canonical for all transactions at height
          await ch.exec({
            query: `ALTER TABLE transactions_code_v1 UPDATE canonical = ${canonical ? 1 : 0} WHERE chainId = {chainId:UInt16} AND height = {height:UInt64}`,
            query_params: { chainId, height: BigInt(height) },
          });
        }
        await sequelize.query(`UPDATE "Outbox" SET "processedAt" = NOW() WHERE id = $1`, {
          bind: [row.id],
        });
        try {
          const { outboxProcessed } = await import('@/services/metrics');
          outboxProcessed.inc();
        } catch {}
        retryCount.delete(row.id);
      } catch (err) {
        // leave unprocessed for retry
        console.error('[OUTBOX][ERROR]', err);
        try {
          const { outboxFailed } = await import('@/services/metrics');
          outboxFailed.inc();
        } catch {}
        const current = retryCount.get(row.id) || 0;
        if (current + 1 >= MAX_RETRIES) {
          retryCount.delete(row.id);
          continue;
        }
        retryCount.set(row.id, current + 1);
        continue;
      }
    }
  }, INTERVAL_MS);
}
