import axios from 'axios';
import os from 'os';
import { axiosPostWithRetry } from '@/utils/http';
import { logDedup } from '@/utils/error-dedupe';
import { fireWithBreaker } from '@/utils/circuit';

export type ReportErrorPayload = {
  endpoint: string;
  error: string;
  instance?: string;
  operation?: string;
  date?: string;
  responseTime?: number;
  extra?: unknown;
};

export interface ErrorReporter {
  reportError(payload: ReportErrorPayload): Promise<void>;
}

class HttpErrorReporter implements ErrorReporter {
  private readonly url: string;
  private readonly apiKey: string;

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  async reportError({
    endpoint,
    error,
    instance,
    operation,
    date,
    responseTime,
    extra,
  }: ReportErrorPayload): Promise<void> {
    const body: Record<string, unknown> = {
      type: 'error',
      endpoint,
      instance,
      operation,
      date: date ?? new Date().toISOString(),
      responseTime,
      data: {
        error,
        ...(extra !== undefined ? { extra } : {}),
      },
    };

    try {
      await axiosPostWithRetry(this.url, body, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
        timeoutMs: 30000,
        operation: 'monitoring.reportError',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logDedup(
        {
          message: '[WARN][MONITORING][REPORT_ERROR] Failed to report error',
          operation: 'monitoring.reportError',
          code: (error as any)?.code || String((error as any)?.response?.status || ''),
          reason: 'http',
        },
        undefined,
        { error: err.message },
        60000,
        'warn',
      );
    }
  }
}

export function initializeErrorMonitoring(): void {
  const monitoringUrl = process.env.MONITORING_URL?.trim();
  const instance = process.env.INSTANCE_NAME?.trim();
  const apiKey = process.env.ERROR_REPORT_API_KEY?.trim();

  if (!monitoringUrl || !instance || !apiKey) {
    const missing = [
      !monitoringUrl ? 'MONITORING_URL' : null,
      !instance ? 'INSTANCE_NAME' : null,
      !apiKey ? 'ERROR_REPORT_API_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ');
    console.error(`[WARN][MONITORING][ENV] Monitoring not initialized. Missing env: ${missing}`);
    return; // Monitoring disabled; keep local logging only
  }

  const endpoint = `http://localhost:${process.env.KADENA_GRAPHQL_API_PORT ?? '3001'}/graphql`;

  const reporter = new HttpErrorReporter(monitoringUrl, apiKey);
  const originalConsoleError = console.error.bind(console);

  const classifySeverity = (
    message: string,
    extra: unknown,
  ): 'major' | 'degraded' | 'minimal' | 'none' => {
    const msg = (message || '').toLowerCase();
    const extraText = (() => {
      try {
        return JSON.stringify(extra || '').toLowerCase();
      } catch {
        return String(extra || '').toLowerCase();
      }
    })();

    const hay = msg + ' ' + extraText;

    const majorHints = [
      'enotfound',
      'econnrefused',
      'econnreset',
      'connection refused',
      'conn_refused',
      'conn_reset',
      'failed to start',
      'migration failed',
      'eventsource connection error',
      'entire backfill halted',
      'fatal',
      ' code":"28000',
      'role "',
    ];
    if (majorHints.some(h => hay.includes(h))) return 'major';

    const degradedHints = [
      'timeout',
      'timed out',
      'conn_timeout',
      'int_timeout',
      'sync_timeout',
      'partial',
      'incomplete',
      'retry',
      'rate limit',
      'delayed',
      'inconsistent',
      'exceed',
      'please backfill',
      'data_missing',
      'data_invalid',
      'data_format',
    ];
    if (degradedHints.some(h => hay.includes(h))) return 'degraded';

    // Minimal (Severity 3) — explicit low-impact signals per table
    const minimalHints = [
      // Minor parsing, non-standard cases
      'minor parsing',
      'non standard',
      'non-standard',
      // Occasional transient/slow behavior, small impact
      'transient',
      'slow query',
      'slow queries',
      'occasionally retry',
      'occasional retry',
      // Small gaps / less critical segments
      'small gaps',
      'less critical',
      'less-critical',
      // Logging/audit minor issues
      'minor formatting',
      'sporadic log gaps',
      'log gaps',
      'formatting issue',
    ];
    if (minimalHints.some(h => hay.includes(h))) return 'minimal';

    // Default fallback if no category matched
    return 'none';
  };

  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);

    // Normalize message and extra to centralize formatting
    const firstError = args.find(a => a instanceof Error) as Error | undefined;
    const firstString = args.find(a => typeof a === 'string') as string | undefined;
    const allObjects = args.filter(
      a => a !== null && typeof a === 'object' && !(a instanceof Error),
    ) as Record<string, unknown>[];

