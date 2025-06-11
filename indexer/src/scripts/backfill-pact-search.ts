#!/usr/bin/env npx ts-node

// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from indexer directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import PactBackfillService from '../services/pact-backfill';

function parseArgs(args: string[]) {
  let batchSize = 100;
  let startBlockHeight: number | undefined;
  let endBlockHeight: number | undefined;
  let chainId: number | undefined;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--batch-size':
        if (nextArg) {
          const parsed = parseInt(nextArg);
          if (!isNaN(parsed) && parsed > 0) {
            batchSize = parsed;
          }
          i++;
        }
        break;
      case '--start-block':
        if (nextArg) {
          const parsed = parseInt(nextArg);
          if (!isNaN(parsed) && parsed >= 0) {
            startBlockHeight = parsed;
          }
          i++;
        }
        break;
      case '--end-block':
        if (nextArg) {
          const parsed = parseInt(nextArg);
          if (!isNaN(parsed) && parsed >= 0) {
            endBlockHeight = parsed;
          }
          i++;
        }
        break;
      case '--chain-id':
        if (nextArg) {
          const parsed = parseInt(nextArg);
          if (!isNaN(parsed) && parsed >= 0) {
            chainId = parsed;
          }
          i++;
        }
        break;
    }
  }

  return { batchSize, startBlockHeight, endBlockHeight, chainId };
}

async function main() {
  console.info('🚀 Starting Pact Code Search Backfill Process');

  // Parse command line arguments
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.info(`
Usage: npx ts-node src/scripts/backfill-pact-search.ts [options]

Options:
  --batch-size <number>    Set batch size for processing (default: 100)
  --start-block <number>   Start from specific block height (processes newer blocks first)
  --end-block <number>     End at specific block height
  --chain-id <number>      Process only specific chain ID (0-19)
  --help, -h              Show this help message

Examples:
  # Process all records
  npx ts-node src/scripts/backfill-pact-search.ts

  # Process only blocks 5000000-6000000
  npx ts-node src/scripts/backfill-pact-search.ts --start-block 5000000 --end-block 6000000

  # Process only chain 0 with larger batches
  npx ts-node src/scripts/backfill-pact-search.ts --chain-id 0 --batch-size 500

  # Process recent blocks first (from block 5000000 onwards)
  npx ts-node src/scripts/backfill-pact-search.ts --start-block 5000000
    `);
    process.exit(0);
  }

  const { batchSize, startBlockHeight, endBlockHeight, chainId } = parseArgs(args);

  console.info(`📦 Batch size: ${batchSize}`);
  if (startBlockHeight !== undefined) console.info(`🔢 Start block: ${startBlockHeight}`);
  if (endBlockHeight !== undefined) console.info(`🔢 End block: ${endBlockHeight}`);
  if (chainId !== undefined) console.info(`⛓️  Chain ID: ${chainId}`);
  console.info('⏰ This process may take several hours for large datasets...\n');

  try {
    const backfillService = new PactBackfillService(batchSize, {
      startBlockHeight,
      endBlockHeight,
      chainId,
    });
    const stats = await backfillService.startBackfill();

    console.info('\n🎉 Backfill completed successfully!');
    console.info('📊 Final Statistics:');
    console.info(`   • Records processed: ${stats.processedRecords.toLocaleString()}`);
    console.info(`   • Args extracted: ${stats.extractedArgsCount.toLocaleString()}`);
    console.info(`   • Errors: ${stats.errorCount}`);
    console.info(
      `   • Duration: ${((stats.endTime!.getTime() - stats.startTime.getTime()) / 1000 / 60).toFixed(1)} minutes`,
    );

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Backfill failed:', error);
    process.exit(1);
  }
}

// Handle process interruption gracefully
process.on('SIGINT', () => {
  console.info('\n⚠️  Process interrupted by user');
  console.info('💡 You can resume the backfill later - it will skip already processed records');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.info('\n⚠️  Process terminated');
  process.exit(0);
});

if (require.main === module) {
  main();
}
