/**
 * Main entry point for the Kadena Indexer application.
 * This file orchestrates the initialization and execution of various services based on command line arguments.
 * The indexer supports multiple operation modes:
 * - Streaming blockchain data
 * - Running GraphQL servers (both Postgraphile and Kadena schema based)
 * - Backfilling guards
 * - Processing missing blocks
 * - Database initialization
 */

import dotenv from 'dotenv';
// Load environment variables from .env file
console.info('[INFO][INFRA][INFRA_CONFIG] Loading environment variables...');
dotenv.config();

import { program } from 'commander';
import { closeDatabase } from './config/database';
import { initializeDatabase } from './config/init';
import { startGraphqlServer } from './kadena-server/server';
import { backfillBalances } from './services/balances';
import { startMissingBlocks } from './services/missing';
import { startStreaming } from './services/streaming';
import { backfillPairEvents } from './services/pair';
import { setupAssociations } from './models/setup-associations';
import { PriceUpdaterService } from '@/services/price/price-updater.service';
import { updateCanonicalInBatches } from '@/services/canonical';
import defineCanonical, { defineCanonicalManually } from '@/services/define-canonical';

/**
 * Command-line interface configuration using Commander.
 * Defines various operation modes for the indexer through command line flags.
 */
program
  .option('-s, --streaming', 'Start streaming blockchain data')
  .option('-c, --canonical', 'Update canonical status')
  .option('-t, --graphql', 'Start GraphQL server based on kadena schema')
  .option('-f, --guards', 'Backfill the guards')
  .option('-m, --missing', 'Missing blocks')
  .option('-z, --database', 'Init the database')
  .option('-o, --canonicalTip', 'Update canonical tip')
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
 * - Guard backfilling
 * - Missing blocks processing
 * - GraphQL server initialization (both Postgraphile and Kadena schema versions)
 *
 * TODO: [OPTIMIZATION] Consider implementing a more modular approach for service initialization
 * that would allow easier addition of new services without modifying this main function.
 */
async function main() {
  try {
    setupAssociations();
    await PriceUpdaterService.getInstance();

    if (options.database) {
      await initializeDatabase();
      await closeDatabase();
      process.exit(0);
    }

    if (options.streaming) {
      await startStreaming();
    } else if (options.guards) {
      await backfillBalances();
      await closeDatabase();
      process.exit(0);
    } else if (options.canonical) {
      await updateCanonicalInBatches();
      await closeDatabase();
      process.exit(0);
    } else if (options.canonicalTip) {
      // for (const chainId of [
      //   '0',
      //   '1',
      //   '2',
      //   '3',
      //   '4',
      //   '5',
      //   '6',
      //   '7',
      //   '8',
      //   '9',
      //   '10',
      //   '11',
      //   '12',
      //   '13',
      //   '14',
      //   '15',
      //   '16',
      //   '17',
      //   '18',
      //   '19',
      // ]) {
      await defineCanonicalManually({ chainId: process.env.CHAIN_ID_CANONICAL ?? '0' });
      // console.log(`[INFO] Canonical tip updated for chain ${chainId}`);
      // }
      process.exit(0);
    } else if (options.missing) {
      await startMissingBlocks();
      process.exit(0);
    } else if (options.graphql) {
      await startGraphqlServer();
    } else if (options.backfillPairs) {
      PriceUpdaterService.getInstance();
      await backfillPairEvents();
    } else {
      console.info('[INFO][BIZ][BIZ_FLOW] No specific task requested.');
    }
  } catch (error) {
    console.error('[ERROR][INFRA][INFRA_CONFIG] Initialization failed:', error);
    // TODO: [OPTIMIZATION] Implement more detailed error logging and possibly retry mechanisms
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
