import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const chInsertsSuccess = new client.Counter({
  name: 'clickhouse_inserts_success_total',
  help: 'Total successful inserts into ClickHouse',
});
export const chInsertsFailure = new client.Counter({
  name: 'clickhouse_inserts_failure_total',
  help: 'Total failed inserts into ClickHouse',
});
export const outboxProcessed = new client.Counter({
  name: 'outbox_processed_total',
  help: 'Total outbox messages processed',
});
export const outboxFailed = new client.Counter({
  name: 'outbox_failed_total',
  help: 'Total outbox processing failures',
});

export const txByPactCodeDuration = new client.Histogram({
  name: 'transactions_by_pact_code_duration_seconds',
  help: 'Duration of transactionsByPactCode queries in seconds',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

register.registerMetric(chInsertsSuccess);
register.registerMetric(chInsertsFailure);
register.registerMetric(outboxProcessed);
register.registerMetric(outboxFailed);
register.registerMetric(txByPactCodeDuration);

export function getMetricsRegister() {
  return register;
}
