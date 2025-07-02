import { rootPgPool, sequelize } from '@/config/database';
import { getRequiredEnvString } from '@/utils/helpers';
import { processPayload, saveBlock } from './streaming';
import { Transaction } from 'sequelize';
import Block from '@/models/block';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

export async function syncChain({
  chainId,
  lastHeight,
  tx,
}: {
  chainId: number;
  lastHeight: number;
  tx: Transaction;
}): Promise<void> {
  console.log('[INFO][SYNC][MISSING] canonical tip start:', chainId);
  const cutUrl = `${SYNC_BASE_URL}/${NETWORK_ID}/cut`;
  const cutRes = await fetch(cutUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const cutData = await cutRes.json();

  const chainsAndHashes = Object.keys(cutData.hashes).map(chainId => ({
    chainId,
    hash: cutData.hashes[chainId].hash,
  }));

  const dbQuery = `
    SELECT MAX(height) as height
    FROM "Blocks"
    WHERE "chainId" = $1
  `;

  const { rows } = await rootPgPool.query(dbQuery, [chainId]);

  const fromHeight = rows[0].height + 1;
  const toHeight = lastHeight - 1;

  const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${chainId}/block/branch?minheight=${fromHeight}&maxheight=${toHeight}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      upper: [chainsAndHashes[chainId].hash],
    }),
  });

  const data = await res.json();

  const promises = data.items.map(async (item: any) => {
    const payload = processPayload(item.payloadWithOutputs);
    return saveBlock({ header: item.header, payload }, tx);
  });

  await Promise.all(promises);

  console.log(`[INFO][SYNC][MISSING] canonical tip done: ${chainId}, ${fromHeight} - ${toHeight}`);
}

export async function startMissingBlocksBeforeStreamingProcess() {
  const chainIdDiffs = await checkBigBlockGapsForAllChains();
  await fillChainGap(chainIdDiffs);
}

async function checkBigBlockGapsForAllChains() {
  const url = `${SYNC_BASE_URL}/${NETWORK_ID}/cut`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();

  const chainsAndHashes = Object.keys(data.hashes).map(chainId => ({
    chainId,
    hash: data.hashes[chainId].hash,
    lastHeight: data.hashes[chainId].height,
  }));

  const query = `
    SELECT MAX(height) as height
    FROM "Blocks"
    WHERE "chainId" = $1
  `;

  const promises = chainsAndHashes.map(async chainAndHash => {
    const { rows } = await rootPgPool.query(query, [chainAndHash.chainId]);
    const toHeight = chainAndHash.lastHeight;
    const fromHeight = (rows?.[0]?.height ?? 0) + 1;
    return {
      toHeight,
      fromHeight,
      diff: toHeight - fromHeight,
      chainId: chainAndHash.chainId,
      hash: chainAndHash.hash,
    };
  });

  const chainIdDiffs = await Promise.all(promises);

  const minMissingBlocks = 150; // 1 hour
  const chainsWithLessThan150MissingBlocks = chainIdDiffs.filter(
    chainIdDiffs => chainIdDiffs.diff < minMissingBlocks,
  );

  if (chainsWithLessThan150MissingBlocks.length === 20) {
    console.log(
      `[INFO] All chains have less than ${minMissingBlocks} missing blocks in a row, skipping...`,
    );
    return [];
  }

  const maxMissingBlocks = 150 * 24 * 7; // 7 weeks
  const chainsWithMoreThan7WeeksMissingBlocks = chainIdDiffs.filter(
    chainIdDiffs => chainIdDiffs.diff > maxMissingBlocks,
  );

  if (chainsWithMoreThan7WeeksMissingBlocks.length > 0) {
    console.log(
      `[ERROR] These chains have more than ${maxMissingBlocks} missing blocks in a row: ${chainsWithMoreThan7WeeksMissingBlocks.map(
        chainIdDiffs => chainIdDiffs.chainId,
      )}`,
      console.log(
        `[ERROR] Please make the backfill process individually for these chains. Exiting...`,
      ),
    );
    process.exit(1);
  }

  return chainIdDiffs;
}

