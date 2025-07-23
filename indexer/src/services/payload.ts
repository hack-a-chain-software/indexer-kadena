/**
 * Blockchain Payload Processing Service
 *
 * This module is responsible for processing the payload data from blockchain blocks.
 * It handles the extraction, transformation, and storage of transaction data, events,
 * transfers, signers, and balances from the blockchain into the database.
 *
 * The module provides core functionality for:
 * 1. Processing transaction data from blocks
 * 2. Extracting events from transactions
 * 3. Processing token transfers (both fungible and non-fungible)
 * 4. Storing transaction details and related entities
 * 5. Managing balance records for accounts
 * 6. Extracting guard information for security validation
 */

import { BlockAttributes } from '@/models/block';
import TransactionModel, { TransactionAttributes } from '@/models/transaction';
import Event, { EventAttributes } from '@/models/event';
import Transfer, { TransferAttributes } from '@/models/transfer';
import { getNftTransfers, getCoinTransfers } from './transfers';
import { Transaction } from 'sequelize';
import Signer from '@/models/signer';
import Guard from '@/models/guard';
import { handleSingleQuery } from '@/utils/raw-query';
import { sequelize } from '@/config/database';
import { addCoinbaseTransactions } from './coinbase';
import { getRequiredEnvString } from '@/utils/helpers';
import TransactionDetails, { TransactionDetailsAttributes } from '@/models/transaction-details';
import { mapToEventModel } from '@/models/mappers/event-mapper';
import { processPairCreationEvents } from './pair';
import { Decimal } from 'decimal.js';

// Constants for array indices in the transaction data structure
const TRANSACTION_INDEX = 0;
const RECEIPT_INDEX = 1;

/**
 * Interface representing the result of a balance insert operation.
 * Used to track inserted balances for subsequent guard extraction.
 */
interface BalanceInsertResult {
  id: number;
  chainId: number;
  account: string;
  module: string;
}

/**
 * Processes all transactions in a block's payload.
 *
 * This function serves as the main entry point for processing all transaction data
 * contained within a block. It handles both regular transactions and coinbase transactions
 * (mining rewards).
 *
 * The function:
 * 1. Processes each regular transaction in the payload
 * 2. Processes coinbase transactions for mining rewards
 * 3. Combines all event data for further processing
 *
 * @param block - The block attributes containing metadata about the block
 * @param payloadData - The payload data containing all transactions in the block
 * @param tx - Optional Sequelize transaction for atomic operations
 * @returns Promise resolving to an array of event attributes extracted from all transactions
 *
 * TODO: [OPTIMIZATION] Consider implementing batch processing for blocks with many transactions
 * to reduce database load.
 */
export async function processPayloadKey(
  block: BlockAttributes,
  payloadData: any,
  tx?: Transaction,
): Promise<EventAttributes[]> {
  const transactions = payloadData.transactions || [];

  // Process all regular transactions in parallel
  const transactionPromises = transactions.map((transactionInfo: any) => {
    return processTransaction(transactionInfo, block, tx);
  });
  const normalTransactions = (await Promise.all(transactionPromises)).flat();

  // Process coinbase transactions (mining rewards)
  const coinbase = await addCoinbaseTransactions([block], tx!);
  const coinbaseTransactions = (await Promise.all(coinbase)).flat();

  // Combine all events from both transaction types
  return [...normalTransactions, ...coinbaseTransactions];
}

/**
 * Processes a single transaction and stores it in the database.
 *
 * This function handles the detailed processing of a transaction and its related data:
 * 1. Extracts transaction information and metadata
 * 2. Processes transaction events
 * 3. Extracts and processes transfers (both fungible and non-fungible tokens)
 * 4. Stores transaction data, events, signers, and transfers in the database
 * 5. Updates account balances based on transfer information
 *
 * @param transactionArray - Array containing transaction data and receipt
 * @param block - The block attributes containing the block this transaction belongs to
 * @param tx - Optional Sequelize transaction for atomic operations
 * @returns Promise resolving to an array of event attributes extracted from the transaction
 *
 * TODO: [OPTIMIZATION] The balance insert operation uses a raw SQL query which could potentially
 * be vulnerable to SQL injection. Consider using parameterized queries or ORM methods.
 */
