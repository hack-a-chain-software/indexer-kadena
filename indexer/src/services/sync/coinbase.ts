import { closeDatabase, rootPgPool, sequelize } from '../../config/database';
import TransactionModel, { TransactionCreationAttributes } from '../../models/transaction';
import Transfer, { TransferAttributes } from '../../models/transfer';
import { Transaction } from 'sequelize';
import Event, { EventAttributes } from '../../models/event';
import { getCoinTransfers } from './transfers';
import Signer from '../../models/signer';
import Guard from '../../models/guard';
import { handleSingleQuery } from '../../kadena-server/utils/raw-query';
import { TransactionDetailsCreationAttributes } from '../../models/transaction-details';

interface CoinbaseTransactionData {
  transactionAttributes: TransactionCreationAttributes;
  eventsAttributes: EventAttributes[];
  transfersCoinAttributes: TransferAttributes[];
}

export async function startBackfillCoinbaseTransactions() {
  console.info('[INFO][SYNC][COINBASE] Starting coinbase backfill ...');

  const limit = 1000; // Number of rows to process in one batch
  let offset = 0;

  while (true) {
    console.info(`[INFO][SYNC][COINBASE] Fetching rows from offset: ${offset}, limit: ${limit}`);
    const res = await rootPgPool.query(
      `SELECT b.id, b.coinbase, b."chainId", b."creationTime" FROM "Blocks" b ORDER BY b.id LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const rows = res.rows;
    if (rows.length === 0) {
      console.info('[INFO][SYNC][COINBASE] No more rows to process.');
      break;
    }

    const tx = await sequelize.transaction();
    try {
      await addCoinbaseTransactions(rows, tx);
      await tx.commit();
      console.info(`[INFO][SYNC][COINBASE] Batch at offset ${offset} processed successfully.`);
      offset += limit;
    } catch (batchError) {
      console.error(`[ERROR][SYNC][COINBASE] Processing batch at offset ${offset}:`, batchError);
      try {
        await tx.rollback();
        console.info(
          `[INFO][SYNC][COINBASE] Transaction for batch at offset ${offset} rolled back.`,
        );
      } catch (rollbackError) {
        console.error('[ERROR][SYNC][COINBASE] Error during rollback:', rollbackError);
      }
      break;
    }
  }

  await closeDatabase();
  process.exit(0);
}

export async function addCoinbaseTransactions(
  rows: Array<any>,
  tx: Transaction,
): Promise<EventAttributes[]> {
  const fetchPromises = rows.map(async row => {
    const output = await processCoinbaseTransaction(row.coinbase, {
      id: row.id,
      chainId: row.chainId,
      creationTime: row.creationTime,
    });
    return output;
  });

  const allData = (await Promise.all(fetchPromises)).filter(
    (f): f is CoinbaseTransactionData => f !== undefined,
  );

  const transactionsAdded = await TransactionModel.bulkCreate(
    allData.map(o => o.transactionAttributes),
    {
      transaction: tx,
      returning: ['id'],
    },
  );

  const transfersToAdd = allData
    .map((d, index) => {
      const transfersWithTransactionId = (d.transfersCoinAttributes ?? []).map(t => ({
        ...t,
        transactionId: transactionsAdded[index].id,
      }));
      return transfersWithTransactionId;
    })
    .flat();

  const eventsToAdd = allData
    .map((d, index) => {
      const eventsWithTransactionId = (d.eventsAttributes ?? []).map(t => ({
        ...t,
        transactionId: transactionsAdded[index].id,
      }));
      return eventsWithTransactionId;
    })
    .flat();

  await Transfer.bulkCreate(transfersToAdd, {
    transaction: tx,
  });

  await Event.bulkCreate(eventsToAdd, {
    transaction: tx,
  });

  return eventsToAdd;
}

export async function processCoinbaseTransaction(
  coinbase: any,
  block: { id: number; chainId: number; creationTime: bigint },
): Promise<CoinbaseTransactionData | undefined> {
  if (!coinbase) return;

  const eventsData = coinbase.events || [];
  const transactionAttributes = {
    blockId: block.id,
    chainId: block.chainId,
    creationtime: block.creationTime.toString(),
    hash: coinbase.reqKey,
    result: coinbase.result,
    logs: coinbase.logs,
    num_events: eventsData ? eventsData.length : 0,
    requestkey: coinbase.reqKey,
    sender: 'coinbase',
    txid: coinbase.txId.toString(),
  } as TransactionCreationAttributes;

  const transfersCoinAttributes = await getCoinTransfers(eventsData, transactionAttributes);

  const eventsAttributes = eventsData.map((eventData: any) => {
    return {
      chainId: transactionAttributes.chainId,
      module: eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name,
      name: eventData.name,
      params: eventData.params,
      qualname: eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name,
      requestkey: coinbase.reqKey,
    } as EventAttributes;
  }) as EventAttributes[];

  return { transactionAttributes, eventsAttributes, transfersCoinAttributes };
}
