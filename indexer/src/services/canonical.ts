import { rootPgPool } from '@/config/database';

export async function updateCanonicalInBatches() {
  const batchSize = 100;
  const maxHeight = 5350000;
  let currentMinHeight = 0;
  const startTime = Date.now();

  try {
    await rootPgPool.connect();
    console.log('Starting canonical update...');

    while (currentMinHeight < maxHeight) {
      const batchStartTime = Date.now();
      const currentMaxHeight = Math.min(currentMinHeight + batchSize, maxHeight);

      console.log(`Processing heights ${currentMinHeight + 1} to ${currentMaxHeight}...`);

      // Update in transaction
      await rootPgPool.query('BEGIN');

      // Update Blocks
      const blocksResult = await rootPgPool.query(
        `
          UPDATE "Blocks" 
          SET canonical = true 
          WHERE height > $1 AND height <= $2 
        `,
        [currentMinHeight, currentMaxHeight],
      );

      // Update Transactions
      const transactionsResult = await rootPgPool.query(
        `
          UPDATE "Transactions" 
          SET canonical = true 
          WHERE "blockId" IN (
            SELECT id FROM "Blocks" 
            WHERE height > $1 AND height <= $2
          )
        `,
        [currentMinHeight, currentMaxHeight],
      );

      // Update Transfers
      const transfersResult = await rootPgPool.query(
        `
          UPDATE "Transfers"
          SET canonical = true
          WHERE "transactionId" IN (
            SELECT t.id FROM "Transactions" t
            JOIN "Blocks" b ON t."blockId" = b.id
            WHERE b.height > $1 AND b.height <= $2
          )
          `,
        [currentMinHeight, currentMaxHeight],
      );

      // Update Events
      const eventsResult = await rootPgPool.query(
        `
          UPDATE "Events"
          SET canonical = true
          WHERE "transactionId" IN (
            SELECT t.id FROM "Transactions" t
            JOIN "Blocks" b ON t."blockId" = b.id
            WHERE b.height > $1 AND b.height <= $2
          )
          `,
        [currentMinHeight, currentMaxHeight],
      );

      await rootPgPool.query('COMMIT');

      const batchDuration = Date.now() - batchStartTime;
      const totalElapsed = Date.now() - startTime;
      const batchNumber = Math.floor(currentMaxHeight / batchSize);
      const totalBatches = Math.ceil(maxHeight / batchSize);

      console.log(
        `✓ Batch ${batchNumber}/${totalBatches} complete (${batchDuration}ms): ${blocksResult.rowCount} blocks, ${transactionsResult.rowCount} transactions, ${transfersResult.rowCount} transfers, ${eventsResult.rowCount} events | Total elapsed: ${Math.round(totalElapsed / 1000)}s`,
      );

      currentMinHeight = currentMaxHeight;

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `✅ Canonical update completed! Total time: ${Math.round(totalDuration / 1000)}s (${Math.round(totalDuration / 60000)}m)`,
    );
  } catch (error) {
    await rootPgPool.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    await rootPgPool.end();
  }
}
