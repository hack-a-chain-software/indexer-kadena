import { getRequiredEnvString } from '@/utils/helpers';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Sentry configuration
 */
const SENTRY_DSN = process.env['SENTRY_DSN'];
const SENTRY_ENVIRONMENT = 'production';
const SENTRY_RELEASE = 'v1.0.0';

if (!SENTRY_DSN || SENTRY_DSN.trim() === '') {
  console.info(
    '[INFO][SENTRY][LOG] Not using Sentry as it is disabled by not setting SENTRY_DSN env var',
  );
} else {
  // Initialize Sentry
  console.info('[INFO][SENTRY][INIT] Initializing Sentry error reporting');
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
    profileSessionSampleRate: 1.0,
    profileLifecycle: 'trace',
    integrations: [
      nodeProfilingIntegration(),
      Sentry.graphqlIntegration({ useOperationNameForRootSpan: true }),
    ],
    debug: false,
  });
}
