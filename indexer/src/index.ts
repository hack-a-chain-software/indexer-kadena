import dotenv from 'dotenv';
console.log('Loading environment variables...');
dotenv.config();

import { program } from 'commander';
import { startStreaming } from './services/sync/streaming';
import { usePostgraphile } from './server/metrics';
import { useKadenaGraphqlServer } from './kadena-server/server';
import { closeDatabase } from './config/database';
import { initializeDatabase } from './config/init';
import { backfillBalances } from './services/sync/balances';
import { startMissingBlocks } from './services/sync/missing';

program
  .option('-s, --streaming', 'Start streaming blockchain data')
  .option('-g, --oldGraphql', 'Start GraphQL server based on Postgraphile')
  .option('-t, --graphql', 'Start GraphQL server based on kadena schema')
  .option('-f, --guards', 'Backfill the guards')
  // this option shouldn't be used if you initialize the indexer from the beginning
  .option('-c, --coinbase', 'Backfill coinbase transactions')
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
    } else if (options.missing) {
      await startMissingBlocks();
      process.exit(0);
    } else if (options.oldGraphql) {
      await usePostgraphile();
    } else if (options.graphql) {
      await useKadenaGraphqlServer();
    } else {
      console.log('No specific task requested.');
    }
  } catch (error) {
    console.error('An error occurred during the initialization:', error);
  }
}

/**
 * Handles graceful shutdown of the application when receiving termination signals.
 * @param signal The signal received, triggering the shutdown process.
 */
async function handleGracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Graceful shutdown start.`);
  console.log('Graceful shutdown complete.');
  process.exit(0);
}

process.on('SIGINT', handleGracefulShutdown);
process.on('SIGTERM', handleGracefulShutdown);

main();
