/**
 * Blockchain Streaming Service
 *
 * This module handles real-time synchronization with the Kadena blockchain by connecting to a
 * blockchain node's event stream and processing incoming blocks. It's responsible for:
 *
 * 1. Establishing and maintaining a connection to the blockchain's event stream
 * 2. Processing incoming block data
 * 3. Saving blocks and their transactions to the database
 * 4. Handling periodic tasks like guard backfilling and cache cleanup
 *
 * The streaming service is the primary mechanism for keeping the indexer in sync with the
 * latest blockchain state.
 */

import { processPayloadKey } from './payload';
import { getDecoded, getRequiredEnvString } from '@/utils/helpers';
import EventSource from 'eventsource';
import { uint64ToInt64 } from '@/utils/int-uint-64';
import Block, { BlockAttributes } from '@/models/block';
import { sequelize } from '@/config/database';
import { backfillGuards } from './guards';
import { Transaction } from 'sequelize';
import { PriceUpdaterService } from './price/price-updater.service';
import { defineCanonicalBaseline } from '@/services/define-canonical';
import { startMissingBlocksBeforeStreamingProcess } from '@/services/missing';
import { EventAttributes } from '@/models/event';
import { startPairCreation } from '@/services/start-pair-creation';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const SYNC_NETWORK = getRequiredEnvString('SYNC_NETWORK');

/**
 * Starts the blockchain streaming service.
 *
 * This function initializes an EventSource connection to the Kadena blockchain node,
 * sets up event listeners for incoming blocks, and schedules periodic maintenance tasks.
 *
 * The function:
 * 1. Establishes a persistent connection to the blockchain event stream
 * 2. Sets up an error handler for connection issues
 * 3. Configures a block event handler to process new blocks
 * 4. Schedules periodic cache cleanup to prevent memory leaks
 * 5. Initiates and schedules periodic guard backfilling
 *
 * TODO: [OPTIMIZATION] Implement reconnection logic with exponential backoff
 * for better resilience against network failures.
 */

export async function startStreaming() {
  console.info('[INFO][WORKER][BIZ_FLOW] Starting blockchain streaming service ...');

  await startMissingBlocksBeforeStreamingProcess();

  const nextBlocksToProcess: any[] = [];
  const blocksRecentlyProcessed = new Set<string>();

  // Initialize price updater
  PriceUpdaterService.getInstance();

  // Initialize EventSource connection to the blockchain node
  const eventSource = new EventSource(`${SYNC_BASE_URL}/${SYNC_NETWORK}/block/updates`);

  /**
   * Event handler for incoming blocks.
   * Processes each new block, extracts and transforms its data, and saves it to the database.
   * Uses a transaction to ensure data consistency.
   */
  eventSource.addEventListener('BlockHeader', async (event: any) => {
    const block = JSON.parse(event.data);
    nextBlocksToProcess.push(block);
  });

  // Handle connection errors
  eventSource.onerror = (error: any) => {
    // TODO: [RETRY-OPTIMIZATION] Consider adding retry/backoff or a reconnect strategy; at minimum emit a metric.
    console.error('[ERROR][NET][CONN_LOST] EventSource connection error', { error });
  };

  const processBlock = async (block: any) => {
    const blockIdentifier = block.header.hash;

    if (blocksRecentlyProcessed.has(blockIdentifier)) {
      await defineCanonicalBaseline(
        block.header.hash,
        block.header.parent,
        block.header.height,
        block.header.chainId,
      );
      return;
    }

    const tx = await sequelize.transaction();
    try {
      const payload = processPayload(block.payloadWithOutputs);

      // Save the block data and process its transactions
      // TODO: [CONSISTENCY] Validate saveBlock result; if null/failed, handle with rollback + DLQ + metric to avoid partial commits
      await saveBlock({ header: block.header, payload, canonical: null }, tx);
      await tx.commit();
      blocksRecentlyProcessed.add(blockIdentifier);
    } catch (error) {
      await tx.rollback();
      // TODO: [OBS][METRICS] Increment 'stream.block_failures' with tags { chainId, reason: 'processing' }
      // TODO: [STREAM][DLQ] Persist failed block header to DLQ storage for later reprocessing
      console.error('[ERROR][DATA][DATA_CORRUPT] Failed to process block event', {
        error,
        chainId: block?.header?.chainId,
        height: block?.header?.height,
        hash: block?.header?.hash,
      });
      return;
    }

    await defineCanonicalBaseline(
      block.header.hash,
      block.header.parent,
      block.header.height,
      block.header.chainId,
    );
  };

  const processBlocks = async () => {
    const blocksToProcess: any[] = [];
    while (nextBlocksToProcess.length > 0) {
      const block = nextBlocksToProcess.shift();
      blocksToProcess.push(block);
    }

    // Create a map of hash -> latest index
    const lastIndexMap = new Map();
    blocksToProcess.forEach((block, index) => {
      lastIndexMap.set(block.header.hash, index);
    });

    // Filter keeping only blocks at their last index (don't need to process the same block twice)
    const uniqueBlocks = blocksToProcess.filter(
      (block, index) => lastIndexMap.get(block.header.hash) === index,
    );

    // The blocks have to be processed in order to maintain the correct canonical path
    for (const block of uniqueBlocks) {
      await processBlock(block);
    }

    setTimeout(processBlocks, 1000);
  };

  setInterval(
    () => {
      blocksRecentlyProcessed.clear();
      console.info('[INFO][SYNC][STREAMING] blocksRecentlyProcessed cleared');
    },
    1000 * 60 * 60 * 1, // 1 hour
  );

  processBlocks();
  backfillGuards();

  // Schedule a periodic check of pair creation events every 2 minutes
  setInterval(startPairCreation, 1000 * 60 * 2);
}