    let message = 'Unknown error';
    let extra: Record<string, unknown> = {};
    // Merge all non-Error context objects (shallow)
    if (allObjects.length > 0) {
      try {
        extra = Object.assign({}, ...allObjects);
      } catch {
        // noop
      }
    }

    if (firstError && firstString) {
      message = `${firstString}: ${firstError.message || 'Error'}`;
      if (firstError.stack) extra.stack = firstError.stack;
    } else if (firstError) {
      message = firstError.message || 'Error';
      if (firstError.stack) extra.stack = firstError.stack;
    } else if (firstString) {
      message = firstString;
    } else if (args.length > 0) {
      try {
        message = JSON.stringify(args[0]);
      } catch {
        message = String(args[0]);
      }
      if (args.length > 1) extra.args = args.slice(1) as unknown[];
    }

    // Compute raw error message (without tags/prefixes)
    const rawErrorMessage = (() => {
      if (firstError?.message) return firstError.message;
      if (typeof firstString === 'string') {
        // Strip bracket tags like [ERROR][CACHE] from the beginning
        return firstString.replace(/^(?:\[[^\]]+\])+\s*/g, '').trim();
      }
      return typeof message === 'string' ? message : 'Error';
    })();

    // Attach runtime/env info
    try {
      (extra as Record<string, unknown>)['pid'] = process.pid;
      (extra as Record<string, unknown>)['node'] = process.version;
      (extra as Record<string, unknown>)['host'] = os.hostname();
      (extra as Record<string, unknown>)['uptime'] = Math.round(process.uptime());
    } catch {}

    // Derive callsite (function, file, line, column) from stack (error or synthetic)
    try {
      const stackSource = firstError?.stack || new Error().stack || '';
      const frames = stackSource.split('\n').map(s => s.trim());
      const frame = frames.find(
        f => f && !f.includes('services/monitoring') && (f.includes('at ') || f.includes('@')),
      );
      if (frame) {
        // Patterns: "at fn (file:line:col)" or "at file:line:col"
        const m = /at\s+(?:(?<fn>[^\s(]+)\s+\()?(?<loc>[^)]+)\)?/.exec(frame);
        const loc = m?.groups?.loc ?? '';
        const [filePath, line, column] = (() => {
          const parts = loc.split(':');
          if (parts.length >= 3) return [parts.slice(0, -2).join(':'), parts.at(-2), parts.at(-1)];
          return [loc, undefined, undefined];
        })();
        (extra as any).function = m?.groups?.fn ?? undefined;
        (extra as any).file = filePath;
        if (line) (extra as any).line = Number(line);
        if (column) (extra as any).column = Number(column);

        // Phase derivation from file path
        const phase = (() => {
          const p = String(filePath || '').toLowerCase();
          if (p.includes('/cache/')) return 'cache';
          if (p.includes('/services/streaming')) return 'streaming';
          if (p.includes('/services/payload') || p.includes('/models/') || p.includes('sequelize'))
            return 'db';
          if (p.includes('/kadena-server/')) return 'graphql';
          if (p.includes('/services/price')) return 'price';
          if (p.includes('/services/missing')) return 'missing';
          if (p.includes('/services/define-canonical')) return 'canonical';
          if (p.includes('/services/guards')) return 'guards';
          return 'app';
        })();
        (extra as any).phase = phase;
      }
    } catch {}

    // Derive tags from bracket prefixes in the string (if any)
    try {
      const tagSource = firstString || (typeof message === 'string' ? message : '');
      const tags = Array.from(tagSource.matchAll(/\[([^\]]+)\]/g))
        .map(m => m[1])
        .filter(Boolean);
      if (tags.length) (extra as any).tags = tags;
    } catch {}

    // Ignore GraphQL-internal logs if requested (by tag)
    if (typeof message === 'string' && message.includes('[GRAPHQL]')) {
      return;
    }

    const operation = (global as any).__currentGraphQLOperationName;
    // Ignore all errors during an active GraphQL operation (strict mode)
    if (operation) {
      return;
    }
    const severity = classifySeverity(message, extra);
    let extraWithSeverity: unknown = extra;
    if (extra === undefined || extra === null) {
      extraWithSeverity = { severity };
    } else if (typeof extra === 'object') {
      try {
        (extra as Record<string, unknown>)['severity'] = severity;
        extraWithSeverity = extra;
      } catch {
        extraWithSeverity = { value: extra, severity };
      }
    } else {
      extraWithSeverity = { value: extra, severity };
    }

    void reporter.reportError({
      endpoint,
      instance,
      operation,
      error: message,
      extra: { ...(extraWithSeverity as Record<string, unknown>), message: rawErrorMessage },
    });
  };
}
