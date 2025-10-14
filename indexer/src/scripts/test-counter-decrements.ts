import dotenv from 'dotenv';
// Load environment variables from .env file
console.info('[INFO][INFRA][INFRA_CONFIG] Loading environment variables...');
dotenv.config();

import { sequelize } from '@/config/database';
import Block, { BlockAttributes } from '@/models/block';
import Event, { EventAttributes } from '@/models/event';
import Transaction, { TransactionAttributes } from '@/models/transaction';
import { TransactionCounter } from '@/models/transaction-counter';
import { defineCanonicalBaseline } from '@/services/define-canonical';
import { QueryTypes } from 'sequelize';

async function setupTestData() {
  // console.log('[TEST] Starting test data setup...');

  // const tx = await sequelize.transaction();
  // let newBlock: any = null;
  // let counterRecords: any = [];
  // try {
  //   // Find a good source block with transactions
  //   const [sourceBlock] = await sequelize.query<BlockAttributes>(
  //     `SELECT * FROM "Blocks"
  //     WHERE hash = 'AFOLKLLRyaysEGx4E9tABM-bAjYgGXZIZk5y2z1OFWU'
  //     AND canonical = true
  //     LIMIT 1`,
  //     { type: QueryTypes.SELECT, transaction: tx },
  //   );

  //   if (!sourceBlock) {
  //     throw new Error('No suitable source block found');
  //   }

  //   console.log(
  //     `[TEST] Found source block at height ${sourceBlock.height} with ${sourceBlock.transactionsCount} transactions`,
  //   );

  //   // Get all transactions for this block
  //   const sourceTransactions = await sequelize.query<{
  //     id: number;
  //     hash: string;
  //     sender: string;
  //     chainId: number;
  //     createdAt: Date;
  //   }>(`SELECT * FROM "Transactions" WHERE "blockId" = $1`, {
  //     bind: [sourceBlock.id],
  //     type: QueryTypes.SELECT,
  //   });

  //   // Get all events for these transactions
  //   const sourceEvents = await sequelize.query<{
  //     id: number;
  //     transactionId: number;
  //     module: string;
  //     name: string;
  //     params: any;
  //     createdAt: Date;
  //   }>(
  //     `SELECT e.* FROM "Events" e
  //     JOIN "Transactions" t ON e."transactionId" = t.id
  //     WHERE t."blockId" = $1`,
  //     { bind: [sourceBlock.id], type: QueryTypes.SELECT, transaction: tx },
  //   );

  //   console.log(
  //     `[TEST] Found ${sourceTransactions.length} transactions and ${sourceEvents.length} events`,
  //   );

  //   // Create new block with hash="test"
  //   const { id, ...all } = sourceBlock;
  //   const newBlock = await Block.create(
  //     {
  //       ...all,
  //       hash: 'test',
  //       canonical: false, // Will be set to true by defineCanonicalBaseline
  //     } as BlockAttributes,
  //     { transaction: tx },
  //   );

  //   console.log(`[TEST] Created new block with id ${newBlock.id}`);

  //   // Create new transactions linked to new block
  //   const newTransactions = await Transaction.bulkCreate(
  //     sourceTransactions.map(
  //       t =>
  //         ({
  //           hash: `${t.hash}-test`,
  //           sender: t.sender,
  //           chainId: t.chainId,
  //           blockId: newBlock.id,
  //           creationtime: Math.floor(Date.now() / 1000).toString(),
  //           result: { status: 'success', data: 'Write succeeded' },
  //           logs: '0',
  //           num_events: 1,
  //           requestkey: `${t.hash}-test`,
  //           txid: `${t.hash}-test`,
  //           canonical: false,
  //         }) as TransactionAttributes,
  //     ),
  //     { transaction: tx },
  //   );

  //   console.log(`[TEST] Created ${newTransactions.length} new transactions`);

  //   // Create transaction ID mapping for events
  //   const txIdMap = new Map(
  //     sourceTransactions.map((oldTx, idx) => [oldTx.id, newTransactions[idx].id]),
  //   );

  //   // Create new events linked to new transactions
  //   const newEvents = await Event.bulkCreate(
  //     sourceEvents.map(
  //       e =>
  //         ({
  //           transactionId: txIdMap.get(e.transactionId),
  //           module: e.module,
  //           name: e.name || 'TRANSFER',
  //           params: e.params || [],
  //           chainId: sourceBlock.chainId,
  //           qualname: e.module,
  //           requestkey: `${e.transactionId}-test`,
  //           orderIndex: 0,
  //           creationtime: Math.floor(Date.now() / 1000).toString(),
  //         }) as EventAttributes,
  //     ),
  //     { transaction: tx },
  //   );

  //   console.log(`[TEST] Created ${newEvents.length} new events`);

  //   // Get unique sender/chainId/module combinations
  //   const combinations = new Set<string>();
  //   for (const tx of sourceTransactions) {
  //     const txEvents = sourceEvents.filter(e => e.transactionId === tx.id);
  //     for (const event of txEvents) {
  //       combinations.add(`${tx.sender}|${tx.chainId}|${event.module}`);
  //     }
  //   }

  //   // Create counter records with counter=100
  //   const counterRecords = Array.from(combinations).map(combo => {
  //     const [sender, chainId, module] = combo.split('|');
  //     return {
  //       sender,
  //       chainId: parseInt(chainId, 10),
  //       module,
  //       counter: 100,
  //     };
  //   });

  //   // First delete any existing records for these combinations
  //   for (const record of counterRecords) {
  //     await TransactionCounter.destroy({
  //       where: {
  //         sender: record.sender,
  //         chainId: record.chainId,
  //         module: record.module,
  //       },
  //       transaction: tx,
  //     });
  //   }

  //   // Then create new records with counter=100
  //   await TransactionCounter.bulkCreate(counterRecords, { transaction: tx });

  //   console.log(`[TEST] Created ${counterRecords.length} counter records with value 100`);

  //   // Show counter combinations for verification
  //   console.log('\n[TEST] Created counter records for:');
  //   for (const record of counterRecords) {
  //     console.log(`  ${record.sender}|${record.chainId}|${record.module}: 100`);
  //   }

  //   console.log('\n[TEST] Setup complete. Running defineCanonicalBaseline("test")...\n');
  //   await tx.commit();
  // } catch (error) {
  //   await tx.rollback();
  //   console.error('[ERROR] Test failed:', error);
  //   throw error;
  // }

  // Run the canonical baseline function
  await defineCanonicalBaseline('test', 1069);

  // // Show final counter values
  // console.log('\n[TEST] Final counter values:');
  // for (const record of counterRecords) {
  //   const counter = await TransactionCounter.findOne({
  //     where: {
  //       sender: record.sender,
  //       chainId: record.chainId,
  //       module: record.module,
  //     },
  //     transaction: tx,
  //   });
  //   console.log(
  //     `  ${record.sender}|${record.chainId}|${record.module}: ${counter?.counter ?? 'not found'}`,
  //   );
  // }

  console.log('\n[TEST] Test complete!');
}

// Run if called directly
if (require.main === module) {
  setupTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