/**
 * Processes and transforms a block payload.
 *
 * Decodes the various components of a block payload:
 * - Transactions
 * - Miner data
 * - Hashes (transactions, outputs)
 * - Coinbase information
 *
 * @param payload The raw payload data from the blockchain
 * @returns A processed payload object with decoded data
 */
export function processPayload(payload: any) {
  // Decode transaction data
  const transactions = payload.transactions;
  transactions.forEach((transaction: any) => {
    transaction[0] = getDecoded(transaction[0]);
    transaction[1] = getDecoded(transaction[1]);
  });

  // Decode other payload components
  const minerData = getDecoded(payload.minerData);
  const transactionsHash = payload.transactionsHash;
  const outputsHash = payload.outputsHash;
  const coinbase = getDecoded(payload.coinbase);

  // Construct and return the processed payload
  const payloadData = {
    transactions: transactions,
    minerData: minerData,
    transactionsHash: transactionsHash,
    outputsHash: outputsHash,
    payloadHash: payload.payloadHash,
    coinbase: coinbase,
  };

  return payloadData;
}

/**
 * Saves a block and its transactions to the database.
 *
 * This function:
 * 1. Extracts and transforms block header and payload data
 * 2. Creates a Block record in the database
 * 3. Processes the block's transactions and events
 * 4. Returns dispatch information for further processing
 *
 * @param parsedData The parsed block data containing header and payload
 * @param tx Optional Sequelize transaction for atomic operations
 * @returns Dispatch information object or null if saving fails
 *
 * TODO: [OPTIMIZATION] Consider implementing batch processing for high transaction volumes
 * to improve database performance.
 */
export async function saveBlock(
  parsedData: any,
  tx?: Transaction,
): Promise<EventAttributes[] | null> {
  const headerData = parsedData.header;
  const payloadData = parsedData.payload;
  const canonical = parsedData.canonical;
  const transactions = payloadData.transactions || [];

  try {
    // Create block attributes from the header and payload data
    const blockAttribute = {
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
      featureFlags: uint64ToInt64(headerData.featureFlags),
      hash: headerData.hash,
      minerData: payloadData.minerData,
      transactionsHash: payloadData.transactionsHash,
      outputsHash: payloadData.outputsHash,
      coinbase: payloadData.coinbase,
      transactionsCount: transactions.length,
      canonical,
    } as BlockAttributes;

    // Create the block in the database
    const createdBlock = await Block.create(blockAttribute, {
      transaction: tx,
    });

    // Process the block's transactions and events
    return processPayloadKey(createdBlock, payloadData, tx);
  } catch (error) {
    console.error(`[ERROR][DB][DATA_CORRUPT] Failed to save block to database:`, error);
    return null;
  }
}
