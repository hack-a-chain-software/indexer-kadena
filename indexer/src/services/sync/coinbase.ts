import { closeDatabase, rootPgPool, sequelize } from '../../config/database';
import TransactionModel from '../../models/transaction';
import Transfer from '../../models/transfer';
import { Transaction } from 'sequelize';
import Event, { EventAttributes } from '../../models/event';
import { getCoinTransfers } from './transfers';

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

  const allData = (await Promise.all(fetchPromises)).filter(f => f !== undefined);

  const transactionsAdded = await TransactionModel.bulkCreate(
    allData.map(o => o?.transactionAttributes ?? []),
    {
      transaction: tx,
      returning: ['id'],
    },
  );

  const transfersToAdd = allData
    .map((d, index) => {
      const transfersWithTransactionId = (d?.transfersCoinAttributes ?? []).map(t => ({
        ...t,
        transactionId: transactionsAdded[index].id,
      }));
      return transfersWithTransactionId;
    })
    .flat();

  const eventsToAdd = allData
    .map((d, index) => {
      const eventsWithTransactionId = (d?.eventsAttributes ?? []).map(t => ({
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
) {
  if (!coinbase) return;

  const eventsData = coinbase.events || [];
  const transactionAttributes = {
    blockId: block.id,
    code: {},
    data: {},
    chainId: block.chainId,
    creationtime: block.creationTime,
    gaslimit: '0',
    gasprice: '0',
    hash: coinbase.reqKey,
    nonce: '',
    pactid: null,
    continuation: {},
    gas: '0',
    result: coinbase.result,
    logs: coinbase.logs,
    num_events: eventsData ? eventsData.length : 0,
    requestkey: coinbase.reqKey,
    rollback: null,
    sender: 'coinbase',
    sigs: [],
    step: null,
    proof: null,
    ttl: '0',
    txid: coinbase.txId.toString(),
  } as any;

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
