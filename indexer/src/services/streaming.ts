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
import { processBlockAnalytics } from './analytics';

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
  console.info('[INFO][WORKER][BIZ_FLOW] Starting blockchain streaming service...');

  // Initialize price updater
  PriceUpdaterService.getInstance();

  const blocksAlreadyReceived = new Set<string>();

  // Initialize EventSource connection to the blockchain node
  const eventSource = new EventSource(`${SYNC_BASE_URL}/${SYNC_NETWORK}/block/updates`);

  // Handle connection errors
  eventSource.onerror = (error: any) => {
    console.error('[ERROR][NET][CONN_LOST] EventSource connection error:', error);
    // TODO: [OPTIMIZATION] Add reconnection logic with exponential backoff here
  };

  /**
   * Event handler for incoming blocks.
   * Processes each new block, extracts and transforms its data, and saves it to the database.
   * Uses a transaction to ensure data consistency.
   */
  eventSource.addEventListener('BlockHeader', async (event: any) => {
    try {
      // Parse the block data from the event
      const block = JSON.parse(event.data);

      // Skip processing if we've already seen this block
      if (blocksAlreadyReceived.has(block.header.hash)) {
        return;
      }

      // Process the block payload (transactions, miner data, etc.)
      const payload = processPayload(block.payloadWithOutputs);
      blocksAlreadyReceived.add(block.header.hash);

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

      // Commit the transaction if everything succeeds
      await tx.commit();
    } catch (error) {
      console.error('[ERROR][DATA][DATA_CORRUPT] Failed to process block event:', error);
      // TODO: [OPTIMIZATION] Add better error handling and recovery logic
    }
  });

  /**
   * Periodic cache cleanup to prevent memory leaks.
   * Clears the set of processed blocks every 10 minutes.
   */
  setInterval(
    () => {
      console.info('[INFO][CACHE][METRIC] Clearing blocks cache. Freeing memory for new blocks.');
      blocksAlreadyReceived.clear();
    },
    1000 * 60 * 10, // 10 minutes
  );

  // Run guard backfilling immediately on startup
  backfillGuards();

  // Schedule periodic guard backfilling every 12 hours
  setInterval(backfillGuards, 1000 * 60 * 60 * 12); // every 12 hours
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
    } as BlockAttributes;

    // Create the block in the database
    const createdBlock = await Block.create(blockAttribute, {
      transaction: tx,
    });

    // Process the block's transactions and events
    const events = await processPayloadKey(createdBlock, payloadData, tx);

    // Process analytics for this block (async, non-blocking)
    try {
      await processBlockAnalytics(createdBlock, [], events, tx);
    } catch (analyticsError) {
      console.error(
        `[ERROR][ANALYTICS] Failed to process analytics for block ${createdBlock.hash}:`,
        analyticsError,
      );
      // Don't fail the entire block processing if analytics fail
    }
  } catch (error) {
    console.error(`[ERROR][DB][DATA_CORRUPT] Failed to save block to database:`, error);
  }
}
