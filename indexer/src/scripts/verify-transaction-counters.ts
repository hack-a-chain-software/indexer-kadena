import dotenv from 'dotenv';
// Load environment variables from .env file
console.info('[INFO][INFRA][INFRA_CONFIG] Loading environment variables...');
dotenv.config();

import { sequelize } from '@/config/database';
import { QueryTypes } from 'sequelize';

async function verifyCounters(blockHash?: string) {
  try {
    // Get counters based on block hash or all counters
    const counters = await sequelize.query<{
      id: number;
      sender: string;
      chainId: number;
      module: string;
      counter: number;
    }>(
      blockHash
        ? `
          SELECT DISTINCT tc.* 
          FROM "TransactionCounters" tc
          JOIN "Transactions" t ON t.sender = tc.sender AND t."chainId" = tc."chainId"
          JOIN "Events" e ON e."transactionId" = t.id AND e.module = tc.module
          JOIN "Blocks" b ON t."blockId" = b.id
          WHERE b.hash = $1
          ORDER BY tc.counter DESC
        `
        : `SELECT * FROM "TransactionCounters" ORDER BY counter DESC`,
      {
        bind: blockHash ? [blockHash] : undefined,
        type: QueryTypes.SELECT,
      },
    );

    console.log(`Found ${counters.length} counter entries to verify.`);

    // For each counter, compute the actual count from events (canonical - non-canonical)
    let mismatches = 0;
    for (const counter of counters) {
      const [counts] = await sequelize.query<{
        canonical_count: string;
        noncanonical_count: string;
      }>(
        `
        SELECT 
          (
            SELECT COUNT(*)::int
            FROM "Events" e
            JOIN "Transactions" t ON e."transactionId" = t.id
            JOIN "Blocks" b ON t."blockId" = b.id
            WHERE t.sender = $1
              AND t."chainId" = $2
              AND e.module = $3
              AND b.canonical = true
              AND t.sender != 'coinbase'
          ) as canonical_count,
          (
            SELECT COUNT(*)::int
            FROM "Events" e
            JOIN "Transactions" t ON e."transactionId" = t.id
            JOIN "Blocks" b ON t."blockId" = b.id
            WHERE t.sender = $1
              AND t."chainId" = $2
              AND e.module = $3
              AND b.canonical = false
              AND t.sender != 'coinbase'
          ) as noncanonical_count
        `,
        {
          bind: [counter.sender, counter.chainId, counter.module],
          type: QueryTypes.SELECT,
        },
      );

      const canonicalCount = parseInt(counts.canonical_count, 10);
      const nonCanonicalCount = parseInt(counts.noncanonical_count, 10);

      if (canonicalCount !== counter.counter) {
        mismatches++;
        console.log(
          `Mismatch found for sender=${counter.sender} chainId=${counter.chainId} module=${counter.module}:`,
        );
        console.log(`  Canonical events: ${canonicalCount}`);
        console.log(`  Non-canonical events: ${nonCanonicalCount}`);
        console.log(`  Expected net (canonical - non-canonical): ${canonicalCount}`);
        console.log(`  Actual (in counter): ${counter.counter}`);
        console.log('');

        // Optional: Print a sample of transactions contributing to this count
        const [sample] = await sequelize.query<{ examples: string }>(
          `
          WITH tx_samples AS (
            (
              SELECT 
                t.id as "transactionId",
                b.id as "blockId",
                b.height,
                e.id as "eventId",
                'canonical' as type
              FROM "Events" e
              JOIN "Transactions" t ON e."transactionId" = t.id
              JOIN "Blocks" b ON t."blockId" = b.id
              WHERE t.sender = $1
                AND t."chainId" = $2
                AND e.module = $3
                AND b.canonical = true
                AND t.sender != 'coinbase'
              LIMIT 2
            )
            UNION ALL
            (
              SELECT 
                t.id as "transactionId",
                b.id as "blockId",
                b.height,
                e.id as "eventId",
                'non-canonical' as type
              FROM "Events" e
              JOIN "Transactions" t ON e."transactionId" = t.id
              JOIN "Blocks" b ON t."blockId" = b.id
              WHERE t.sender = $1
                AND t."chainId" = $2
                AND e.module = $3
                AND b.canonical = false
                AND t.sender != 'coinbase'
              LIMIT 2
            )
          )
          SELECT json_agg(tx_samples) as examples
          FROM tx_samples
          `,
          {
            bind: [counter.sender, counter.chainId, counter.module],
            type: QueryTypes.SELECT,
          },
        );

        // if (sample?.examples) {
        //   console.log('Sample transactions:');
        //   console.log(JSON.stringify(JSON.parse(sample.examples), null, 2));
        //   console.log('');
        // }
      }
    }

    console.log(`\nVerification complete:`);
    console.log(`- Total counters checked: ${counters.length}`);
    console.log(`- Mismatches found: ${mismatches}`);
    if (mismatches === 0) {
      console.log('✅ All counters are correct!');
    }
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await sequelize.close();
  }
}

// Get block hash from command line argument
const blockHash = process.argv[2];
if (blockHash) {
  console.log(`Verifying counters for block with hash: ${blockHash}`);
}
verifyCounters(blockHash);
