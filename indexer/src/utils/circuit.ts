// Use require to avoid the need for ambient type declarations
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CircuitBreaker: any = require('opossum');
import { logDedup } from '@/utils/error-dedupe';

export type CircuitOptions = {
  timeout?: number; // time in ms that action should be allowed to execute
  errorThresholdPercentage?: number; // when to open the circuit, % of failures
  volumeThreshold?: number; // minimum number of requests before considering opening
  resetTimeout?: number; // time in ms to wait before setting breaker to halfOpen state
};

const breakers = new Map<string, any>();

function getDefaults(): Required<CircuitOptions> {
  return {
    timeout: process.env.CIRCUIT_TIMEOUT_MS ? Number(process.env.CIRCUIT_TIMEOUT_MS) : 5000,
    errorThresholdPercentage: process.env.CIRCUIT_ERROR_THRESHOLD_PERCENT
      ? Number(process.env.CIRCUIT_ERROR_THRESHOLD_PERCENT)
      : 50,
    volumeThreshold: process.env.CIRCUIT_VOLUME_THRESHOLD
      ? Number(process.env.CIRCUIT_VOLUME_THRESHOLD)
      : 10,
    resetTimeout: process.env.CIRCUIT_RESET_TIMEOUT_MS
      ? Number(process.env.CIRCUIT_RESET_TIMEOUT_MS)
      : 30000,
  };
}

/**
 * Fire a promise-returning function under a named circuit breaker.
 * The underlying action accepts a single callback arg and executes it; we pass the provided fn via fire().
 */
export async function fireWithBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  options?: CircuitOptions,
): Promise<T> {
  const existing = breakers.get(key);
  const opts = { ...getDefaults(), ...(options || {}) } as any;
  let breaker: any;
  if (existing) {
    breaker = existing;
  } else {
    breaker = new CircuitBreaker(async (cb: () => Promise<T>) => cb(), opts);

    // Basic state logging with dedupe
    breaker.on('open', () => {
      logDedup(
        { message: `[WARN][CIRCUIT][OPEN] ${key}`, operation: key, reason: 'open' },
        undefined,
        {},
        60000,
        'warn',
      );
    });
    breaker.on('halfOpen', () => {
      logDedup(
        { message: `[WARN][CIRCUIT][HALF_OPEN] ${key}`, operation: key, reason: 'halfOpen' },
        undefined,
        {},
        60000,
        'warn',
      );
    });
    breaker.on('close', () => {
      logDedup(
        { message: `[WARN][CIRCUIT][CLOSE] ${key}`, operation: key, reason: 'close' },
        undefined,
        {},
        60000,
        'warn',
      );
    });
    breaker.on('reject', () => {
      logDedup(
        { message: `[WARN][CIRCUIT][REJECT] ${key}`, operation: key, reason: 'reject' },
        undefined,
        {},
        60000,
        'warn',
      );
    });
    breaker.on('timeout', () => {
      logDedup(
        { message: `[WARN][CIRCUIT][TIMEOUT] ${key}`, operation: key, reason: 'timeout' },
        undefined,
        {},
        60000,
        'warn',
      );
    });
    breaker.on('failure', (error: unknown) => {
      logDedup(
        { message: `[WARN][CIRCUIT][FAILURE] ${key}`, operation: key, reason: 'failure' },
        undefined,
        { error: String((error as any)?.message || error || '') },
        60000,
        'warn',
      );
    });

    breakers.set(key, breaker);
  }
  return breaker.fire(fn);
}
