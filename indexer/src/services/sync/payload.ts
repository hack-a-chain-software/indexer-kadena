import { Transaction } from 'sequelize';

import { sequelize } from '../../config/database';
import { handleSingleQuery } from '../../kadena-server/utils/raw-query';
import { BlockAttributes } from '../../models/block';
import Event, { EventAttributes } from '../../models/event';
import Signer from '../../models/signer';
import TransactionModel, { TransactionAttributes } from '../../models/transaction';
import TransactionDetails, { TransactionDetailsAttributes } from '../../models/transaction-details';
import Transfer, { TransferAttributes } from '../../models/transfer';
import { addCoinbaseTransactions } from './coinbase';
import { processPairCreationEvents } from './pair';
import { getCoinTransfers, getNftTransfers } from './transfers';

const TRANSACTION_INDEX = 0;
const RECEIPT_INDEX = 1;

interface BalanceInsertResult {
  id: number;
  chainId: number;
  account: string;
  module: string;
}

export async function processPayloadKey(
  block: BlockAttributes,
  payloadData: any,
  tx?: Transaction,
): Promise<EventAttributes[]> {
  const transactions = payloadData.transactions || [];

  const transactionPromises = transactions.map((transactionInfo: any) => {
    return processTransaction(transactionInfo, block, tx);
  });
  const normalTransactions = (await Promise.all(transactionPromises)).flat();

  const coinbase = await addCoinbaseTransactions([block], tx!);
  const coinbaseTransactions = (await Promise.all(coinbase)).flat();

  return [...normalTransactions, ...coinbaseTransactions];
}

