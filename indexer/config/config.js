/**
 * Database configuration for Sequelize ORM and migrations
 *
 * This file defines the database connection configuration for the Kadena Indexer,
 * specifically for use with Sequelize ORM and database migrations. It handles
 * environment variables, SSL configuration, connection pooling, and transaction
 * isolation levels.
 *
 * The configuration is structured in the format expected by Sequelize CLI for
 * database migrations and by the Sequelize ORM for runtime database connections.
 */

const fs = require('fs');
const { Transaction } = require('sequelize');

/**
 * Determines if SSL should be enabled for database connections based on environment variable
 */
const isSslEnabled = process.env.DB_SSL_ENABLED === 'true';

// Determine if the server's certificate should be validated against the local CA bundle.
// Defaults to true (most secure). This is only overridden if SSL is enabled AND the
// DB_SSL_REJECT_UNAUTHORIZED variable is explicitly set.
let rejectUnauthorized = true;
if (isSslEnabled && typeof process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'undefined') {
  rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
}

module.exports = {
  /**
   * Development environment database configuration
   * These settings are also used for production when no specific production config is provided
   */
  development: {
    // Database authentication credentials from environment variables
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',

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
  },
  // Additional environments like 'test' or 'production' could be added here
};
