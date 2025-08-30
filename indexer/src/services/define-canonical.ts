import BlockDbRepository from '@/kadena-server/repository/infra/repository/block-db-repository';
import { increaseCounters } from '@/services/counters';
import { markCanonicalTip } from '@/utils/canonical-tip';
import { getRequiredEnvString } from '@/utils/helpers';
import { processPayload, saveBlock } from './streaming';
import { sequelize } from '@/config/database';
import { Transaction } from 'sequelize';

const blockRepository = new BlockDbRepository();
const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const SYNC_NETWORK = getRequiredEnvString('SYNC_NETWORK');

export async function defineCanonicalBaseline(
  blockHash: string,
  parentHash: string,
  height: number,
  chainId: number,
) {
  try {
    const parentBlock = await blockRepository.getBlockByHash(parentHash);
    if (!parentBlock) {
      console.log(`[INFO][SYNC][DEFINE_CANONICAL] parentBlock not found. filling gaps ...`);
      console.log(`[chainId: ${chainId}, parentHash: ${parentHash}, height: ${height - 1}]`);
      await fillChainGapAndConfirmBlockPath(parentHash, height - 1, chainId);
    }
  } catch (error) {
    console.error(`[ERROR][SYNC][DEFINE_CANONICAL] Error filling gaps:`, error);
    return;
  }

  const tipBlock = await blockRepository.getBlockByHash(blockHash);
  if (!tipBlock) {
    // this scenario should not happen, but if it does, terminate the app.
    console.error(`[ERROR][SYNC][DEFINE_CANONICAL] Block ${blockHash} not found in database`);
    process.exit(1);
  }

  let tx: Transaction;
  try {
    tx = await sequelize.transaction();
  } catch (error) {
    console.error(`[ERROR][SYNC][DEFINE_CANONICAL] Failed to start transaction:`, error);
    throw error;
  }

  try {
    const blocksWithSameHeightOfTipBlock = await blockRepository.getBlocksWithSameHeight(
      tipBlock.height,
      tipBlock.chainId,
      tx,
    );
    const blocksWithHigherHeightOfTipBlock = await blockRepository.getBlocksWithHeightHigherThan(
      tipBlock.height,
      tipBlock.chainId,
      tx,
    );
    const {
      blocksBecameCanonical,
      blocksBecameNonCanonical,
      transactionsBecameCanonical,
      transactionsBecameNonCanonical,
    } = await markCanonicalTip({
      blockRepository,
      blocksWithSameHeightOfTipBlock,
      blocksWithHigherHeightOfTipBlock,
      tipBlock,
      tx,
    });

    await increaseCounters({
      canonicalBlocksCount: blocksBecameCanonical - blocksBecameNonCanonical,
      orphansBlocksCount: blocksBecameNonCanonical - blocksBecameCanonical,
      canonicalTransactionsCount: transactionsBecameCanonical - transactionsBecameNonCanonical,
      orphanTransactionsCount: transactionsBecameNonCanonical - transactionsBecameCanonical,
      chainId: tipBlock.chainId,
      tx,
    });
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    console.error(`[ERROR][SYNC][DEFINE_CANONICAL] Error defining canonical:`, error);
  }
}

async function fillChainGapAndConfirmBlockPath(blockHash: string, height: number, chainId: number) {
  let blocksByHash: Record<string, any>;
  try {
    blocksByHash = await fetchBlocksFromChainwebNode(chainId, height);
  } catch (error) {
    console.error(`[ERROR][SYNC][FILL_GAPS] Failed to get blocks to fill gaps:`, error);
    throw error;
  }

  let tx: Transaction;
  try {
    tx = await sequelize.transaction();
  } catch (error) {
    console.error(`[ERROR][SYNC][FILL_GAPS] Failed to start transaction to fill gaps:`, error);
    throw error;
  }

  let currentHash = blockHash;
  try {
    while (true) {
      const existingBlock = await blockRepository.getBlockByHash(currentHash);
      if (existingBlock) {
        console.info(
          `[INFO][SYNC][FILL_GAPS] Found existing block: ${currentHash}, stopping gap fill`,
        );
        break;
      }

      const currentBlockAPIData = blocksByHash[currentHash];
      if (!currentBlockAPIData) {
        console.info(`[INFO][SYNC][FILL_GAPS] API data all filled, stopping gap fill`);
        break;
      }

      const payload = processPayload(currentBlockAPIData.payloadWithOutputs);
      await saveBlock({ header: currentBlockAPIData.header, payload, canonical: true }, tx);

      // Move to the parent block
      currentHash = currentBlockAPIData.header.parent;
    }
    await tx.commit();
  } catch (err) {
    console.error(`[ERROR][SYNC][FILL_GAPS] Failed to save block ${currentHash} in:`, err);
    await tx.rollback();
    throw err;
  }
}

async function fetchBlocksFromChainwebNode(
  chainId: number,
  height: number,
): Promise<Record<string, any>> {
  const cut = await fetch(`${SYNC_BASE_URL}/${SYNC_NETWORK}/cut`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const cutData = await cut.json();

  const upperHash = cutData.hashes[chainId].hash;
  const MIN_HEIGHT = height - 10; // 10 blocks is the max gap we can fill
  const url = `${SYNC_BASE_URL}/${SYNC_NETWORK}/chain/${chainId}/block/branch?minheight=${MIN_HEIGHT}&maxheight=${height}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upper: [upperHash],
    }),
  });

  const data = await res.json();

  // Create a map of blocks by hash for easy lookup
  const blocksByHash = data.items.reduce((acc: Record<string, any>, item: any) => {
    acc[item.header.hash] = item;
    return acc;
  }, {});

  return blocksByHash;
}
