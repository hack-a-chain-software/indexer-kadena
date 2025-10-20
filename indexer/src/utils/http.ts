import axios, { AxiosRequestConfig } from 'axios';
import { withRetry, defaultClassifier } from '@/utils/retry';

export type HttpOptions = {
  operation: string;
  attempts?: number;
  timeoutMs?: number;
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

function classifyHttpError(err: unknown) {
  const anyErr = err as any;
  const status = anyErr?.response?.status ?? anyErr?.status ?? anyErr?.statusCode;
  if (typeof status === 'number') {
    if (status === 429)
      return { retryable: true, reason: 'transient.rate_limit', code: '429' } as const;
    if (status >= 500 && status < 600)
      return { retryable: true, reason: 'transient.http', code: String(status) } as const;
  }
  return defaultClassifier(err);
}

// Circuit breaker is owned by withRetry; no external wrapping here

export async function axiosPostWithRetry<T = unknown>(
  url: string,
  data: any,
  config: AxiosRequestConfig & HttpOptions,
): Promise<T> {
  const attempts =
    config.attempts ??
    (process.env.HTTP_RETRY_ATTEMPTS ? Number(process.env.HTTP_RETRY_ATTEMPTS) : 3);
  const timeout =
    config.timeoutMs ??
    config.timeout ??
    (process.env.HTTP_TIMEOUT_MS ? Number(process.env.HTTP_TIMEOUT_MS) : 30000);
  const call = () =>
    withRetry<T>(
      config.operation,
      async () => {
        const res = await axios.post<T>(url, data, { ...config, timeout });
        return res.data as T;
      },
      {
        attempts,
        classify: classifyHttpError,
        signal: config.signal,
        onRetry: ({ attempt, error, operation }) => {
          console.warn('[WARN][HTTP][RETRY]', { operation, attempt, error });
        },
        // Normalize circuit key: prefer provided key; else derive from URL host+path; fallback to operation
        circuit: normalizeCircuitForHttp(url, config),
      },
    );
  return call();
}

function normalizeCircuitForHttp(url: string, config: AxiosRequestConfig & HttpOptions) {
  const enabled = config.circuit?.enabled ?? undefined;
  const options = config.circuit?.options;
  let key = config.circuit?.key;
  if (!key) {
    try {
      const u = new URL(url);
      key = `${u.host}${u.pathname}`;
    } catch {
      key = config.operation || url;
    }
  }
  return { enabled, key, options };
}
