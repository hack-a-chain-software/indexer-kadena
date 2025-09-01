import { rootPgPool, sequelize } from '@/config/database';
import { getRequiredEnvString } from '@/utils/helpers';
import { processPayload, saveBlock } from './streaming';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

export async function startMissingBlocksBeforeStreamingProcess() {
  try {
    const chainIdDiffs = await checkBigBlockGapsForAllChains();
    await fillChainGaps(chainIdDiffs);
  } catch (error) {
    console.error(
      `[ERROR][SYNC][MISSING] Error starting missing blocks before streaming process:`,
      error,
    );
    throw error;
  }
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

  const chainIdDiffs = (await Promise.all(promises)).filter(chainIdDiff => chainIdDiff.diff > 0);

  const minMissingBlocks = 150; // 1 hour
  const chainsWithLessThan150MissingBlocks = chainIdDiffs.filter(
    chainIdDiffs => chainIdDiffs.diff < minMissingBlocks,
  );

  if (chainsWithLessThan150MissingBlocks.length === 20) {
    console.info(
      `[INFO][SYNC][MISSING] All chains have less than ${minMissingBlocks} missing blocks in a row, skipping...`,
    );
    return [];
  }

  const maxMissingBlocks = 150 * 24 * 7; // 7 weeks
  const chainsWithMoreThan7WeeksMissingBlocks = chainIdDiffs.filter(
    chainIdDiffs => chainIdDiffs.diff > maxMissingBlocks,
  );

  if (chainsWithMoreThan7WeeksMissingBlocks.length > 0) {
    console.error(
      `[ERROR] These chains have more than ${maxMissingBlocks} missing blocks in a row: ${chainsWithMoreThan7WeeksMissingBlocks.map(
        chainIdDiffs => chainIdDiffs.chainId,
      )}`,
      console.error(
        `[ERROR] Please make the backfill process individually for these chains. Exiting...`,
      ),
    );
    process.exit(1);
  }

  return chainIdDiffs;
}

async function fillChainGaps(
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

    console.info(
      '[INFO][SYNC][MISSING] Starting:',
      chainIdDiff.chainId,
      chainIdDiff.fromHeight,
      chainIdDiff.toHeight,
    );
    for (let i = chainIdDiff.fromHeight; i <= chainIdDiff.toHeight; i += THRESHOLD) {
      let minHeight = i;
      let maxHeight = Math.min(i + THRESHOLD - 1, chainIdDiff.toHeight);
      const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${chainIdDiff.chainId}/block/branch?minheight=${minHeight}&maxheight=${maxHeight}`;

      console.log('fetching');
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

      console.log('fetched');

      const data = await res.json();

      const tx = await sequelize.transaction();
      console.log('tx', 'initialized', data.items.length);
      try {
        const promises = data.items.map(async (item: any, index: number) => {
          const payload = processPayload(item.payloadWithOutputs);
          console.log('saving', index);
          const block = await saveBlock({ header: item.header, payload, canonical: true }, tx);
          console.log('saved', index);
          return block;
        });

        await Promise.all(promises);
        await tx.commit();
      } catch (err) {
        await tx.rollback();
        throw err;
      }

      processedHeight += maxHeight - minHeight + 1;
      const progress = Math.min((processedHeight / totalHeightRange) * 100, 100).toFixed(2);

      console.info(`[INFO][SYNC][MISSING] Chain ${chainIdDiff.chainId}: ${progress}%`);
    }

    console.info('[INFO][SYNC][MISSING] Processed:', chainIdDiff);
  }
}

const getGaps = async () => {
  const url = `${SYNC_BASE_URL}/${NETWORK_ID}/cut`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();

  const query = `
    WITH ordered_heights AS (
      SELECT DISTINCT "height"
      FROM "Blocks"
      WHERE "chainId" = $1 AND height > 6000000
    ),
    height_gaps AS (
      SELECT
        "height",
        LEAD("height") OVER (ORDER BY "height") AS next_height
      FROM ordered_heights
    )
    SELECT
      "height" + 1 AS start_height,
      next_height - 1 AS end_height
    FROM height_gaps
    WHERE next_height - "height" > 1
    ORDER BY start_height;
  `;

  const allGaps = [];
  for (const chainId of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) {
    const { rows } = await rootPgPool.query(query, [chainId]);
    const gaps = rows.map(row => ({
      chainId: chainId.toString(),
      fromHeight: row.start_height,
      toHeight: row.end_height,
      hash: data.hashes[chainId].hash,
    }));
    allGaps.push(...gaps);
  }

  return allGaps;
};

export async function startMissingBlocksBackfill() {
  const hashesMap = await getGaps();
  console.log(hashesMap);
  await fillChainGaps(hashesMap);
}
