import { Counter } from '@/models/counter';
import { Op, Transaction } from 'sequelize';

export async function increaseCounters({
  canonicalBlocksCount,
  orphansBlocksCount,
  canonicalTransactionsCount,
  orphanTransactionsCount,
  chainId,
  tx,
}: {
  canonicalBlocksCount: number;
  orphansBlocksCount: number;
  canonicalTransactionsCount: number;
  orphanTransactionsCount: number;
  chainId: number;
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
}
