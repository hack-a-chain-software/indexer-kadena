import { rootPgPool, sequelize } from '@/config/database';
import { getRequiredEnvString } from '@/utils/helpers';
import { processPayload, saveBlock } from './streaming';
import { Transaction } from 'sequelize';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

export async function checkLatestBlock({
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

export async function startMissingBlocks() {
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
  }));

  const query = `
    SELECT DISTINCT
      b1."chainId",
      b1."chainwebVersion",
      b1.height + 1 AS from_height,
      MIN(b2.height) - 1 AS to_height,
      (MIN(b2.height) - b1.height - 1) AS diff
    FROM "Blocks" b1
    JOIN "Blocks" b2
      ON b1."chainId" = b2."chainId"
      AND b1."chainwebVersion" = b2."chainwebVersion"
      AND b2.height > b1.height
    WHERE b1."chainId" = $1
    AND b1.height > 5500000 AND b2.height > 5500000
    AND NOT EXISTS (
      SELECT 1
      FROM "Blocks" b3
      WHERE b3."chainId" = b1."chainId"
      AND b3."chainwebVersion" = b1."chainwebVersion"
      AND b3.height = b1.height + 1
    )
    GROUP BY b1."chainId", b1."chainwebVersion", b1.height
    ORDER BY b1."chainId", b1."chainwebVersion", from_height;
  `;

  for (let i = 0; i < chainsAndHashes.length; i += 1) {
    console.log('Processing chain:', chainsAndHashes[i].chainId);
    const chainAndHash = chainsAndHashes[i];
    const { rows } = await rootPgPool.query(query, [chainAndHash.chainId]);

    for (const row of rows) {
      console.log('Row:', row);
      const THRESHOLD = 100;
      const totalHeightRange = row.to_height - row.from_height + 1;
      let processedHeight = 0;

      console.log('Starting:', chainAndHash.chainId, row.from_height, row.to_height);
      for (let i = row.from_height; i <= row.to_height; i += THRESHOLD) {
        let minHeight = i;
        let maxHeight = Math.min(i + THRESHOLD - 1, row.to_height);
        const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${chainAndHash.chainId}/block/branch?minheight=${minHeight}&maxheight=${maxHeight}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            upper: [chainAndHash.hash],
          }),
        });

        const data = await res.json();

        const tx = await sequelize.transaction();
        try {
          const promises = data.items.map(async (item: any) => {
            const payload = processPayload(item.payloadWithOutputs);
            return saveBlock({ header: item.header, payload }, tx);
          });

          await Promise.all(promises);
          await tx.commit();
        } catch (err) {
          await tx.rollback();
          throw err;
        }

        processedHeight += maxHeight - minHeight + 1;
        const progress = Math.min((processedHeight / totalHeightRange) * 100, 100).toFixed(2);

        console.log(`Chain ${chainAndHash.chainId}: ${progress}%`);
      }

      console.log('Processed:', chainAndHash);
    }
  }

  console.info('[INFO][SYNC][MISSING] Missing blocks synced successfully.');
}

export async function checkMissingBlocksSize() {
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
    return {
      diff: chainAndHash.lastHeight - (rows?.[0]?.height ?? 0),
      chainId: chainAndHash.chainId,
    };
  });

  const chainIdDiffs = await Promise.all(promises);

  const diffsHigherThan200 = chainIdDiffs.filter(chainIdDiffs => chainIdDiffs.diff > 200);

  if (diffsHigherThan200.length > 0) {
    console.log(
      `[ERROR] These chains have more than 200 missing blocks in a row: ${diffsHigherThan200.map(
        diff => diff.chainId,
      )}`,
    );
    process.exit(1);
  }
}

export async function startNewMissingBlocks(blockHash: string, maxAttempts = 10): Promise<void> {
  const findAncestors = async (hash: string) => {
    const query = `
      WITH RECURSIVE BlockAncestors AS (
        SELECT hash, parent, 1 AS depth, height, "chainId"
        FROM "Blocks"
        WHERE hash = $1
        UNION ALL
        SELECT b.hash, b.parent, d.depth + 1 AS depth, b.height, b."chainId"
        FROM BlockAncestors d
        JOIN "Blocks" b ON d.parent = b.hash
        WHERE d.depth < 2000
      )
      SELECT parent as hash, height, "chainId"
      FROM BlockAncestors
      ORDER BY height DESC
    `;

    const { rows } = await rootPgPool.query(query, [hash]);
    return rows;
  };

  const fetchAndSaveBlocks = async (chainId: number, height: number) => {
    // Check if block already exists
    const existingBlockQuery = `
      SELECT COUNT(*) as count
      FROM "Blocks"
      WHERE "chainId" = $1 AND height = $2
    `;
    const { rows: existingRows } = await rootPgPool.query(existingBlockQuery, [chainId, height]);
    if (existingRows[0].count > 0) {
      console.log(`Block at height ${height} for chain ${chainId} already exists, skipping...`);
      return;
    }

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
        return saveBlock({ header: item.header, payload }, tx);
      });

      await Promise.all(promises);
      await tx.commit();
      console.log(`Successfully saved block at height ${height} for chain ${chainId}`);
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  };

  let attempts = 0;
  let ancestors = await findAncestors(blockHash);

  while (ancestors.length < 2000 && attempts < maxAttempts) {
    console.log(`Attempt ${attempts + 1}: Found ${ancestors.length} blocks, need 2000`);

    // Get the lowest block we have
    const lowestBlock = ancestors[ancestors.length - 1];

    // Fetch and save the parent block
    await fetchAndSaveBlocks(lowestBlock.chainId, lowestBlock.height - 1);

    // Recalculate ancestors
    ancestors = await findAncestors(blockHash);
    attempts++;
  }

  if (ancestors.length < 2000) {
    throw new Error(
      `Failed to build complete canonical path after ${maxAttempts} attempts. Only found ${ancestors.length} blocks.`,
    );
  }

  console.log('Successfully built complete canonical path with 2000 blocks');
}