export async function processTransaction(
  transactionArray: any,
  block: BlockAttributes,
  tx?: Transaction,
): Promise<EventAttributes[]> {
  const transactionInfo = transactionArray[TRANSACTION_INDEX];
  const receiptInfo = transactionArray[RECEIPT_INDEX];

  // Extract signature data
  let sigsData = transactionInfo.sigs;

  // Parse the command data
  let cmdData: any;
  try {
    cmdData = JSON.parse(transactionInfo.cmd);
  } catch (error) {
    console.error(`[ERROR][DATA][DATA_FORMAT] Failed to parse transaction command JSON: ${error}`);
    throw error;
  }

  // Clean up nonce value
  let nonce = (cmdData.nonce || '').replace(/\\"/g, '');
  nonce = nonce.replace(/"/g, '');

  // Extract events data
  const eventsData = (receiptInfo.events || []).map((event: any, index: number) => ({
    ...event,
    orderIndex: index,
  }));

  // Create transaction attributes object for database storage
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

  // Create transaction details attributes for extended information
  const transactionDetailsAttributes = {
    code: cmdData.payload.exec ? cmdData.payload?.exec?.code : {},
    data: cmdData.payload.exec ? cmdData.payload?.exec?.data : {},
    gas: receiptInfo.gas,
    gaslimit: cmdData.meta.gasLimit,
    gasprice: new Decimal(cmdData.meta.gasPrice).toFixed(),
    nonce,
    pactid: receiptInfo.continuation?.pactId || null,
    continuation: receiptInfo.continuation || {},
    rollback: receiptInfo.result ? receiptInfo.result.status != 'success' : true,
    sigs: sigsData,
    step: cmdData?.payload?.cont?.step || 0,
    proof: cmdData?.payload?.cont?.proof || null,
    ttl: cmdData.meta.ttl,
  } as TransactionDetailsAttributes;

  const eventsAttributes = mapToEventModel(eventsData, transactionAttributes);

  // Process transfers for both fungible and non-fungible tokens
  const transfersCoinAttributes = await getCoinTransfers(eventsData, transactionAttributes);
  const transfersNftAttributes = await getNftTransfers(
    transactionAttributes.chainId,
    eventsData,
    transactionAttributes,
  );

  // Combine all transfers and filter out invalid ones
  const transfersAttributes = [transfersCoinAttributes, transfersNftAttributes]
    .flat()
    .filter(transfer => transfer.amount !== undefined);

  try {
    // Store transaction in database
    const { id: transactionId } = await TransactionModel.create(transactionAttributes, {
      transaction: tx,
    });

    // Store transaction details
    await TransactionDetails.create(
      {
        ...transactionDetailsAttributes,
        transactionId,
      },
      {
        transaction: tx,
      },
    );

    const events = await Promise.all(eventsAttributes);
    // Note: Should not summit debug to the 'main' branch
    // const swapEvents = events.filter(event => event.name === 'SWAP');
    // console.log('swapEvents', JSON.stringify(swapEvents, null, 2));
    // const addLiquidityEvents = events.filter(event => event.name === 'ADD_LIQUIDITY');
    // console.log('addLiquidityEvents', JSON.stringify(addLiquidityEvents, null, 2));
    // const mintEvents = events.filter(event => event.name === 'MINT_EVENT');
    // console.log('mintEvents', JSON.stringify(mintEvents, null, 2));
    // console.log('------------------------------------- end -------------------------------');
    const eventsWithTransactionId = events.map(event => ({
      ...event,
      transactionId,
    }));
    await Event.bulkCreate(eventsWithTransactionId, { transaction: tx });

    // Process pair creation events
    try {
      await processPairCreationEvents(eventsWithTransactionId, tx);
    } catch (error) {
      console.error('Error processing pair creation events:', error);
    }

    const signers = (cmdData.signers ?? []).map((signer: any, index: number) => ({
      address: signer.address,
      orderIndex: index,
      pubkey: signer.pubKey,
      clist: signer.clist,
      scheme: signer.scheme,
      transactionId,
    }));
    await Signer.bulkCreate(signers, { transaction: tx });

    // Store transfers with reference to the transaction
    const transfersWithTransactionId = transfersAttributes.map(transfer => ({
      ...transfer,
      transactionId,
    })) as TransferAttributes[];
    await Transfer.bulkCreate(transfersWithTransactionId, {
      transaction: tx,
    });

    // Extract accounts from transfers for balance tracking
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

    const marmaladeEvents = eventsWithTransactionId.filter(
      event =>
        (event.name === 'MINT' || event.name === 'TRANSFER') &&
        (event.module === 'marmalade-v2.ledger' || event.module === 'marmalade.ledger'),
    );

    const marmaladeBalances = marmaladeEvents
      .map(event => {
        let account;
        const eventParams = event.params as any[];
        const tokenId = eventParams[0] as string;

        if (event.name === 'MINT') {
          account = eventParams[1] as string;
        } else {
          // TRANSFER
          account = eventParams[2] as string;
        }

        if (account && tokenId) {
          return {
            account,
            chainId: event.chainId,
            module: event.module,
            hasTokenId: true,
            tokenId: tokenId,
          };
        }
        return null;
      })
      .filter((b): b is Exclude<typeof b, null> => b !== null);

    // Combine all balances for upsert operation
    const balances = [...balancesFrom, ...balancesTo, ...marmaladeBalances];

    if (balances.length === 0) {
      return eventsWithTransactionId;
    }

    // Create values string for SQL insert
    const values = balances
      .map(
        balance =>
          `(${balance.chainId}, '${balance.account}', '${balance.module}', '${balance.tokenId}', ${balance.hasTokenId}, NOW(), NOW())`,
      )
      .join(', ');

    // Insert balances using raw SQL for efficiency
    // TODO: [OPTIMIZATION] Consider using parameterized queries to prevent SQL injection
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
    console.error(
      `[ERROR][DB][DATA_CORRUPT] Failed to save transaction ${transactionInfo.hash}: ${error}`,
    );
    throw error;
  }
}

/**
 * Retrieves guard information for a set of account balances.
 *
 * This function queries the blockchain for guard details associated with
 * each account balance. Guards are security mechanisms in Kadena that control
 * access to accounts.
 *
 * The function:
 * 1. Queries the blockchain for guard details for each balance
 * 2. Extracts public keys and predicates from the guard information
 * 3. Filters out invalid guards or self-referential guards
 * 4. Returns the processed guard data
 *
 * @param balances - Array of balance insert results to retrieve guards for
 * @returns Promise resolving to an array of guard information
 *
 * TODO: [OPTIMIZATION] Consider implementing batch queries to the blockchain
 * instead of making individual queries for each balance.
 */
export async function getGuardsFromBalances(balances: BalanceInsertResult[]) {
  // Query guard details for each balance in parallel
  const guardPromises: Array<Promise<any | null>> = balances.map(async balance => {
    const res = await handleSingleQuery({
      chainId: balance.chainId.toString(),
      code: `(${balance.module}.details \"${balance.account}\")`,
    });

    if (res.status !== 'success' || !res.result) return null;

    // Parse the result and extract guard information
    const result = JSON.parse(res.result ?? '{}');
    const keys = result?.guard?.keys ?? [];
    const pred = result?.guard?.pred;
    if (!keys?.length || !pred) return null;

    // Map keys to guard objects
    const withKeys = keys.map((key: any) => ({
      balanceId: balance.id,
      account: balance.account,
      publicKey: key,
      predicate: pred,
    }));

    return withKeys;
  });

  // Wait for all guard queries to complete
  const guards = await Promise.all(guardPromises);

  // Filter and format guards for storage
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