async function fillChainGap(
  chainIdDiffs: {
    chainId: string;
    toHeight: number;
    fromHeight: number;
    hash: string;
  }[],
) {
  for (const chainIdDiff of chainIdDiffs) {
    const THRESHOLD = 50;
    const totalHeightRange = chainIdDiff.toHeight - chainIdDiff.fromHeight + 1;
    let processedHeight = 0;

    console.log('Starting:', chainIdDiff.chainId, chainIdDiff.fromHeight, chainIdDiff.toHeight);
    for (let i = chainIdDiff.fromHeight; i <= chainIdDiff.toHeight; i += THRESHOLD) {
      let minHeight = i;
      let maxHeight = Math.min(i + THRESHOLD - 1, chainIdDiff.toHeight);
      const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${chainIdDiff.chainId}/block/branch?minheight=${minHeight}&maxheight=${maxHeight}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          upper: [chainIdDiff.hash],
        }),
      });

      const data = await res.json();

      const tx = await sequelize.transaction();
      try {
        const promises = data.items.map(async (item: any) => {
          const payload = processPayload(item.payloadWithOutputs);
          return saveBlock({ header: item.header, payload, canonical: true }, tx);
        });

        await Promise.all(promises);
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      }

      // new Promise(resolve => setTimeout(resolve, 2000));
      processedHeight += maxHeight - minHeight + 1;
      const progress = Math.min((processedHeight / totalHeightRange) * 100, 100).toFixed(2);

      console.log(`Chain ${chainIdDiff.chainId}: ${progress}%`);
    }

    console.log('Processed:', chainIdDiff);
  }
}

export async function startMissingBlocks() {
  const chainsSynced = [];
  for (const chainId of [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
  ]) {
    const query = `
      SELECT hash
      FROM "Blocks"
      WHERE "chainId" = $1 AND height = (SELECT MAX(height) FROM "Blocks" WHERE "chainId" = $1)
    `;
    const { rows } = await rootPgPool.query(query, [chainId]);
    const blockHash = rows[0].hash;
    const isSynced = await startMissingBlock(blockHash);

    if (isSynced) {
      chainsSynced.push(chainId);
    }
  }

  if (chainsSynced.length === 0) {
    console.log('[INFO][SYNC][MISSING] No chains to sync');
  } else {
    console.log(
      `[INFO][SYNC][MISSING] Successfully synced ${chainsSynced.length} chains: ${chainsSynced.join(
        ', ',
      )}`,
    );
  }
}

async function startMissingBlock(blockHash: string, maxAttempts = 20): Promise<boolean> {
  const CANONICAL_BASE_LINE_LENGTH = 200;

  const findCanonicalBaseline = async (hash: string) => {
    const query = `
      WITH RECURSIVE BlockAncestors AS (
        SELECT hash, parent, 1 AS depth, height, "chainId"
        FROM "Blocks"
        WHERE hash = $1
        UNION ALL
        SELECT b.hash, b.parent, d.depth + 1 AS depth, b.height, b."chainId"
        FROM BlockAncestors d
        JOIN "Blocks" b ON d.parent = b.hash
        WHERE d.depth < $2
      )
      SELECT parent as hash, height, "chainId"
      FROM BlockAncestors
      ORDER BY height DESC
    `;

    const { rows } = await rootPgPool.query(query, [hash, CANONICAL_BASE_LINE_LENGTH]);
    return rows;
  };

  const fetchAndSaveBlocks = async (chainId: number, height: number) => {
    const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${chainId}/block?minheight=${height}&maxheight=${height}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    const tx = await sequelize.transaction();
    try {
      const promises = data.items.map(async (item: any) => {
        const payload = processPayload(item.payloadWithOutputs);
        const block = await Block.findOne({ where: { hash: item.header.hash } });
        if (block) {
          return Promise.resolve();
        } else {
          return saveBlock({ header: item.header, payload, canonical: true }, tx);
        }
      });

      await Promise.all(promises);
      await tx.commit();
      console.log(
        `[INFO][SYNC][MISSING] Successfully synced blocks at height ${height} for chain ${chainId}`,
      );
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  };

  let attempts = 0;
  let ancestors = await findCanonicalBaseline(blockHash);

  while (ancestors.length < CANONICAL_BASE_LINE_LENGTH && attempts < maxAttempts) {
    console.log(
      `[INFO][SYNC][MISSING] Attempt ${attempts + 1}: Found ${ancestors.length} blocks, need ${CANONICAL_BASE_LINE_LENGTH}`,
    );

    // Get the lowest block we have
    const lowestBlock = ancestors[ancestors.length - 1];

    // Fetch and save the parent block
    await fetchAndSaveBlocks(lowestBlock.chainId, lowestBlock.height - 1);

    // Recalculate ancestors
    ancestors = await findCanonicalBaseline(blockHash);
    attempts++;
  }

  if (ancestors.length < CANONICAL_BASE_LINE_LENGTH) {
    throw new Error(
      `[INFO][SYNC][MISSING] Failed to build complete canonical path after ${maxAttempts} attempts. Only found ${ancestors.length} blocks.`,
    );
  }

  return attempts > 0;
}
