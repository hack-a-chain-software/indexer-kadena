import "dotenv/config";

import { listS3Objects } from "./s3Service";
import { delay, splitIntoChunks, getRequiredEnvNumber, createSignal } from "../utils/helpers";
import { syncStatusService } from "./syncStatusService";
import { syncErrorService } from "./syncErrorService";
import { fetchHeadersWithRetry } from "./sync/header"
import { fetchCut, FetchCutResult } from "./sync/fetch"

import {
  SOURCE_S3,
  SOURCE_API,
  SOURCE_BACKFILL,
  SOURCE_STREAMING,
} from "../models/syncStatus";

const SYNC_MIN_HEIGHT = getRequiredEnvNumber("SYNC_MIN_HEIGHT");
const SYNC_FETCH_INTERVAL_IN_BLOCKS = getRequiredEnvNumber(
  "SYNC_FETCH_INTERVAL_IN_BLOCKS"
);
const SYNC_TIME_BETWEEN_REQUESTS_IN_MS = getRequiredEnvNumber(
  "SYNC_TIME_BETWEEN_REQUESTS_IN_MS"
);

const shutdownSignal = createSignal();

/**
 * Type definition for a function that processes an individual key.
 *
 * @param {string} network - The identifier for the blockchain network (e.g., 'mainnet01').
 * @param {string} key - The specific S3 object key that points to the data to be processed.
 * @returns {Promise<void>} A promise that resolves when the processing of the key is complete.
 */
type ProcessKeyFunction = (
  network: string,
  key: string
) => Promise<void>;

/**
 * Processes keys from S3 for a specific network and chainId.
 * This method fetches a list of keys from an S3 bucket based on the last synchronization status.
 * For each key, it reads and parses the S3 object to obtain block data, saves the block data to the database,
 * and updates the synchronization status accordingly.
 *
 * @param {string} network - The network identifier (e.g., 'mainnet01').
 * @param {number} chainId - The chain ID to process headers for.
 * @param {string} prefix - The prefix for the S3 keys to process.
 * @param {ProcessKeyFunction} processKey - The function to process each key.
 * @param {number} maxKeys - The maximum number of keys to process in a single batch.
 * @param {number} maxIterations - The maximum number of iterations to perform. Unlimited if not specified.
 * @returns {Promise<number>} - A promise that resolves with the total number of keys processed.
 */
export async function processKeys(
  network: string,
  chainId: number,
  prefix: string,
  processKey: ProcessKeyFunction,
  maxKeys: number = 20,
  maxIteractions?: number
): Promise<number> {
  let totalKeysProcessed = 0;

  try {
    const lastSync = await syncStatusService.findWithPrefix(
      chainId,
      network,
      prefix,
      SOURCE_S3
    );

    let startAfter = lastSync ? lastSync.key : undefined;
    let isFinished = false;
    let iterationCount = 0;

    while (
      !isFinished &&
      (!maxIteractions || iterationCount < maxIteractions)
    ) {
      const keys = await listS3Objects(prefix, maxKeys, startAfter);
      if (keys.length > 0) {
        await Promise.all(
          keys.map(async (key) => {
            processKey(network, key);
          })
        );
        totalKeysProcessed += keys.length;
        startAfter = keys[keys.length - 1];
        iterationCount++;
      } else {
        isFinished = true;
      }
    }

    await syncStatusService.save({
      chainId: chainId,
      network: network,
      key: startAfter,
      prefix: prefix,
      source: SOURCE_S3,
    } as any);
  } catch (error) {
    console.error("Error processing block headers from storage:", error);
  }

  return totalKeysProcessed;
}

/**
 * Initiates the process of synchronizing blockchain data from a specific point, either from the latest block cut or from the
 * last recorded synchronization status for each chain.
 *
 * The synchronization process involves the following steps:
 * 1. Fetching the latest cut from the Chainweb network to determine the current highest block heights across all chains.
 * 2. Retrieving the last synchronization status for all chains to identify the starting point of the fill process.
 *    If no previous synchronization status is found for a chain, the process starts from the height provided by the latest cut.
 * 3. Processing each chain individually in a round-robin fashion, fetching headers and their corresponding payloads from
 *    the last height down to a specified minimum height. This ensures that the load is evenly distributed across all chains and
 *    that the system remains responsive during the synchronization process.
 * 4. For each chain, headers and payloads are fetched in descending order (from higher blocks to lower blocks), allowing for
 *    efficient catch-up to the current state of the blockchain.
 * 5. The process continues iteratively, moving through each chain in turn, until all chains have reached the minimum required block height.
 *
 * @param {string} network - The identifier of the Chainweb network from which to synchronize data (e.g., 'mainnet01').
 *
 */
export async function startBackFill(network: string): Promise<void> {
  try {
    console.log("Starting filling...");
    let chains = await getLastSync(network);

    console.info("Starting backfill process for chains:", { chains });

    while (chains.length > 0) {
      for (let i = chains.length - 1; i >= 0; i--) {
        const chain = chains[i];

        console.info(`Processing chain:`, {
          chainId: chain.chainId,
          currentHeight: chain.currentHeight,
        });

        let nextHeight = Math.max(
          chain.currentHeight - SYNC_FETCH_INTERVAL_IN_BLOCKS,
          SYNC_MIN_HEIGHT + 1
        );

        console.info(`Fetching headers for chain: ${chain.chainId}`, {
          nextHeight,
        });

        await fetchHeadersWithRetry(
          network,
          chain.chainId,
          nextHeight,
          chain.currentHeight
        );

        chain.currentHeight = nextHeight - 1;

        if (chain.currentHeight <= SYNC_MIN_HEIGHT) {
          chains.splice(i, 1);
        }

        await delay(SYNC_TIME_BETWEEN_REQUESTS_IN_MS);
      }
    }

    console.log("All chains have been processed to the minimum height.");
  } catch (error) {
    console.error("Error during backfilling:", error);
  }
}

