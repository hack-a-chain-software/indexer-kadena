import { BlockAttributes } from '@/models/block';
import TransactionModel, { TransactionAttributes } from '@/models/transaction';
import TransactionDetails, { TransactionDetailsAttributes } from '@/models/transaction-details';
import { ensureTableExists, getClickHouseClient } from '@/search/clickhouse-client';
import { Transaction } from 'sequelize';
import { chInsertsSuccess, chInsertsFailure } from '@/services/metrics';

export async function indexTransactionCode(
  transactionAttributes: TransactionAttributes,
  transactionDetailsAttributes: TransactionDetailsAttributes,
  createdDetails: TransactionDetails,
  block: BlockAttributes,
  transactionId: number,
  tx?: Transaction,
) {
  // After commit, try async ClickHouse indexing if enabled; never block or rollback
  if (
    process.env.CLICKHOUSE_URL &&
    process.env.FEATURE_CLICKHOUSE_INDEXER === '1' &&
    transactionAttributes.sender !== 'coinbase'
  ) {
    try {
      // Ensure we run post-commit only and decouple errors from commit lifecycle
      // @ts-ignore - Sequelize Transaction has afterCommit hook
      tx?.afterCommit?.(() => {
        setImmediate(async () => {
          try {
            await ensureTableExists();
            const ch = getClickHouseClient();

            const creationTime = Number(transactionAttributes.creationtime);
            const heightNumber = Number(block.height);
            const idNumber = Number(transactionId);
            const chainIdNumber = Number(transactionAttributes.chainId);
            if (
              !Number.isFinite(creationTime) ||
              !Number.isFinite(heightNumber) ||
              !Number.isFinite(idNumber)
            ) {
              throw new Error('Invalid numeric fields for ClickHouse insert');
            }

            const codeStr =
              typeof transactionDetailsAttributes.code === 'string'
                ? transactionDetailsAttributes.code
                : JSON.stringify(transactionDetailsAttributes.code ?? '');

            await ch.insert({
              table: 'transactions_code_v1',
              values: [
                {
                  id: idNumber,
                  requestKey: transactionAttributes.requestkey,
                  chainId: chainIdNumber,
                  creationTime: creationTime,
                  height: heightNumber,
                  canonical: block.canonical ? 1 : 0,
                  sender: transactionAttributes.sender ?? '',
                  gas: String(transactionDetailsAttributes.gas ?? ''),
                  gasLimit: String(transactionDetailsAttributes.gaslimit ?? ''),
                  gasPrice: String(transactionDetailsAttributes.gasprice ?? ''),
                  code: codeStr,
                },
              ],
              format: 'JSONEachRow',
            });

            chInsertsSuccess.inc();
            // try {
            // } catch {}

            await TransactionDetails.update(
              { code_indexed: true },
              { where: { id: createdDetails.id } },
            );
          } catch (err) {
            console.error('[CLICKHOUSE][INDEX][ERROR]', err);
            chInsertsFailure.inc();
            // try {
            // } catch {}
          }
        });
      });
    } catch (e) {
      console.error('[CLICKHOUSE][INDEX][HOOK_ERROR]', e);
    }
  }
}
