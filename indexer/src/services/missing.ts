import { rootPgPool, sequelize } from '@/config/database';
import { getRequiredEnvString } from '@/utils/helpers';
import { processPayload, saveBlock } from './streaming';
import { Transaction } from 'sequelize';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

export async function startMissingBlocksBeforeStreamingProcess() {
  try {
    const chainIdDiffs = await checkBigBlockGapsForAllChains();
    await fillChainGaps(chainIdDiffs);
  } catch (error) {
    console.error(
      `[ERROR][SYNC][SYNC_TIMEOUT] Error starting missing blocks before streaming process:`,
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
      `[ERROR][DATA][DATA_MISSING] These chains exceed ${maxMissingBlocks} missing blocks. Please backfill these chains individually. Exiting...`,
      {
        chains: chainsWithMoreThan7WeeksMissingBlocks.map(c => c.chainId),
        severityHint: 'degraded',
      },
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

      processedHeight += maxHeight - minHeight + 1;
      const progress = Math.min((processedHeight / totalHeightRange) * 100, 100).toFixed(2);

      console.info(`[INFO][SYNC][MISSING] Chain ${chainIdDiff.chainId}: ${progress}%`);
    }

    console.info('[INFO][SYNC][MISSING] Processed:', chainIdDiff);
  }
}

export async function fillChainGapsBeforeDefiningCanonicalBaseline({
  chainId,
  lastHeight,
  tx,
}: {
  chainId: number;
  lastHeight: number;
  tx: Transaction;
}): Promise<void> {
  try {
    console.info('[INFO][SYNC][MISSING] Filling initial chain gaps:', chainId);
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

    if (fromHeight > toHeight) {
      console.info(`[INFO][SYNC][MISSING] No gaps to fill for chain ${chainId}`);
      return;
    }

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
      return saveBlock({ header: item.header, payload, canonical: true }, tx);
    });

    await Promise.all(promises);

    console.info(`[INFO][SYNC][MISSING] Initial chain gaps filled:`, chainId, fromHeight, toHeight);
  } catch (error) {
    console.error(
      `[FATAL][SYNC][MISSING] Error filling chain ${chainId} gaps before defining canonical baseline:`,
      error,
    );
    process.exit(1);
  }
}
