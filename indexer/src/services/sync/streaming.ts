import { processPayloadKey } from './payload';
import { getDecoded, getRequiredEnvString } from '../../utils/helpers';
import EventSource from 'eventsource';
import { DispatchInfo } from '../../jobs/publisher-job';
import { uint64ToInt64 } from '../../utils/int-uint-64';
import Block, { BlockAttributes } from '../../models/block';
import { sequelize } from '../../config/database';
import StreamingError from '../../models/streaming-error';
import { backfillGuards } from './guards';
import { Transaction } from 'sequelize';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const SYNC_NETWORK = getRequiredEnvString('SYNC_NETWORK');

export async function startStreaming() {
  console.info('[INFO][WORKER][BIZ_FLOW] Starting blockchain streaming service...');

  const blocksAlreadyReceived = new Set<string>();

  const eventSource = new EventSource(`${SYNC_BASE_URL}/${SYNC_NETWORK}/block/updates`);

  eventSource.onerror = (error: any) => {
    console.error('[ERROR][NET][CONN_LOST] EventSource connection error:', error);
  };

  eventSource.addEventListener('BlockHeader', async (event: any) => {
    try {
      const block = JSON.parse(event.data);
      if (blocksAlreadyReceived.has(block.header.hash)) {
        return;
      }
      const payload = processPayload(block.payloadWithOutputs);
      blocksAlreadyReceived.add(block.header.hash);

      const tx = await sequelize.transaction();
      const blockData = await saveBlock({ header: block.header, payload }, tx);
      if (blockData === null) {
        await StreamingError.create({
          hash: block.header.hash,
          chainId: block.header.chainId,
        });
        await tx.rollback();
        return;
      }
      await tx.commit();
    } catch (error) {
      console.error('[ERROR][DATA][DATA_CORRUPT] Failed to process block event:', error);
    }
  });

  setInterval(
    () => {
      console.info('[INFO][CACHE][METRIC] Clearing blocks cache. Freeing memory for new blocks.');
      blocksAlreadyReceived.clear();
    },
    1000 * 60 * 10,
  );

  backfillGuards(); // run when initialize
  setInterval(backfillGuards, 1000 * 60 * 60 * 12); // every one 12 hours
}

export function processPayload(payload: any) {
  const transactions = payload.transactions;
  transactions.forEach((transaction: any) => {
    transaction[0] = getDecoded(transaction[0]);
    transaction[1] = getDecoded(transaction[1]);
  });

  const minerData = getDecoded(payload.minerData);
  const transactionsHash = payload.transactionsHash;
  const outputsHash = payload.outputsHash;
  const coinbase = getDecoded(payload.coinbase);

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

export async function saveBlock(parsedData: any, tx?: Transaction): Promise<DispatchInfo | null> {
  const headerData = parsedData.header;
  const payloadData = parsedData.payload;
  const transactions = payloadData.transactions || [];

  try {
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

    const createdBlock = await Block.create(blockAttribute, {
      transaction: tx,
    });

    const eventsCreated = await processPayloadKey(createdBlock, payloadData, tx);

    const uniqueRequestKeys = new Set(eventsCreated.map(t => t.requestkey).filter(Boolean));

    const uniqueQualifiedEventNames = new Set(
      eventsCreated.map(t => `${t.module}.${t.name}`).filter(Boolean),
    );

    return {
      hash: createdBlock.hash,
      chainId: createdBlock.chainId.toString(),
      height: createdBlock.height,
      requestKeys: Array.from(uniqueRequestKeys),
      qualifiedEventNames: Array.from(uniqueQualifiedEventNames),
    };
  } catch (error) {
    console.error(`[ERROR][DB][DATA_CORRUPT] Failed to save block to database:`, error);
    return null;
  }
}
