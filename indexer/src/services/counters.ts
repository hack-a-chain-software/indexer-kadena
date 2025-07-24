import { Counter } from '@/models/counter';
import { Op, Transaction } from 'sequelize';

export async function increaseCounters({
  canonicalBlocksCount,
  orphansBlocksCount,
  canonicalTransactionsCount,
  orphanTransactionsCount,
  tx,
}: {
  canonicalBlocksCount: number;
  orphansBlocksCount: number;
  canonicalTransactionsCount: number;
  orphanTransactionsCount: number;
  tx?: Transaction;
}) {
  await Counter.increment('canonicalBlocks', {
    by: canonicalBlocksCount,
    transaction: tx,
    where: { canonicalBlocks: { [Op.gte]: 0 } },
  });
  await Counter.increment('orphansBlocks', {
    by: orphansBlocksCount,
    transaction: tx,
    where: { orphansBlocks: { [Op.gte]: 0 } },
  });
  await Counter.increment('canonicalTransactions', {
    by: canonicalTransactionsCount,
    transaction: tx,
    where: { canonicalTransactions: { [Op.gte]: 0 } },
  });
  await Counter.increment('orphanTransactions', {
    by: orphanTransactionsCount,
    transaction: tx,
    where: { orphanTransactions: { [Op.gte]: 0 } },
  });
}
