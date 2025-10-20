import { rootPgPool } from '@/config/database';
import { withRetry, defaultClassifier } from '@/utils/retry';

export type DbQueryOptions = {
  operation: string;
  attempts?: number;
  signal?: AbortSignal;
  circuit?: {
    enabled?: boolean;
    key?: string;
    options?: {
      timeout?: number;
      errorThresholdPercentage?: number;
      volumeThreshold?: number;
      resetTimeout?: number;
    };
  };
};

export async function queryWithRetry(sql: string, params: unknown[], options: DbQueryOptions) {
  const start = performance.now();
  try {
    const call = () =>
      withRetry(options.operation, () => rootPgPool.query(sql, params), {
        attempts:
          options.attempts ??
          (process.env.DB_QUERY_RETRY_ATTEMPTS ? Number(process.env.DB_QUERY_RETRY_ATTEMPTS) : 2),
        classify: classifyPgError,
        signal: options.signal,
        onRetry: ({ attempt, error, operation }) => {
          console.warn('[WARN][DB][RETRY]', { operation, attempt, error });
        },
        circuit: options.circuit,
      });

    return await call();
  } finally {
    const durationMs = performance.now() - start;
    // Optional: emit metric here in future
    if (durationMs > 1000) {
      console.warn('[WARN][DB][SLOW_QUERY]', { operation: options.operation, durationMs });
    }
  }
}

function classifyPgError(err: unknown) {
  const anyErr = err as any;
  const code: string | undefined = anyErr?.code;
  // Non-retryable pg codes
  const permanent = new Set([
    '22P02', // invalid_text_representation
    '23505', // unique_violation
    '23503', // foreign_key_violation
    '23502', // not_null_violation
  ]);
  if (code && permanent.has(code))
    return { retryable: false, reason: `db.permanent.${code}`, code } as const;

  // Retryable connection-level issues
  const retryable = new Set([
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08003', // connection_does_not_exist
  ]);
  if (code && retryable.has(code))
    return { retryable: true, reason: `db.transient.${code}`, code } as const;

  return defaultClassifier(err);
}
