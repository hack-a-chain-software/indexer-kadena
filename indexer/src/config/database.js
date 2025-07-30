/**
 * Database configuration module.
 * This module handles the configuration and connection to the PostgreSQL database
 * used by the Kadena Indexer, supporting both SSL and non-SSL connections.
 * It initializes both a raw Postgres Pool and a Sequelize ORM instance.
 */

const fs = require('fs');
const { Transaction } = require('sequelize');
const { Pool } = require('pg');

// Extract required database configuration from environment variables
const DB_USERNAME = process.env.DB_USERNAME ?? '';
const DB_PASSWORD = process.env.DB_PASSWORD ?? '';
const DB_NAME = process.env.DB_NAME ?? '';
const DB_HOST = process.env.DB_HOST ?? '';
const DB_SSL_ENABLED = process.env.DB_SSL_ENABLED;
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
    const rejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED;
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
const rootPgPool = new Pool({
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

const sequelizeConfig = {
  // Database authentication credentials from environment variables
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? '',
  host: process.env.DB_HOST ?? 'localhost',

  // Database dialect to use (PostgreSQL)
  dialect: 'postgres',

  // Disable SQL query logging in console
  logging: false,

  // Conditional SSL configuration based on DB_SSL_ENABLED environment variable
  ...(isSslEnabled && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: rejectUnauthorized,
        // Only include the CA if we are validating the certificate
        ...(rejectUnauthorized && {
          ca: fs.readFileSync(__dirname + '/../src/config/global-bundle.pem').toString(),
        }),
      },
    },
  }),

  /**
   * Set transaction isolation level to READ_UNCOMMITTED
   *
   * NOTE: This is the lowest isolation level, which allows:
   * - Dirty reads: A transaction may read data written by a concurrent uncommitted transaction
   * - Non-repeatable reads: A transaction re-reading the same data may find it has been modified by another transaction
   * - Phantom reads: A transaction re-executing a query may find new rows that match the query criteria
   *
   * TODO: [OPTIMIZATION] Consider evaluating a higher isolation level for better data consistency
   */
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,

  /**
   * Connection pool configuration
   * Controls how the ORM manages database connections
   */
  pool: {
    max: 20, // Maximum number of connections in the pool
    min: 1, // Minimum number of connections to keep open
    acquire: 60000, // Maximum time (ms) to acquire a connection before timing out
    idle: 10000, // Maximum time (ms) a connection can be idle before being released
  },

  /**
   * Query retry configuration
   * Controls how the ORM handles transient database connection errors
   */
  retry: {
    max: 10, // Maximum number of times to retry a failed query
  },
};

module.exports = {
  rootPgPool,
  sequelizeConfig,
};
