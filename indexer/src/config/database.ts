/**
 * Database configuration module.
 * This module handles the configuration and connection to the PostgreSQL database
 * used by the Kadena Indexer, supporting both SSL and non-SSL connections.
 * It initializes both a raw Postgres Pool and a Sequelize ORM instance.
 */

import fs from 'fs';

import { Sequelize, Transaction } from 'sequelize';
import { getRequiredEnvString } from '../utils/helpers';
import { Pool } from 'pg';

// Extract required database configuration from environment variables
const DB_USERNAME = getRequiredEnvString('DB_USERNAME');
const DB_PASSWORD = getRequiredEnvString('DB_PASSWORD');
const DB_NAME = getRequiredEnvString('DB_NAME');
const DB_HOST = getRequiredEnvString('DB_HOST');
const DB_SSL_ENABLED = getRequiredEnvString('DB_SSL_ENABLED');
const DB_CONNECTION = `postgres://${DB_USERNAME}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}/${DB_NAME}`;

// Determine if SSL is enabled for database connections
const isSslEnabled = DB_SSL_ENABLED === 'true';

// Determine if the server's certificate should be validated against the local CA bundle.
// Defaults to true (most secure). This is only overridden if SSL is enabled AND the
// DB_SSL_REJECT_UNAUTHORIZED variable is explicitly set.
let rejectUnauthorized = true;

if (isSslEnabled) {
  try {
    // getRequiredEnvString throws if the env var is not present. We catch this to make it optional.
    const rejectUnauthorizedEnv = getRequiredEnvString('DB_SSL_REJECT_UNAUTHORIZED');
    rejectUnauthorized = rejectUnauthorizedEnv !== 'false';
  } catch (error) {
    // The env var is not set; we'll proceed with the default of rejectUnauthorized = true.
  }
}

/**
 * PostgreSQL connection pool for direct query execution.
 * This provides a lower-level database access mechanism than Sequelize.
 *
 * When SSL is enabled, it uses the global certificate bundle for secure connections.
 *
 * TODO: [OPTIMIZATION] Consider implementing connection pooling metrics to monitor performance
 * and adjust pool settings accordingly.
 */
export const rootPgPool = new Pool({
  connectionString: DB_CONNECTION,
  ...(isSslEnabled && {
    ssl: {
      rejectUnauthorized: rejectUnauthorized,
      // Only include the CA if we are validating the certificate
      ...(rejectUnauthorized && {
        ca: fs.readFileSync(__dirname + '/global-bundle.pem').toString(),
      }),
    },
  }),
});

/**
 * Sequelize ORM instance for database interactions.
 * Configured with connection pooling, retry logic, and transaction isolation levels.
 *
 * Connection settings:
 * - Pool: max 20 connections, min 1, 60s acquisition timeout, 10s idle timeout
 * - Retry: maximum 10 retries for failed operations
 * - Logging: disabled for performance
 * - Isolation level: READ_UNCOMMITTED for maximum throughput
 *
 * TODO: [OPTIMIZATION] The isolation level READ_UNCOMMITTED may cause data inconsistency issues
 * in certain scenarios. Consider evaluating if a higher isolation level is needed for data integrity.
 */
export const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USERNAME as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    pool: {
      max: 20,
      min: 1,
      acquire: 60000,
      idle: 10000,
    },
    retry: {
      max: 10,
    },
    logging: false,
    ...(isSslEnabled && {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: rejectUnauthorized,
          // Only include the CA if we are validating the certificate
          ...(rejectUnauthorized && {
            ca: fs.readFileSync(__dirname + '/global-bundle.pem').toString(),
          }),
        },
      },
    }),
    isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
  },
);

/**
 * Closes the database connection gracefully.
 * This should be called when shutting down the application to ensure all connections
 * are properly terminated and resources are released.
 *
 * @returns A promise that resolves when the database connection is closed
 * @throws Propagates any errors that occur during the closing process
 */
export async function closeDatabase(): Promise<void> {
  try {
    await sequelize.close();
    console.info('[INFO][DB][CONN] Database connection closed successfully.');
  } catch (error) {
    console.error('[ERROR][DB][CONN_LOST] Failed to close database connection:', error);
    throw error;
  }
}
