#!/usr/bin/env npx ts-node

// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from indexer directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import PactBackfillService from '../services/pact-backfill';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function testBackfill() {
  console.info('🧪 Testing Pact Backfill with small sample');

  try {
    // First, let's check what data we have
    console.info('\n📊 Checking current data state...');

    const totalRecords = (await sequelize.query(
      `
      SELECT COUNT(*) as total 
      FROM "TransactionDetails" td
      JOIN "Transactions" t ON td."transactionId" = t.id
      WHERE td.code IS NOT NULL 
      AND td.code != '{}'::jsonb
    `,
      { type: QueryTypes.SELECT, plain: true },
    )) as any;

    console.info(`📈 Total TransactionDetails with code: ${totalRecords.total}`);

    // Check existing CodeSearch data
    const existingArgs = (await sequelize.query(
      `
      SELECT COUNT(*) as total FROM "CodeSearch"
    `,
      { type: QueryTypes.SELECT, plain: true },
    )) as any;

    const existingRelations = (await sequelize.query(
      `
      SELECT COUNT(*) as total FROM "Transaction_CodeSearch"
    `,
      { type: QueryTypes.SELECT, plain: true },
    )) as any;

    console.info(`📝 Existing CodeSearch args: ${existingArgs.total}`);
    console.info(`🔗 Existing relations: ${existingRelations.total}`);

    // Let's look at a sample of the data structure
    console.info('\n🔍 Sample data inspection:');
    const sampleData = (await sequelize.query(
      `
      SELECT t.requestkey, td.code
      FROM "TransactionDetails" td
      JOIN "Transactions" t ON td."transactionId" = t.id
      WHERE td.code IS NOT NULL 
      AND td.code != '{}'::jsonb
      LIMIT 3
    `,
      { type: QueryTypes.SELECT },
    )) as Array<{ requestkey: string; code: any }>;

    sampleData.forEach((record, index) => {
      console.info(`\nSample ${index + 1}:`);
      console.info(`  RequestKey: ${record.requestkey}`);
      console.info(`  Code type: ${typeof record.code}`);
      console.info(`  Code: ${JSON.stringify(record.code).substring(0, 200)}...`);
    });

    // Run test backfill with optimized batch size
    console.info('\n🚀 Running test backfill (batch size: 100)...');
    const testService = new PactBackfillService(100);
    const stats = await testService.startBackfill();

    console.info('\n✅ Test backfill completed!');
    console.info('📊 Results:');
    console.info(`   • Records processed: ${stats.processedRecords}`);
    console.info(`   • Args extracted: ${stats.extractedArgsCount}`);
    console.info(`   • Errors: ${stats.errorCount}`);
    console.info(
      `   • Duration: ${((stats.endTime!.getTime() - stats.startTime.getTime()) / 1000).toFixed(2)} seconds`,
    );

    // Check results
    const newArgs = (await sequelize.query(
      `
      SELECT COUNT(*) as total FROM "CodeSearch"
    `,
      { type: QueryTypes.SELECT, plain: true },
    )) as any;

    const newRelations = (await sequelize.query(
      `
      SELECT COUNT(*) as total FROM "Transaction_CodeSearch"
    `,
      { type: QueryTypes.SELECT, plain: true },
    )) as any;

    console.info(`\n📈 After backfill:`);
    console.info(`   • Total CodeSearch args: ${newArgs.total}`);
    console.info(`   • Total relations: ${newRelations.total}`);

    // Show some sample extracted args
    console.info('\n🔍 Sample extracted args:');
    const sampleArgs = (await sequelize.query(
      `
      SELECT arg FROM "CodeSearch" ORDER BY created_at DESC LIMIT 10
    `,
      { type: QueryTypes.SELECT },
    )) as Array<{ arg: string }>;

    sampleArgs.forEach(row => {
      console.info(`   • "${row.arg}"`);
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }

  console.info('\n🎉 Test completed successfully!');
  console.info('💡 If results look good, you can run the full backfill with:');
  console.info('   npx ts-node src/scripts/backfill-pact-search.ts');
}

if (require.main === module) {
  testBackfill();
}
