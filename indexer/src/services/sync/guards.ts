import pLimit from "p-limit";
import { rootPgPool, sequelize } from "../../config/database";
import { getGuardsFromBalances } from "./payload";
import Guard from "../../models/guard";

const CONCURRENCY_LIMIT = 4; // Number of concurrent fetches allowed
const limitFetch = pLimit(CONCURRENCY_LIMIT);

export async function startGuardsBackfill() {
  try {
    await sequelize.authenticate();
    console.log("Connected to the database.");

    await rootPgPool.query(
      `
        BEGIN;
        SET enable_seqscan = OFF;
        WITH combined AS (
            SELECT "chainId", "from_acct" AS "account", "modulename" AS "module"
            FROM "Transfers"
            UNION ALL
            SELECT "chainId", "to_acct" AS "account", "modulename" AS "module"
            FROM "Transfers"
        )
        INSERT INTO "Balances" ("chainId", "account", "module", "createdAt", "updatedAt")
        SELECT "chainId", "account", "module", NOW() AS "createdAt", NOW() AS "updatedAt"
        FROM combined
        GROUP BY "chainId", "account", "module";
        COMMIT;
      `,
    );

    console.log("Balances backfilled successfully.");
    console.log("Starting guards backfill ...");

    const limit = 500; // Number of rows to process in one batch
    let offset = 0;

    while (true) {
      const tx = await sequelize.transaction();
      try {
        console.log(`Fetching rows from offset: ${offset}, limit: ${limit}`);
        const res = await rootPgPool.query(
          `SELECT b.id, b.account, b."chainId", b.module FROM "Balances" b ORDER BY b.id LIMIT $1 OFFSET $2`,
          [limit, offset],
        );

        const rows = res.rows;
        if (rows.length === 0) {
          console.log("No more rows to process.");
          break;
        }

        // Use p-limit to ensure controlled concurrency for fetch requests
        const fetchPromises = rows.map((row) =>
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
        const guards = (await Promise.all(fetchPromises)).flat();

        await Guard.bulkCreate(guards, {
          transaction: tx,
        });

        await tx.commit();
        console.log(`Batch at offset ${offset} processed successfully.`);
        offset += limit;
      } catch (batchError) {
        console.error(
          `Error processing batch at offset ${offset}:`,
          batchError,
        );
        try {
          await tx.rollback();
          console.log(`Transaction for batch at offset ${offset} rolled back.`);
        } catch (rollbackError) {
          console.error("Error during rollback:", rollbackError);
        }
        break;
      }
    }
  } catch (error) {
    console.error("Error during backfill:", error);
  } finally {
    await sequelize.close();
    console.log("Database connection closed.");
  }
}