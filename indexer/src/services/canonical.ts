import { rootPgPool } from '@/config/database';

const HEIGHTS_PER_BATCH = 50; // Process 50 heights at a time
const NUM_WORKERS = 4;
const MAX_RETRIES = 3;
const START_HEIGHT = 1;
const END_HEIGHT = 5350000;

async function updateRangeWithRetry(
  startHeight: number,
  endHeight: number,
  retries = MAX_RETRIES,
): Promise<number> {
  try {
    const result = await rootPgPool.query(
      `
        UPDATE "Blocks" 
        SET canonical = true 
        WHERE height > $1 AND height <= $2 
        AND (canonical IS NULL OR canonical = false)
        RETURNING id
      `,
      [startHeight, endHeight],
    );
    return result.rowCount || 0;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, (MAX_RETRIES - retries + 1) * 1000));
      return updateRangeWithRetry(startHeight, endHeight, retries - 1);
    }
    throw error;
  }
}

export async function updateCanonicalInBatches() {
  let currentMinHeight = START_HEIGHT;
  const startTime = Date.now();
  const client = await rootPgPool.connect();

  try {
    console.log('Starting canonical update...');
    console.log(`Processing ${HEIGHTS_PER_BATCH} heights per batch`);

    while (currentMinHeight < END_HEIGHT) {
      const batchStartTime = Date.now();

      const ranges: { start: number; end: number }[] = [];
      for (let i = 0; i < NUM_WORKERS; i++) {
        const rangeStart = currentMinHeight + i * HEIGHTS_PER_BATCH;
        const rangeEnd = Math.min(rangeStart + HEIGHTS_PER_BATCH, END_HEIGHT);
        if (rangeStart < END_HEIGHT) {
          ranges.push({ start: rangeStart, end: rangeEnd });
        }
      }

      const results = await Promise.all(
        ranges.map(({ start, end }) => updateRangeWithRetry(start, end)),
      );

      const totalUpdated = results.reduce((sum, count) => sum + count, 0);
      const batchDuration = Date.now() - batchStartTime;
      const totalElapsed = Date.now() - startTime;

      console.log(
        `✓ Processed heights ${currentMinHeight + 1} to ${ranges[ranges.length - 1].end} ` +
          `(${batchDuration}ms): ${totalUpdated} blocks updated`,
      );

      if (totalElapsed > 0) {
        const heightsProcessed = currentMinHeight - START_HEIGHT;
        const heightsPerSecond = Math.round(heightsProcessed / (totalElapsed / 1000));
        console.log(`Overall throughput: ${heightsPerSecond} heights/second`);
      }

      currentMinHeight = ranges[ranges.length - 1].end;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalDuration = Date.now() - startTime;
    const totalHeightsProcessed = END_HEIGHT - START_HEIGHT;
    console.log(
      `✅ Canonical update completed! ` +
        `Processed ${totalHeightsProcessed} heights in ${Math.round(totalDuration / 1000)}s ` +
        `(${Math.round(totalDuration / 60000)}m)`,
    );
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
}
