import axios from "axios";
import {
  BASE_URL,
  ATTEMPTS_MAX_RETRY,
  ATTEMPTS_INTERVAL_IN_MS,
  SYNC_MIN_HEIGHT,
  SYNC_FETCH_INTERVAL_IN_BLOCKS,
  TIME_BETWEEN_REQUESTS_IN_MS,
} from "../utils/constants";
import { saveHeader, savePayload, saveLastCut } from "./s3Service";
import { getDecoded } from "../utils/helpers";
import { listS3Objects, readAndParseS3Object } from "./s3Service";
import { blockService } from "./blockService";
import { syncStatusService } from "./syncStatusService";
import { syncErrorService } from "./syncErrorService";
import https from "https";

const SOURCE_S3 = "s3";
const SOURCE_API = "api";
const SOURCE_BACKFILL = "backfill";
const SOURCE_STREAMING = "Streaming";

/**
 * Processes headers from S3 for a specific network and chainId.
 * This method fetches a list of keys (headers) from an S3 bucket based on the last synchronization status.
 * For each key, it reads and parses the S3 object to obtain block data, saves the block data to the database,
 * and updates the synchronization status accordingly.
 *
 * @param {string} network - The network identifier (e.g., 'mainnet01').
 * @param {number} chainId - The chain ID to process headers for.
 */
export async function processHeaders(
  network: string,
  chainId: number
): Promise<void> {
  try {
    const lastSync = await syncStatusService.find(chainId, network, SOURCE_S3);
    let keys = [];
    if (lastSync) {
      console.log(`Last sync found. Fetching keys from ${lastSync.key}`);
      keys = await listS3Objects(network, chainId, lastSync.key);
    } else {
      console.log(
        `No last sync found. Fetching all keys for chainId ${chainId}`
      );
      keys = await listS3Objects(network, chainId);
    }

    for (const key of keys) {
      const parsedData = await readAndParseS3Object(key);
      await blockService.save(parsedData);

      await syncStatusService.save({
        chainId: parsedData.chainId,
        fromHeight: parsedData.height,
        toHeight: parsedData.height,
        network: network,
        key: key,
        source: SOURCE_S3,
      } as any);
    }
  } catch (error) {
    console.error("Error processing block headers from storage:", error);
  }
}

/**
 * Processes multiple blockchain chains in a round-robin fashion until all chains reach a specified minimum height.
 * This method fetches the latest block cut and iteratively processes each chain by fetching and processing headers
 * from the highest available block down to a minimum sync height. It aims to evenly distribute the processing load
 * across all chains, ensuring a balanced synchronization process.
 *
 * Each iteration fetches headers for a single block from each chain, processes those headers, and then moves to the
 * next block in a round-robin manner. This process continues until all chains have reached the minimum required block height.
 *
 * @param {string} network - The network identifier (e.g., 'mainnet01') for which the chains are to be processed.
 * This is used to fetch the current cut and determine the starting heights for each chain.
 * @returns {Promise<void>} - A promise that resolves once all chains have been processed to the minimum height.
 */
export async function processMultipleChains(
  network: string,
  chainIds: number[]
): Promise<void> {
  try {
    const fetchPromises = chainIds.map((chainId) =>
      processHeaders(network, chainId)
    );
    await Promise.all(fetchPromises);
  } catch (error) {
    console.error("Error processing multiple chains:", error);
  }
}

/**
 * Starts streaming headers from the Chainweb P2P network.
 * This method establishes a connection to the Chainweb node's header stream and listens for new headers.
 * Upon receiving a header, it saves the header and its payload to S3 and attempts to fetch the payload's transactions.
 * It retries fetching the payload up to a maximum number of attempts if necessary.
 *
 * @param {string} network - The network identifier (e.g., 'mainnet01').
 */
