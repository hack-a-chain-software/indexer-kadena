import axios from 'axios';

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
      await axios.post(this.url, body, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': this.apiKey },
        timeout: 30000,
      });
    } catch {
      console.error('[ERROR][MONITORING][REPORT_ERROR] Failed to report error:', error);
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
    console.warn(`[WARN][MONITORING] Monitoring not initialized. Missing env: ${missing}`);
    return; // Monitoring disabled; keep local logging only
  }

  const endpoint = `http://localhost:${process.env.KADENA_GRAPHQL_API_PORT ?? '3001'}/graphql`;

  const reporter = new HttpErrorReporter(monitoringUrl, apiKey);
  const originalConsoleError = console.error.bind(console);

  const classifySeverity = (message: string, extra: unknown): 'major' | 'degraded' | 'minimal' => {
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

    return 'minimal';
  };

  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);

    let message = 'Unknown error';
    let extra: unknown;

    if (args.length > 0) {
      const first = args[0] as unknown;
      if (first instanceof Error) {
        message = first.message || 'Error';
        extra = { stack: first.stack, ...(args[1] as object) };
      } else if (typeof first === 'string') {
        message = first as string;
        if (args.length > 1) extra = { args: args.slice(1) };
      } else {
        try {
          message = JSON.stringify(first);
        } catch {
          message = String(first);
        }
        if (args.length > 1) extra = { args: args.slice(1) };
      }
    }

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
      extra: extraWithSeverity,
    });
  };
}
