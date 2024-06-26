import axios from "axios";
import Block, { BlockAttributes } from "../../models/block";
import { SOURCE_API, SOURCE_BACKFILL } from "../../models/syncStatus";
import { createSignal, delay, getRequiredEnvNumber, getRequiredEnvString } from "../../utils/helpers";
import { readAndParseS3Object } from "../s3Service";
import { syncErrorService } from "../syncErrorService";
import { processKeys, } from "../syncService";
import { fetchAndSavePayloadWithRetry, processPayloadKey } from "./payload";
import { syncStatusService } from "../syncStatusService";
import { register } from "../../server/metrics";
import { Histogram } from "prom-client";
import { fetchHeaders } from "./fetch";

const shutdownSignal = createSignal();
const SYNC_ATTEMPTS_MAX_RETRY = getRequiredEnvNumber("SYNC_ATTEMPTS_MAX_RETRY");
const SYNC_ATTEMPTS_INTERVAL_IN_MS = getRequiredEnvNumber("SYNC_ATTEMPTS_INTERVAL_IN_MS");

/**
 * Initializes a set of metrics for monitoring the performance and behavior of the synchronization process.
 * This particular metric, 'syncDuration', is a histogram that tracks the duration of synchronization operations
 * in seconds. It is designed to provide insights into the time taken to process synchronization tasks,
 * helping to identify bottlenecks or inefficiencies in the sync process.
 *
 * The histogram labels are:
 * - 'network': Identifies the blockchain network that the synchronization operation is being performed on.
 * - 'chainId': Identifies the blockchain chain ID that the synchronization operation is being performed on.
 * - 'type': Specifies the type of synchronization operation, such as headers or payloads.
 * - 'minheight': The minimum block height included in the synchronization operation.
 * - 'maxheight': The maximum block height included in the synchronization operation.
 *
 * This structured approach allows for detailed analysis of synchronization performance across different chains,
 * operation types, and block height ranges.
 */
const metrics = {
  syncDuration: new Histogram({
    name: "sync_duration_seconds",
    help: "Duration of sync operations in seconds",
    labelNames: ["network", "chainId", "type", "minheight", "maxheight"],
    registers: [register],
  }),
};

/**
 * Attempts to fetch headers for a given blockchain chain within a specified height range, with retries upon failure.
 * This function makes an HTTP GET request to fetch headers between the minHeight and maxHeight for a specific chainId.
 * In case of a failure, it retries the request up to a maximum number of attempts defined by ATTEMPTS_MAX_RETRY.
 *
 * @param network - The network identifier (e.g., "mainnet01") from which to fetch the headers.
 * @param chainId - The ID of the chain for which headers are being fetched.
 * @param minHeight - The minimum block height for which headers should be fetched.
 * @param maxHeight - The maximum block height for which headers should be fetched.
 * @param attempt - The current attempt number (used internally for retries).
 */
export async function fetchHeadersWithRetry(
  network: string,
  chainId: number,
  minHeight: number,
  maxHeight: number,
  attempt: number = 1
): Promise<void> {
  const end = metrics.syncDuration.startTimer({
    network: network,
    chainId: chainId.toString(),
    minheight: minHeight.toString(),
    maxheight: maxHeight.toString(),
    type: "headers",
  });
  try {
    const data = await fetchHeaders(network, chainId, minHeight, maxHeight);

    console.log(`Fetched ${data.items.length} headers for chainId ${chainId}`);

    for (let i = 0; i < data.items.length; i++) {
      const header = data.items[i];
      console.log(`fetchAndSavePayloadWithRetry for ${header.payloadHash}, chainId ${chainId}, network ${network}, minHeight ${minHeight}, maxHeight ${maxHeight}`);
      await fetchAndSavePayloadWithRetry(
        network,
        chainId,
        header.height,
        header.payloadHash,
        { header: header }
      ).then(async (success) => {
        console.log(`processHeaderKey for network ${network}, height ${header.height}`);
        if (success) {
          const objectKey = `${network}/chains/${chainId}/headers/${header.height}.json`;
          await processHeaderKey(network, objectKey);
        }
      });
    }

    await syncStatusService.save({
      chainId: chainId,
      fromHeight: maxHeight,
      toHeight: minHeight,
      network: network,
      source: SOURCE_BACKFILL,
    } as any);
    end();
  } catch (error) {
    console.error(`Error fetching headers: ${error}`);
    if (attempt < SYNC_ATTEMPTS_MAX_RETRY) {
      console.log(
        `Retrying fetch headers... Attempt ${attempt + 1
        } of ${SYNC_ATTEMPTS_MAX_RETRY}`
      );
      await delay(SYNC_ATTEMPTS_INTERVAL_IN_MS);
      await fetchHeadersWithRetry(
        network,
        chainId,
        minHeight,
        maxHeight,
        attempt + 1
      );
    } else {
      await syncErrorService.save({
        network: network,
        chainId: chainId,
        fromHeight: maxHeight,
        toHeight: minHeight,
        data: error,
        source: SOURCE_API,
      } as any);

      console.log("Max retry attempts reached. Unable to fetch headers for", {
        network,
        chainId,
        minHeight,
        maxHeight,
      });
    }
    end();
  }
}

