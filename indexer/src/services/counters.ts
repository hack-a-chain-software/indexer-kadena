import { Counter } from '@/models/counter';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '@/config/database';
import { TransactionCounter } from '@/models/transaction-counter';

export async function increaseCounters({
  canonicalBlocksCount,
  orphansBlocksCount,
  canonicalTransactionsCount,
  orphanTransactionsCount,
  chainId,
  totalGasUsed = 0,
  tx,
}: {
  canonicalBlocksCount: number;
  orphansBlocksCount: number;
  canonicalTransactionsCount: number;
  orphanTransactionsCount: number;
  chainId: number;
  totalGasUsed?: number;
  tx?: Transaction;
}) {
  await Counter.increment('canonicalBlocks', {
    by: canonicalBlocksCount,
    transaction: tx,
    where: { chainId: { [Op.eq]: chainId } },
  });
  await Counter.increment('orphansBlocks', {
    by: orphansBlocksCount,
    transaction: tx,
    where: { chainId: { [Op.eq]: chainId } },
  });
  await Counter.increment('canonicalTransactions', {
    by: canonicalTransactionsCount,
    transaction: tx,
    where: { chainId: { [Op.eq]: chainId } },
  });
  await Counter.increment('orphanTransactions', {
    by: orphanTransactionsCount,
    transaction: tx,
    where: { chainId: { [Op.eq]: chainId } },
  });
  if (totalGasUsed > 0) {
    await Counter.increment('totalGasUsed', {
      by: totalGasUsed,
      transaction: tx,
      where: { chainId: { [Op.eq]: chainId } },
    });
  }
}

export async function updateTransactionCountersByBlocks({
  canonicalBlockIds,
  nonCanonicalBlockIds,
  tx,
}: {
  canonicalBlockIds: number[];
  nonCanonicalBlockIds: number[];
  tx?: Transaction;
}) {
  // Nothing to do
  if ((canonicalBlockIds?.length ?? 0) === 0 && (nonCanonicalBlockIds?.length ?? 0) === 0) {
    return;
  }

  // Fetch canonical transactions with their modules
  const canonicalRows = canonicalBlockIds.length
    ? await sequelize.query<{
        sender: string;
        chainId: number;
        module: string;
        cnt: number;
      }>(
        `
      SELECT t.sender AS sender, t."chainId" AS "chainId", e.module AS module, COUNT(*)::int AS cnt
      FROM "Transactions" t
      JOIN "Events" e ON e."transactionId" = t.id
      WHERE t."blockId" = ANY($1::int[])
        AND t.sender != 'coinbase'
      GROUP BY t.sender, t."chainId", e.module
    `,
        { bind: [canonicalBlockIds], transaction: tx, type: QueryTypes.SELECT },
      )
    : [];

  // Fetch non-canonical transactions (to decrement)
  const nonCanonicalRows = nonCanonicalBlockIds.length
    ? await sequelize.query<{
        sender: string;
        chainId: number;
        module: string;
        cnt: number;
      }>(
        `
      SELECT t.sender AS sender, t."chainId" AS "chainId", e.module AS module, COUNT(*)::int AS cnt
      FROM "Transactions" t
      JOIN "Events" e ON e."transactionId" = t.id
      WHERE t."blockId" = ANY($1::int[])
        AND t.sender != 'coinbase'
      GROUP BY t.sender, t."chainId", e.module
    `,
        { bind: [nonCanonicalBlockIds], transaction: tx, type: QueryTypes.SELECT },
      )
    : [];

  // Build deltas
  const incrementRows = canonicalRows.map(r => ({
    sender: r.sender,
    chainId: r.chainId,
    module: r.module,
    delta: r.cnt,
  }));
  const decrementRows = nonCanonicalRows.map(r => ({
    sender: r.sender,
    chainId: r.chainId,
    module: r.module,
    delta: -r.cnt,
  }));

  // console.log('DEBUG - Transaction flow:');
  // console.log('- canonicalBlockIds:', canonicalBlockIds);
  // console.log('- nonCanonicalBlockIds:', nonCanonicalBlockIds);
  // console.log('- incrementRows:', JSON.stringify(incrementRows, null, 2));
  // console.log('- decrementRows:', JSON.stringify(decrementRows, null, 2));

  const allRows = [...incrementRows, ...decrementRows];
  // console.log('- Total rows to process:', allRows.length);

  await upsertCounts(allRows, tx);
}

// Helper: upsert (increment/decrement) counts for (sender, chainId, module)
const upsertCounts = async (
  rows: { sender: string; chainId: number; module: string; delta: number }[],
  tx?: Transaction,
) => {
  if (!rows.length) return;

  // Log all decrements individually
  const decrements = rows.filter(r => r.delta < 0);
  if (decrements.length > 0) {
    console.log(
      `[DEBUG] All decrements:`,
      decrements.map(d => `${d.sender}|${d.chainId}|${d.module}:${d.delta}`),
    );
  }

  // Process each row individually
  for (const row of rows) {
    try {
      // First ensure the record exists
      await TransactionCounter.findOrCreate({
        where: {
          sender: row.sender,
          chainId: row.chainId,
          module: row.module,
        },
        defaults: {
          counter: 0,
        },
        transaction: tx,
      });

      // Get current value before update
      // const before = await TransactionCounter.findOne({
      //   where: {
      //     sender: row.sender,
      //     chainId: row.chainId,
      //     module: row.module,
      //   },
      //   transaction: tx,
      // });
      // console.log('BEFORE UPDATE:', {
      //   counter: before?.counter,
      //   delta: row.delta,
      //   sender: row.sender,
      //   chainId: row.chainId,
      //   module: row.module,
      // });

      // Use raw SQL to ensure the update happens correctly
      // console.log('DEBUG - Has transaction:', tx ? 'yes' : 'no');
      await sequelize.query(
        `UPDATE "TransactionCounters" 
          SET counter = counter + :delta
          WHERE sender = :sender 
          AND "chainId" = :chainId 
          AND module = :module
          RETURNING counter
        `,
        {
          replacements: {
            delta: row.delta,
            sender: row.sender,
            chainId: row.chainId,
            module: row.module,
          },
          type: QueryTypes.UPDATE,
          transaction: tx,
        },
      );
      // console.log('UPDATE RESULT:', updateResult);

      // const test = await TransactionCounter.findOne({
      //   where: {
      //     sender: row.sender,
      //     chainId: row.chainId,
      //     module: row.module,
      //   },
      //   transaction: tx,
      // });

      // console.log('FINAL COUNTER:', test?.counter);
    } catch (error) {
      console.error('[ERROR] Increment failed:', error);
      console.error('[ERROR] Failed with params:', row);
      throw error;
    }
  }
};
