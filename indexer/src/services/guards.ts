/**
 * Guards Synchronization Service
 *
 * This module provides functionality to synchronize security guard information for account balances
 * in the Kadena blockchain. Guards represent the security predicates and public keys that control
 * access to accounts and their associated balances.
 *
 * The service includes:
 * 1. Backfill functionality to rebuild the guard database from existing balances
 * 2. Batch processing mechanisms to handle large datasets efficiently
 * 3. Concurrency control to optimize blockchain API requests
 * 4. Transaction management for data consistency
 *
 * Guards are essential for validating transaction authorization across the blockchain,
 * and this service ensures the indexer maintains accurate and up-to-date guard information.
 */

import pLimit from 'p-limit';
import { rootPgPool, sequelize } from '@/config/database';
import { getGuardsFromBalances } from './payload';
import Guard from '@/models/guard';

/**
 * Maximum number of concurrent blockchain API requests allowed.
 * This limit prevents overwhelming the blockchain node with too many
 * simultaneous requests for guard information.
 */
const CONCURRENCY_LIMIT = 50; // Number of concurrent fetches allowed

/**
 * Create a concurrency limiter using p-limit library.
 * This ensures that only CONCURRENCY_LIMIT requests are made in parallel,
 * while queuing additional requests until slots become available.
 */
const limitFetch = pLimit(CONCURRENCY_LIMIT);

/**
 * Backfills guard information for all existing balances in the database.
 *
 * This function performs a complete refresh of all guard data by:
 * 1. Clearing the existing Guards table
 * 2. Processing balances in batches to manage memory usage
 * 3. Fetching current guard information from the blockchain
 * 4. Storing the updated guards with proper transaction handling
 *
 * The function uses controlled concurrency to optimize performance while
 * preventing excessive load on blockchain nodes.
 *
 * @returns {Promise<void>} A promise that resolves when the backfill is complete
 */
export async function backfillGuards() {
  console.info('[INFO][WORKER][BIZ_FLOW] Starting guards backfill ...');

  // SQL query to completely clear the Guards table and reset the ID sequence
  // This ensures a fresh start for the backfill process
  const deleteGuardsQuery = `
    DELETE FROM "Guards";
    ALTER SEQUENCE "Guards_id_seq" RESTART WITH 1;
  `;

  // Execute the cleanup query to prepare for fresh data
  await rootPgPool.query(deleteGuardsQuery);

  // Batch size for processing balances - helps manage memory and transaction size
  const limit = 1000; // Number of rows to process in one batch

  // Track the current position in the database for batch processing
  let currentId = 0;

  // Continue processing batches until all balances are processed
  while (true) {
    // Fetch the next batch of balances to process, ordered by ID
    // This query retrieves a limited number of balances greater than the current ID
    const res = await rootPgPool.query(
      `
        SELECT b.id, b.account, b."chainId", b.module
        FROM "Balances" b
        WHERE b.id > $2
        ORDER BY b.id
        LIMIT $1
      `,
      [limit, currentId],
    );

    const rows = res.rows;

    // If no more rows are found, the backfill is complete
    if (rows.length === 0) {
      console.info('[INFO][DB][DATA_MISSING] No more balance rows to process.');
      break;
    }

    // Map each balance to a promise that fetches its guard information
    // Use p-limit to ensure controlled concurrency for fetch requests
    // This prevents overwhelming the blockchain node with too many simultaneous requests
    const fetchPromises = rows.map(row =>
      limitFetch(() =>
        getGuardsFromBalances([
          {
            id: row.id,
            account: row.account,
            chainId: row.chainId,
            module: row.module,
          },
        ]),
      ),
    );

    // Wait for all guard fetch operations to complete and flatten the results
    // Each fetch operation returns an array of guards, so we flatten to get a single array
    const guards = (await Promise.all(fetchPromises)).flat();

    // Start a transaction to ensure data consistency during guard creation
    const tx = await sequelize.transaction();
    try {
      // Bulk create all guards fetched in this batch within a single transaction
      // This is more efficient than individual inserts and ensures atomicity
      await Guard.bulkCreate(guards, {
        transaction: tx,
      });

      // Commit the transaction if successful
      await tx.commit();

      // Update the current ID to the last processed ID for the next batch
      currentId = rows[rows.length - 1].id;
    } catch (batchError) {
      // Log the error if the batch processing fails
      console.error(`Error processing at id ${currentId}:`, batchError);
      try {
        // Roll back the transaction to maintain database consistency
        await tx.rollback();
        console.info(`[INFO][DB][BIZ_FLOW] Transaction for id at ${currentId} rolled back.`);
      } catch (rollbackError) {
        // Log any errors that occur during rollback (rare but possible)
        console.error('Error during rollback:', rollbackError);
      }
      // Stop processing if an error occurs to prevent cascading failures
      break;
    }
  }
  console.info('[INFO][WORKER][BIZ_FLOW] Guards backfilled successfully.');
}
