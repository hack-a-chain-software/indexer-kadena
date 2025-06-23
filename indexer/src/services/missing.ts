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
  console.log('Syncing blocks before canonical tip processing:', chainId);
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

  console.log('Missing blocks synced:', chainId, fromHeight, toHeight);
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