export async function processTransaction(
  transactionArray: any,
  block: BlockAttributes,
  tx?: Transaction,
): Promise<EventAttributes[]> {
  const transactionInfo = transactionArray[TRANSACTION_INDEX];
  const receiptInfo = transactionArray[RECEIPT_INDEX];

  let sigsData = transactionInfo.sigs;
  let cmdData: any;
  try {
    cmdData = JSON.parse(transactionInfo.cmd);
  } catch (error) {
    console.error(`[ERROR][DATA][DATA_FORMAT] Failed to parse transaction command JSON: ${error}`);
    throw error;
  }

  let nonce = (cmdData.nonce || '').replace(/\\"/g, '');
  nonce = nonce.replace(/"/g, '');
  const eventsData = receiptInfo.events || [];
  const transactionAttributes = {
    blockId: block.id,
    chainId: cmdData.meta.chainId,
    creationtime: cmdData.meta.creationTime.toString(),
    hash: transactionInfo.hash,
    result: receiptInfo.result || null,
    logs: receiptInfo.logs || null,
    num_events: eventsData ? eventsData.length : 0,
    requestkey: receiptInfo.reqKey,
    sender: cmdData?.meta?.sender || null,
    txid: receiptInfo.txId ? receiptInfo.txId.toString() : null,
  } as TransactionAttributes;

  const transactionDetailsAttributes = {
    code: cmdData.payload.exec ? cmdData.payload?.exec?.code : {},
    data: cmdData.payload.exec ? cmdData.payload?.exec?.data : {},
    gas: receiptInfo.gas,
    gaslimit: cmdData.meta.gasLimit,
    gasprice: cmdData.meta.gasPrice,
    nonce,
    pactid: receiptInfo.continuation?.pactId || null,
    continuation: receiptInfo.continuation || {},
    rollback: receiptInfo.result ? receiptInfo.result.status != 'success' : true,
    sigs: sigsData,
    step: cmdData?.payload?.cont?.step || 0,
    proof: cmdData?.payload?.cont?.proof || null,
    ttl: cmdData.meta.ttl,
  } as TransactionDetailsAttributes;

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
      requestkey: receiptInfo.reqKey,
    } as EventAttributes;
  }) as EventAttributes[];

  const transfersCoinAttributes = await getCoinTransfers(eventsData, transactionAttributes);

  const transfersNftAttributes = await getNftTransfers(
    transactionAttributes.chainId,
    eventsData,
    transactionAttributes,
  );

  const transfersAttributes = [transfersCoinAttributes, transfersNftAttributes]
    .flat()
    .filter(transfer => transfer.amount !== undefined);

  try {
    const { id: transactionId } = await TransactionModel.create(transactionAttributes, {
      transaction: tx,
    });

    await TransactionDetails.create(
      {
        ...transactionDetailsAttributes,
        transactionId,
      },
      {
        transaction: tx,
      },
    );

    const eventsWithTransactionId = await Promise.all(eventsAttributes);
    await Event.bulkCreate(eventsWithTransactionId, { transaction: tx });

    // Process pair creation events
    await processPairCreationEvents(eventsWithTransactionId);

    const signers = (cmdData.signers ?? []).map((signer: any, index: number) => ({
      address: signer.address,
      orderIndex: index,
      pubkey: signer.pubKey,
      clist: signer.clist,
      scheme: signer.scheme,
      transactionId,
    }));
    await Signer.bulkCreate(signers, { transaction: tx });

    const transfersWithTransactionId = transfersAttributes.map(transfer => ({
      ...transfer,
      transactionId,
    })) as TransferAttributes[];
    await Transfer.bulkCreate(transfersWithTransactionId, {
      transaction: tx,
    });

    const balancesFrom = transfersAttributes
      .filter(t => t.from_acct !== '')
      .map(t => ({
        account: t.from_acct,
        chainId: t.chainId,
        module: t.modulename,
        hasTokenId: t.hasTokenId,
        tokenId: t.tokenId ?? '', // Normalize tokenId
      }));

    const balancesTo = transfersAttributes
      .filter(t => t.to_acct !== '')
      .map(t => ({
        account: t.to_acct,
        chainId: t.chainId,
        module: t.modulename,
        hasTokenId: t.hasTokenId,
        tokenId: t.tokenId ?? '', // Normalize tokenId
      }));

    const balances = [...balancesFrom, ...balancesTo];

    const values = balances
      .map(
        balance =>
          `(${balance.chainId}, '${balance.account}', '${balance.module}', '${balance.tokenId}', ${balance.hasTokenId}, NOW(), NOW())`,
      )
      .join(', ');

    const newBalancesQuery = `
      INSERT INTO "Balances" ("chainId", account, module, "tokenId", "hasTokenId", "createdAt", "updatedAt")
      VALUES ${values}
      ON CONFLICT ("chainId", account, module, "tokenId") DO NOTHING
    `;

    await sequelize.query(newBalancesQuery, {
      transaction: tx,
    });

    return eventsWithTransactionId;
  } catch (error) {
    console.error('Error processing transaction:', error);
    throw error;
  }
}

export async function getGuardsFromBalances(balances: BalanceInsertResult[]) {
  const guardPromises: Array<Promise<any | null>> = balances.map(async balance => {
    const res = await handleSingleQuery({
      chainId: balance.chainId.toString(),
      code: `(${balance.module}.details \"${balance.account}\")`,
    });

    if (res.status !== 'success' || !res.result) return null;

    const result = JSON.parse(res.result ?? '{}');
    const keys = result?.guard?.keys ?? [];
    const pred = result?.guard?.pred;
    if (!keys?.length || !pred) return null;

    const withKeys = keys.map((key: any) => ({
      balanceId: balance.id,
      account: balance.account,
      publicKey: key,
      predicate: pred,
    }));

    return withKeys;
  });

  const guards = await Promise.all(guardPromises);
  const filteredGuards = guards
    .flat()
    .filter(g => g !== null && `k:${g.publicKey}` !== g.account)
    .map(g => ({
      balanceId: g.balanceId,
      publicKey: g.publicKey,
      predicate: g.predicate,
    }));

  return filteredGuards;
}