export async function startStreaming(network: string): Promise<void> {
  const options = {
    method: "GET",
    hostname: "api.chainweb.com",
    port: 443,
    path: `/chainweb/0.0/${network}/header/updates`,
  };

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);

    res.on("data", async (chunk) => {
      const chunkStr = chunk.toString();
      const dataLine = chunkStr
        .split("\n")
        .find((line: any) => line.startsWith("data:"));

      if (dataLine) {
        const jsonData = dataLine.replace("data:", "").trim();

        try {
          const blockData = JSON.parse(jsonData);
          const height = blockData.header.height;
          const chainId = blockData.header.chainId;
          const creationTime = blockData.header.creationTime;

          console.log(
            `chainId: ${chainId} - height: ${height} - creationTime: ${creationTime}`
          );

          const payloadHash = blockData.header.payloadHash;

          await saveHeader(network, chainId, height, blockData);
          // console.log("Payload hash:", payloadHash);

          fetchPayloadWithRetry(network, chainId, height, payloadHash);

          await syncStatusService.save({
            chainId: chainId,
            fromHeight: height,
            toHeight: height,
            network: network,
            source: SOURCE_STREAMING,
          } as any);
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    });

    res.on("end", () => {
      console.log("No more data in response.");
    });
  });

  req.on("error", (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.end();
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
    const lastCutResult = (await fetchCut(network)) as FetchCutResult;

    await saveLastCut(network, lastCutResult);

    let lastSyncs = await syncStatusService.getLastSyncForAllChains(
      network,
      SOURCE_BACKFILL
    );

    let chains = Object.entries(lastCutResult.hashes)
      .map(([chainId, lastCut]) => {
        const lastSync = lastSyncs.find(
          (sync) => sync.chainId === parseInt(chainId)
        );
        let currentHeight = lastSync ? lastSync.toHeight : lastCut.height;

        console.log(
          `------------------------------------------\nChain ID ${chainId}: Starting at height ${currentHeight} from ${
            lastSync ? "last sync" : "cut"
          }.`
        );
        return {
          chainId: parseInt(chainId),
          currentHeight,
          startHeight: lastCut.height,
        };
      })
      .filter((chain) => chain.currentHeight > SYNC_MIN_HEIGHT);

    console.log("------------------------------------------\nChains", chains);
    while (chains.length > 0) {
      for (let i = chains.length - 1; i >= 0; i--) {
        const chain = chains[i];

        console.log("------------------------------------------\nChain", chain);

        let nextHeight = Math.max(
          chain.currentHeight - SYNC_FETCH_INTERVAL_IN_BLOCKS,
          SYNC_MIN_HEIGHT + 1
        );

        console.log(
          "--------------------------------\nNext Height",
          nextHeight
        );

        console.log(
          `Processing Chain ID ${chain.chainId} from heights ${nextHeight} to ${chain.currentHeight}`
        );

        await fetchHeadersWithRetry(
          network,
          chain.chainId,
          chain.startHeight,
          nextHeight,
          chain.currentHeight
        );

        chain.currentHeight = nextHeight - 1;

        if (chain.currentHeight <= SYNC_MIN_HEIGHT) {
          chains.splice(i, 1);
        }

        await delay(TIME_BETWEEN_REQUESTS_IN_MS);
      }
    }

    console.log("All chains have been processed to the minimum height.");
  } catch (error) {
    console.error("Error during backfilling:", error);
  }
}

interface FetchCutResult {
  hashes: {
    [chainId: string]: {
      height: number;
      hash: string;
    };
  };
}

/**
 * Fetches the current cut information from the network.
 *
 * @param network The network to fetch the cut from (e.g., "mainnet01").
 * @returns A promise resolving to the cut information.
 */
