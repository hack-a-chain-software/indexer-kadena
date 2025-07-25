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
import StreamingError from '@/models/streaming-error';
import { backfillGuards } from './guards';
import { Transaction } from 'sequelize';
import { PriceUpdaterService } from './price/price-updater.service';
import { defineCanonicalInStreaming } from '@/services/define-canonical';
import {
  fillChainGapsBeforeDefiningCanonicalBaseline,
  checkCanonicalPathForAllChains,
  startMissingBlocksBeforeStreamingProcess,
} from '@/services/missing';

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
  const initialChainGapsAlreadyFilled = new Set<string>();

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
    console.error('[ERROR][NET][CONN_LOST] EventSource connection error:', error);
    // TODO: [OPTIMIZATION] Add reconnection logic with exponential backoff here
  };

  const processBlock = async (block: any) => {
    const blockIdentifier = block.header.hash;
    try {
      if (blocksRecentlyProcessed.has(blockIdentifier)) {
        await defineCanonicalInStreaming(blockIdentifier);
        return;
      }

      // Process the block payload (transactions, miner data, etc.)
      const payload = processPayload(block.payloadWithOutputs);

      // Create a database transaction for atomic operations
      const tx = await sequelize.transaction();

      // Save the block data and process its transactions
      const blockData = await saveBlock({ header: block.header, payload }, tx);

      // If saving fails, log the error and rollback the transaction
      if (blockData === null) {
        await StreamingError.create({
          hash: block.header.hash,
          chainId: block.header.chainId,
        });
        await tx.rollback();
        return;
      }

      if (!initialChainGapsAlreadyFilled.has(block.header.chainId)) {
        initialChainGapsAlreadyFilled.add(block.header.chainId);
        await fillChainGapsBeforeDefiningCanonicalBaseline({
          chainId: block.header.chainId,
          lastHeight: block.header.height,
          tx,
        });
      }

      await tx.commit();

      await defineCanonicalInStreaming(block.header.hash);
      blocksRecentlyProcessed.add(blockIdentifier);
    } catch (error) {
      console.error('[ERROR][DATA][DATA_CORRUPT] Failed to process block event:', error);
      // TODO: [OPTIMIZATION] Add better error handling and recovery logic
    }
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

    blocksToProcess.length = 0;

    setTimeout(processBlocks, 1000);
  };

  setInterval(
    () => {
      blocksRecentlyProcessed.clear();
      console.log('[INFO][SYNC][STREAMING] blocksRecentlyProcessed cleared');
    },
    1000 * 60 * 60 * 1,
  );

  processBlocks();

  // Run guard backfilling immediately on startup
  backfillGuards();

  // Schedule a periodic check of canonical path for all chains every 1 hour
  setInterval(checkCanonicalPathForAllChains, 1000 * 60 * 60 * 1);
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
export async function saveBlock(parsedData: any, tx?: Transaction): Promise<void> {
  const headerData = parsedData.header;
  const payloadData = parsedData.payload;
  const canonical = parsedData.canonical ?? false;
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
    await processPayloadKey(createdBlock, payloadData, tx);
  } catch (error) {
    console.error(`[ERROR][DB][DATA_CORRUPT] Failed to save block to database:`, error);
  }
}
