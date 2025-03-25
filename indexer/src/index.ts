import dotenv from 'dotenv';
console.info('[INFO][INFRA][INFRA_CONFIG] Loading environment variables...');
dotenv.config();

import { program } from 'commander';
import { startStreaming } from './services/sync/streaming';
import { usePostgraphile } from './server/metrics';
import { useKadenaGraphqlServer } from './kadena-server/server';
import { closeDatabase } from './config/database';
import { initializeDatabase } from './config/init';
import { startBackfillCoinbaseTransactions } from './services/sync/coinbase';
import { backfillBalances } from './services/sync/balances';
import { startMissingBlocks } from './services/sync/missing';

program
  .option('-s, --streaming', 'Start streaming blockchain data')
  .option('-g, --oldGraphql', 'Start GraphQL server based on Postgraphile')
  .option('-t, --graphql', 'Start GraphQL server based on kadena schema')
  .option('-f, --guards', 'Backfill the guards')
  .option('-m, --missing', 'Missing blocks')
  .option('-z, --database', 'Init the database');

program.parse(process.argv);

const options = program.opts();

/**
 * Main function to orchestrate the blockchain data synchronization process.
 * It initializes the database and starts the requested synchronization process based on the command line arguments.
 */
async function main() {
  try {
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
    } else if (options.coinbase) {
      await startBackfillCoinbaseTransactions();
    } else if (options.missing) {
      await startMissingBlocks();
      process.exit(0);
    } else if (options.oldGraphql) {
      await usePostgraphile();
    } else if (options.graphql) {
      await useKadenaGraphqlServer();
    } else {
      console.info('[INFO][BIZ][BIZ_FLOW] No specific task requested.');
    }
  } catch (error) {
    console.error('[ERROR][INFRA][INFRA_CONFIG] Initialization failed:', error);
  }
}

/**
 * Handles graceful shutdown of the application when receiving termination signals.
 * @param signal The signal received, triggering the shutdown process.
 */
async function handleGracefulShutdown(signal: string) {
  console.info(`[INFO][INFRA][INFRA_DEPLOY] Received ${signal}. Initiating graceful shutdown.`);
  console.info('[INFO][INFRA][INFRA_DEPLOY] Graceful shutdown complete.');
  process.exit(0);
}

process.on('SIGINT', handleGracefulShutdown);
process.on('SIGTERM', handleGracefulShutdown);

main();