/**
 * Continuously processes S3 headers for a specific network as a background task (daemon).
 * It checks for new headers to process and does so in a loop until a shutdown signal is received.
 * This method ensures that your application stays up-to-date with the latest block headers.
 *
 * @param network The identifier for the blockchain network (e.g., 'mainnet01').
 */
export async function processS3HeadersDaemon(network: string) {
  console.log("Daemon: Starting to process headers...");

  const sleepInterval = parseInt(process.env.SLEEP_INTERVAL_MS || "15000", 10);

  process.on("SIGINT", () => shutdownSignal.trigger());
  process.on("SIGTERM", () => shutdownSignal.trigger());

  while (!shutdownSignal.isTriggered) {
    try {
      await processS3Headers(network);
      console.log(
        `Daemon: Waiting for ${sleepInterval / 1000
        } seconds before the next iteration...`
      );
      await delay(sleepInterval);
    } catch (error) {
      console.error("Daemon: Error occurred in processS3Headers -", error);
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
 * Processes header keys for each chain within a specified network in a round-robin fashion.
 * It processes a set number of keys for each chain and removes the chain from the processing
 * list once there are no more keys to process. This ensures an even distribution of processing
 * load across multiple chains.
 *
 * @param {string} network - The identifier of the network for which headers are to be processed.
 */
export async function processS3Headers(network: string) {
  console.log("Starting processing headers...");

  const chains = await syncStatusService.getChains(network);
  const lastKeysProcessed = new Map<number, number>();

  const MAX_KEYS = 20;
  const MAX_ITERATIONS = 5;

  while (chains.length > 0) {
    let remainingChains: number[] = [];
    for (const chainId of chains) {
      const prefix = `${network}/chains/${chainId}/headers/`;
      const totalKeysProcessed = await processKeys(
        network,
        chainId,
        prefix,
        processHeaderKey,
        MAX_KEYS,
        MAX_ITERATIONS
      );

      lastKeysProcessed.set(chainId, totalKeysProcessed);

      if (totalKeysProcessed > 0) {
        remainingChains.push(chainId);
      }
    }
    chains.splice(0, chains.length, ...remainingChains);
  }

  console.log("Finished processing headers.");
}

/**
 * Asynchronously processes a single header key by reading and parsing its associated data from an S3 object,
 * saving the parsed block data to the database, and updating the synchronization status accordingly.
 *
 * The function is designed to be flexible, working with any specified network and handling data located using
 * a combination of prefix and key. This allows it to be used in various contexts, including round-robin
 * processing or individual header processing tasks. The function encapsulates the entire process of dealing
 * with a single header's data, from fetching and parsing to persisting the changes in the system's state.
 *
 * @param {string} network - The identifier for the blockchain network (e.g., 'mainnet01'). This is used
 *                           to specify the network context in which the header key is being processed,
 *                           affecting how the data is saved and synchronized.
 * @param {string} prefix - The S3 object prefix that precedes the key, used to construct the full path
 *                          to the S3 object. This typically includes the network and chain ID,
 *                          and helps in organizing and locating the blockchain data in S3.
 * @param {string} key - The specific S3 object key that uniquely identifies the data
 *                       to be processed. This key is used to fetch the data from S3 for processing.
 *
 * @returns {Promise<void>} A promise that resolves when the key has been successfully processed,
 *                          including reading, parsing, saving the block data, and updating the sync status.
 */

export async function processHeaderKey(network: string, key: string) {
  const parsedData = await readAndParseS3Object(key);

  if (!parsedData) {
    console.error("No parsed data found for key:", key);
    return;
  }

  let headerData = parsedData.header;
  if (!headerData) {
    headerData = parsedData;
  }

  const payloadData = parsedData.payload;

  try {
    let blockAttribute = {
      nonce: headerData.nonce,
      creationTime: headerData.creationTime,
      parent: headerData.parent,
      adjacents: headerData.adjacents,
      target: headerData.target,
      payloadHash: headerData.payloadHash,
      chainId: headerData.chainId,
      weight: headerData.weight,
      height: headerData.height,
      chainwebVersion: headerData.chainwebVersion,
      epochStart: headerData.epochStart,
      featureFlags: headerData.featureFlags,
      hash: headerData.hash,
      minerData: payloadData.minerData,
      transactionsHash: payloadData.transactionsHash,
      outputsHash: payloadData.outputsHash,
      coinbase: payloadData.coinbase,
    } as BlockAttributes;

    const createdBlock = await Block.create(blockAttribute);

    await processPayloadKey(network, createdBlock, payloadData);
  } catch (error) {
    console.error(`Error saving block to the database: ${error}`);
  }
}