/**
 * Retrieves the last synchronization status for each chain in a given network.
 * It fetches the latest cut (highest block heights) from the network and combines
 * this with the last recorded synchronization status for each chain. If no previous
 * synchronization status is found, it starts from the height provided by the latest cut.
 * This method is useful for determining the starting point for synchronization processes,
 * ensuring that all chains are processed up to the current state.
 *
 * @param network The identifier of the Chainweb network from which to retrieve the last sync status.
 * @returns A promise that resolves to an array of objects, each representing a chain with its
 *          chain ID and the current height from which the synchronization should start.
 */
async function getLastSync(network: string): Promise<any> {
  const lastCutResult = (await fetchCut(network)) as FetchCutResult;

  let lastSyncs = await syncStatusService.getLastSyncForAllChains(network, [
    SOURCE_BACKFILL,
    SOURCE_STREAMING,
  ]);

  return Object.entries(lastCutResult.hashes)
    .map(([chainId, lastCut]) => {
      const lastSync = lastSyncs.find(
        (sync) => sync.chainId === parseInt(chainId)
      );
      let currentHeight = lastSync ? lastSync.toHeight - 1 : lastCut.height;

      console.info(`Chain ID: ${chainId}`, {
        action: lastSync ? "Resuming from last sync" : "Starting from cut",
        currentHeight: currentHeight,
        source: lastSync ? "Last Sync" : "Cut",
        notes: `Processing will start at height ${currentHeight}.`,
      });

      return {
        chainId: parseInt(chainId),
        currentHeight,
      };
    })
    .filter((chain) => chain.currentHeight > SYNC_MIN_HEIGHT);
}

/**
 * Initiates a background task (daemon) that periodically checks for and processes missing blocks across all chains
 * within a specified network. It aims to identify gaps in the synchronized data, fetching and processing headers and
 * payloads for missing blocks to ensure complete and up-to-date blockchain data coverage.
 *
 * @param network The blockchain network identifier where missing blocks are to be processed.
 */
export async function startMissingBlocksDaemon(network: string) {
  console.log("Daemon: Starting to process missing blocks...");

  const sleepInterval = parseInt(process.env.SLEEP_INTERVAL_MS || "5000", 10);

  process.on("SIGINT", () => shutdownSignal.trigger());
  process.on("SIGTERM", () => shutdownSignal.trigger());

  while (!shutdownSignal.isTriggered) {
    try {
      await startMissingBlocks(network);
      console.log(
        `Daemon: Waiting for ${sleepInterval / 1000
        } seconds before the next iteration...`
      );
      await delay(sleepInterval);
    } catch (error) {
      console.error("Daemon: Error occurred in startMissingBlocks -", error);
      console.log(
        `Daemon: Attempting to restart after waiting ${sleepInterval / 1000
        } seconds...`
      );
      await delay(sleepInterval);
    }
  }

  console.log("Daemon: Shutting down gracefully.");
}

/**
 * Initiates the process to handle missing blocks for all chains within a specified network.
 * This function iterates through each chain in the network, identifies missing blocks, and
 * processes them in chunks to manage large ranges efficiently.
 *
 * @param network The network identifier to process missing blocks for.
 */
export async function startMissingBlocks(network: string) {
  console.log("Starting processing missing blocks...");
  const chains = Array.from({ length: 20 }, (_, i) => i);
  for (const chainId of chains) {
    console.info(`Processing missing blocks for chain ID ${chainId}`);
    const missingBlock = await syncStatusService.getNextMissingBlock(
      network,
      chainId
    );

    if (missingBlock) {
      console.info("Processing missing block range:", {
        fromHeight: missingBlock.fromHeight,
        toHeight: missingBlock.toHeight,
      });

      splitIntoChunks(
        missingBlock.toHeight,
        missingBlock.fromHeight,
        SYNC_FETCH_INTERVAL_IN_BLOCKS
      ).forEach(async (chunk) => {
        console.info(`Processing chunk:`, {
          fromHeight: chunk[1],
          toHeight: chunk[0],
        });
        await fetchHeadersWithRetry(network, chainId, chunk[1], chunk[0]);
      });
    }
  }

  console.info("Missing blocks processing complete.");
}

/**
 * Starts the process of retrying failed operations for a specific network.
 * This function retrieves a list of errors recorded during previous operations,
 * attempts to fetch and process the data again, and if successful, removes the error from the log.
 *
 * @param network The blockchain network identifier where the errors occurred.
 * @returns A Promise that resolves when all retry attempts have been processed.
 */
export async function startRetryErrors(network: string): Promise<void> {
  try {
    console.log("Starting retrying failed blocks...");
    const errors = await syncErrorService.getErrors(network, SOURCE_API);

    for (const error of errors) {
      try {
        await fetchHeadersWithRetry(
          error.network,
          error.chainId,
          error.fromHeight,
          error.toHeight
        );
        await syncErrorService.delete(error.id);
      } catch (error) {
        console.log("Error during error retrying:", error);
        console.log("Moving to next error...");
      }
    }
  } catch (error) {
    console.log("Error during error retrying:", error);
  }
}