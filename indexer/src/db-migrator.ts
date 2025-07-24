import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '@/config/database';
import { execSync } from 'child_process';
import { QueryTypes } from 'sequelize';

export default async function migrate() {
  const isCreated = await isDatabaseAlreadyCreated();

  if (!isCreated) {
    await createDatabase();
  }

  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
}

async function isDatabaseAlreadyCreated() {
  const [row] = await sequelize.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1 FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'SequelizeMeta' AND n.nspname = 'public'
      )
    `,
    { type: QueryTypes.SELECT },
  );

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
    'StreamingErrors',
    'Transactions',
    'Transfers',
  ];

  // Get all models
  const models = Object.values(sequelize.models);

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
