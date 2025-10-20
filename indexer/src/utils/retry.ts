import { setTimeout as delay } from 'timers/promises';

export type RetryClassification = {
  retryable: boolean;
  reason?: string;
  code?: string;
};

export type RetryOptions = {
  attempts?: number;
  baseMs?: number;
  maxMs?: number;
  jitter?: boolean;
  classify?: (err: unknown) => RetryClassification;
  onRetry?: (info: { attempt: number; error: unknown; operation: string }) => void;
  signal?: AbortSignal;
  circuit?: {
    enabled?: boolean; // default from env RETRY_CIRCUIT_ENABLED
    key?: string; // default to operation
    options?: {
      timeout?: number;
      errorThresholdPercentage?: number;
      volumeThreshold?: number;
      resetTimeout?: number;
    };
  };
};

function computeBackoff(baseMs: number, maxMs: number, attempt: number, jitter: boolean): number {
  const expo = baseMs * Math.pow(2, attempt - 1);
  const capped = Math.min(expo, maxMs);
  if (!jitter) return capped;
  const jitterFactor = 0.2; // +/-20%
  const delta = capped * jitterFactor;
  const min = Math.max(0, capped - delta);
  const max = capped + delta;
  return Math.floor(min + Math.random() * (max - min));
}

function isAbortError(err: unknown): boolean {
  // Support both DOMException name and Node AbortError
  const name = (err as any)?.name;
  return name === 'AbortError' || name === 'TimeoutError';
}

import { fireWithBreaker } from '@/utils/circuit';

export async function withRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  opts?: RetryOptions,
): Promise<T> {
  const attempts =
    opts?.attempts ??
    (process.env.RETRY_DEFAULT_ATTEMPTS ? Number(process.env.RETRY_DEFAULT_ATTEMPTS) : 3);
  const baseMs =
    opts?.baseMs ?? (process.env.RETRY_BASE_MS ? Number(process.env.RETRY_BASE_MS) : 100);
  const maxMs = opts?.maxMs ?? (process.env.RETRY_MAX_MS ? Number(process.env.RETRY_MAX_MS) : 1500);
  const jitter = opts?.jitter ?? true;

  let lastError: unknown;
  const call = async () => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      if (opts?.signal?.aborted) {
        throw new Error('AbortError');
      }
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (isAbortError(error)) throw error;

        const classification = opts?.classify ? opts.classify(error) : defaultClassifier(error);
        const shouldRetry = classification.retryable && attempt < attempts;

        if (!shouldRetry) {
          throw error;
        }

        try {
          opts?.onRetry?.({ attempt, error, operation });
        } catch {}

        const waitMs = computeBackoff(baseMs, maxMs, attempt, jitter);
        if (opts?.signal) {
          await Promise.race([
            delay(waitMs),
            new Promise((_resolve, reject) => {
              opts.signal!.addEventListener('abort', () => reject(new Error('AbortError')), {
                once: true,
              });
            }),
          ]);
        } else {
          await delay(waitMs);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  };

  const circuitEnabled =
    opts?.circuit?.enabled ?? (process.env.RETRY_CIRCUIT_ENABLED || 'true') === 'true';
  if (circuitEnabled) {
    const key = opts?.circuit?.key || operation;
    return fireWithBreaker(key, call, opts?.circuit?.options);
  }
  return call();
}

export function defaultClassifier(err: unknown): RetryClassification {
  const anyErr = err as any;
  const code = anyErr?.code || anyErr?.errno || anyErr?.status || anyErr?.statusCode;
  const msg = String(anyErr?.message || err);
  const lower = msg.toLowerCase();

  // Network class
  if (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'EAI_AGAIN' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    lower.includes('network error') ||
    lower.includes('socket hang up')
  ) {
    return { retryable: true, reason: 'transient.network', code };
  }

  // HTTP 5xx/429
  const status = anyErr?.response?.status ?? anyErr?.status ?? anyErr?.statusCode;
  if (typeof status === 'number') {
    if (status === 429 || (status >= 500 && status < 600)) {
      return {
        retryable: true,
        reason: status === 429 ? 'transient.rate_limit' : 'transient.http',
        code: String(status),
      };
    }
    return { retryable: false, reason: 'http.client', code: String(status) };
  }

  // Default: not retryable
  return { retryable: false, reason: 'permanent', code: code ? String(code) : undefined };
}
