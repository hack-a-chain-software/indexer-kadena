import dotenv from 'dotenv';
dotenv.config();

import { QueryTypes, Sequelize } from 'sequelize';
const { sequelizeConfig } = require('./database');
export const sequelize = new Sequelize(sequelizeConfig);

// Import models to allow initialization using sync()
import '@/models/signer';
import '@/models/balance';
import '@/models/block';
import '@/models/contract';
import '@/models/event';
import '@/models/guard';
import '@/models/transfer';
import '@/models/transaction';

import { execSync } from 'child_process';

export default async function migrate() {
  const isCreated = await isDatabaseAlreadyCreated();

  if (!isCreated) {
    await createDatabase();
  }

  execSync('npx sequelize-cli db:migrate', {
    stdio: 'inherit',
  });
  process.exit(0);
}

async function isDatabaseAlreadyCreated() {
  const [row] = await sequelize.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'Blocks' AND n.nspname = 'public'
      )
    `,
    { type: QueryTypes.SELECT },
  );

  // Since Blocks is the first table to be created
  // We can use it to check if the database is already created.
  return row?.exists;
}

async function createDatabase() {
  await sequelize.query(`
    CREATE EXTENSION pg_trgm;
    CREATE EXTENSION btree_gin;
  `);

  // Only sync specific tables that don't have migrations
  const tablesToSync = [
    'Balances',
    'Blocks',
    'Contracts',
    'Events',
    'Guards',
    'Signers',
    'Transactions',
    'Transfers',
  ];

  // Get all models
  const models: any = Object.values(sequelize.models);

  // Sync only the specified tables
  for (const model of models) {
    const tableNameObj = model.getTableName();
    const tableName =
      typeof tableNameObj === 'string'
        ? tableNameObj
        : (tableNameObj as { tableName: string }).tableName;

    if (tablesToSync.includes(tableName)) {
      try {
        await model.sync({ force: false });
      } catch (error) {
        console.warn(`[WARN][DB][INFRA_CONFIG] Could not sync table ${tableName}:`, error);
      }
    }
  }
  console.info('[INFO][DB][DATA] Database created successfully.');
}

migrate();
