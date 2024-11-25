import dotenv from "dotenv";
console.log("Loading environment variables...");
dotenv.config();

import {
  startBackFill,
  startRetryErrors,
  startMissingBlocksDaemon,
} from "./services/syncService";

import { program } from "commander";
import { getRequiredEnvString } from "./utils/helpers";
import { startStreaming } from "./services/sync/streaming";
import { processS3HeadersDaemon } from "./services/sync/header";
import { usePostgraphile, useKadenaExtension } from "./server/metrics";
import { useKadenaGraphqlServer } from "./kadena-server/server";
import { closeDatabase, initializeDatabase } from "./config/database";

program
  .option("-s, --streaming", "Start streaming blockchain data")
  .option("-b, --backfill <number>", "Start back filling blockchain data")
  .option("-r, --retry", "Start retrying failed blocks")
  .option("-m, --missing", "Process missing blocks")
  .option("-h, --headers", "Process headers from s3 bucket to database")
  .option("-g, --graphql", "Start the GraphQL server")
  .option("-t, --graphqlServer", "Start the custom GraphQL server")
  .option("-z, --database", "Init the database")
  .option(
    "-run, --run",
    "Continuous process of streaming, headers, payloads and missing blocks from node to s3 bucket and from s3 bucket to database",
  );

program.parse(process.argv);

const SYNC_NETWORK = getRequiredEnvString("SYNC_NETWORK");

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
      await startStreaming(SYNC_NETWORK);
    } else if (options.backfill) {
      const blockNumber = parseInt(options.backfill, 10);
      if (isNaN(blockNumber)) {
        console.error("Please provide a valid number for the backfill option.");
        process.exit(1);
      }
      await startBackFill(SYNC_NETWORK, blockNumber);
    } else if (options.retry) {
      await startRetryErrors(SYNC_NETWORK);
    } else if (options.missing) {
      await startMissingBlocksDaemon(SYNC_NETWORK);
    } else if (options.headers) {
      await processS3HeadersDaemon(SYNC_NETWORK);
    } else if (options.graphql) {
      await usePostgraphile();
      await useKadenaExtension();
    } else if (options.graphqlServer) {
      await useKadenaGraphqlServer();
    } else if (options.run) {
      if (process.env.RUN_GRAPHQL_ON_START === "true") {
        await usePostgraphile();
      }
      if (process.env.RUN_STREAMING_ON_START === "true") {
        startStreaming(SYNC_NETWORK);
        processS3HeadersDaemon(SYNC_NETWORK);
      }
      if (process.env.RUN_MISSING_BLOCKS_ON_START === "true") {
        await startMissingBlocksDaemon(SYNC_NETWORK);
      }
    } else {
      console.log("No specific task requested.");
    }
    console.log("Blockchain data indexing process has finished.");
  } catch (error) {
    console.error("An error occurred during the data indexing process:", error);
  }
}

/**
 * Handles graceful shutdown of the application when receiving termination signals.
 * @param signal The signal received, triggering the shutdown process.
 */
async function handleGracefulShutdown(signal: string) {
  console.log(`Received ${signal}. Graceful shutdown start.`);
  console.log("Graceful shutdown complete.");
  process.exit(0);
}

process.on("SIGINT", handleGracefulShutdown);
process.on("SIGTERM", handleGracefulShutdown);

main().then(() => console.log("Done!"));
