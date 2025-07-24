/**
 * Main entry point for the Kadena Indexer application.
 * This file orchestrates the initialization and execution of various services based on command line arguments.
 * The indexer supports multiple operation modes:
 * - Streaming blockchain data
 * - Running GraphQL server
 * - Backfilling guards
 * - Processing missing blocks
 * - Database initialization
 */

import dotenv from 'dotenv';
// Load environment variables from .env file
console.info('[INFO][INFRA][INFRA_CONFIG] Loading environment variables...');
dotenv.config();

import { program } from 'commander';
import { startGraphqlServer } from './kadena-server/server';
import { startStreaming } from './services/streaming';
import { backfillPairEvents } from './services/pair';
import { setupAssociations } from './models/setup-associations';
import { PriceUpdaterService } from '@/services/price/price-updater.service';

/**
 * Command-line interface configuration using Commander.
 * Defines various operation modes for the indexer through command line flags.
 */
program
  .option('-s, --streaming', 'Start streaming blockchain data')
  .option('-t, --graphql', 'Start GraphQL server based on kadena schema')
  .option('-p, --backfillPairs', 'Backfill the pairs');

program.parse(process.argv);

const options = program.opts();

/**
 * Main function to orchestrate the blockchain data synchronization process.
 * It initializes the database and starts the requested synchronization process based on the command line arguments.
 *
 * The function handles different operational modes:
 * - Database initialization
 * - Blockchain data streaming
 * - Token Pairs backfilling
 * - GraphQL server initialization
 *
 * TODO: [OPTIMIZATION] Consider implementing a more modular approach for service initialization
 * that would allow easier addition of new services without modifying this main function.
 */
async function main() {
  try {
    setupAssociations();
    PriceUpdaterService.getInstance();

    if (options.streaming) {
      await startStreaming();
    } else if (options.graphql) {
      await startGraphqlServer();
    } else if (options.backfillPairs) {
      await backfillPairEvents();
    } else {
      console.info('[INFO][BIZ][BIZ_FLOW] No specific task requested.');
    }
  } catch (error) {
    console.error('[ERROR][INFRA][INFRA_CONFIG] Initialization failed:', error);
    process.exit(1);
  }
}

/**
 * Handles graceful shutdown of the application when receiving termination signals.
 * Ensures that resources are properly released before the application exits.
 *
 * @param signal The signal received, triggering the shutdown process (e.g., SIGINT, SIGTERM).
 *
 * TODO: [OPTIMIZATION] Enhance shutdown procedure to properly close all active connections,
 * finish pending operations, and ensure data consistency before exiting.
 */
async function handleGracefulShutdown(signal: string) {
  console.info(`[INFO][INFRA][INFRA_DEPLOY] Received ${signal}. Initiating graceful shutdown.`);
  // TODO: [OPTIMIZATION] Add actual cleanup operations here (database connections, active streams, etc.)
  console.info('[INFO][INFRA][INFRA_DEPLOY] Graceful shutdown complete.');
  process.exit(0);
}

// Register signal handlers for graceful shutdown
process.on('SIGINT', handleGracefulShutdown);
process.on('SIGTERM', handleGracefulShutdown);

// Execute the main function to start the application
main();
