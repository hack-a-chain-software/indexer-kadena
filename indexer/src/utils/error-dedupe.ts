type Bucket = {
  count: number;
  firstAt: number;
  lastAt: number;
  message: string;
  context?: Record<string, unknown>;
  level: 'error' | 'warn';
};

const buckets = new Map<string, Bucket>();

function now(): number {
  return Date.now();
}

export type DedupIdentity = { message: string; operation?: string; code?: string; reason?: string };

function fingerprint(input: DedupIdentity): string {
  const base = `${input.operation || ''}|${input.code || ''}|${input.reason || ''}|${normalize(input.message)}`;
  // Simple stable key
  return base.slice(0, 512);
}

function normalize(msg: string): string {
  return (msg || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function logDedup(
  identityOrKey: string | DedupIdentity,
  message?: string,
  context: Record<string, unknown> = {},
  windowMs = 60000,
  level: 'error' | 'warn' = 'error',
) {
  const key = typeof identityOrKey === 'string' ? identityOrKey : fingerprint(identityOrKey);
  const msg = typeof identityOrKey === 'string' ? message || 'Error' : identityOrKey.message;
  const ts = now();
  const b = buckets.get(key);
  if (!b) {
    buckets.set(key, { count: 1, firstAt: ts, lastAt: ts, message: msg, context, level });
    if (level === 'warn') {
      console.warn(msg, context);
    } else {
      console.error(msg, context);
    }
    scheduleFlush(key, windowMs);
    return;
  }
  b.count += 1;
  b.lastAt = ts;
}

function scheduleFlush(key: string, windowMs: number) {
  setTimeout(() => {
    const b = buckets.get(key);
    if (!b) return;
    if (b.count > 1) {
      const summary = {
        key,
        occurrences: b.count,
        windowMs,
        since: b.firstAt,
        last: b.lastAt,
        message: b.message,
        context: b.context,
      };
      if (b.level === 'warn') {
        console.warn('[WARN][DEDUP][SUMMARY]', summary);
      } else {
        console.error('[ERROR][DEDUP][SUMMARY]', summary);
      }
    }
    buckets.delete(key);
  }, windowMs).unref?.();
}