async function fetchCut(network: string): Promise<any> {
  try {
    const response = await axios.get(`${BASE_URL}/${network}/cut`);
    return response.data as FetchCutResult;
  } catch (error) {
    console.error("Error fetching cut:", error);
    throw error;
  }
}

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
async function fetchHeadersWithRetry(
  network: string,
  chainId: number,
  startHeight: number | undefined,
  minHeight: number,
  maxHeight: number,
  attempt: number = 1
): Promise<void> {
  const endpoint = `${BASE_URL}/${network}/chain/${chainId}/header?minheight=${minHeight}&maxheight=${maxHeight}`;
  try {
    console.log(
      `Fetching headers from ${minHeight} to ${maxHeight} for chainId ${chainId}`
    );

    const response = await axios.get(endpoint, {
      headers: { Accept: "application/json;blockheader-encoding=object" },
    });

    const items = response.data.items;
    for (const header of items) {
      await saveHeader(network, chainId, header.height, header);
      console.log("Fetching payload from hash:", header.payloadHash);

      await fetchPayloadWithRetry(
        network,
        chainId,
        header.height,
        header.payloadHash
      );
    }

    await syncStatusService.save({
      chainId: chainId,
      startHeight: startHeight,
      fromHeight: maxHeight,
      toHeight: minHeight,
      network: network,
      source: SOURCE_BACKFILL,
    } as any);
  } catch (error) {
    console.error(`Error fetching headers: ${error}`);
    if (attempt < ATTEMPTS_MAX_RETRY) {
      console.log(
        `Retrying fetch headers... Attempt ${
          attempt + 1
        } of ${ATTEMPTS_MAX_RETRY}`
      );
      await delay(ATTEMPTS_INTERVAL_IN_MS);
      await fetchHeadersWithRetry(
        network,
        chainId,
        startHeight,
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
        endpoint: endpoint,
        source: SOURCE_API,
      } as any);

      console.log("Max retry attempts reached. Unable to fetch headers for", {
        network,
        chainId,
        minHeight,
        maxHeight,
      });
    }
  }
}

/**
 * Attempts to fetch payload data for a given block with retries.
 *
 * @param network The network to fetch payload from (e.g., "mainnet01").
 * @param chainId The ID of the chain to fetch payload for.
 * @param height The height of the block to fetch payload for.
 * @param payloadHash The hash of the payload to fetch.
 * @param attempt The current retry attempt.
 */
async function fetchPayloadWithRetry(
  network: string,
  chainId: number,
  height: number,
  payloadHash: string,
  attempt = 1
): Promise<void> {
  const endpoint = `${BASE_URL}/${network}/chain/${chainId}/payload/${payloadHash}/outputs`;
  try {
    const response = await axios.get(endpoint);
    const transactions = response.data.transactions;
    // console.log("Number of transactions:", transactions.length);
    transactions.forEach((transaction: any) => {
      transaction[0] = getDecoded(transaction[0]);
      transaction[1] = getDecoded(transaction[1]);
    });
    await savePayload(network, chainId, height, payloadHash, transactions);
  } catch (error) {
    if (attempt < ATTEMPTS_MAX_RETRY) {
      console.log(
        `Retrying... Attempt ${
          attempt + 1
        } of ${ATTEMPTS_MAX_RETRY} for payloadHash ${payloadHash}`
      );
      await delay(ATTEMPTS_INTERVAL_IN_MS);
      await fetchPayloadWithRetry(
        network,
        chainId,
        height,
        payloadHash,
        attempt + 1
      );
    } else {
      await syncErrorService.save({
        network: network,
        chainId: chainId,
        fromHeight: height,
        toHeight: height,
        payloadHash: payloadHash,
        data: error,
        endpoint: endpoint,
        source: SOURCE_API,
      } as any);

      console.log(
        "Max retry attempts reached. Unable to fetch transactions for",
        { network, chainId, height, payloadHash }
      );
    }
  }
}

export async function startRetryErrors(network: string): Promise<void> {
  try {
    const errors = await syncErrorService.getErrors(network, SOURCE_API);

    for (const error of errors) {
      try {
        await fetchHeadersWithRetry(
          error.network,
          error.chainId,
          undefined,
          error.fromHeight,
          error.toHeight
        );
        syncErrorService.delete(error.id);
      } catch (error) {
        console.log("Error during error retrying:", error);
        console.log("Moving to next error...");
      }
    }
  } catch (error) {
    console.log("Error during error retrying:", error);
  }
}

/**
 * Introduces a delay in the execution flow.
 *
 * @param ms The amount of time in milliseconds to delay.
 * @returns A promise that resolves after the specified delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}