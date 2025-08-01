import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

import { QueryTypes } from 'sequelize';

import { execSync } from 'child_process';
import { sequelize } from '@/config/database';

const migrationsDir = path.resolve(__dirname, '..', '..', 'migrations');

export default async function migrate() {
  const isCreated = await isDatabaseAlreadyCreated();
  if (!isCreated) {
    execSync('npx sequelize-cli db:migrate', {
      stdio: 'inherit',
    });
    return;
  }

  // Temporarily disable specific migrations for databases already in production
  // The initial project was created using sequelize.sync()
  // This is a workaround to avoid creating tables that already exist
  const skip = [
    '20241105002409-enable-pg-trgm-and-btree-gin.js',
    '20241105002410-add-blocks-table.js',
    '20241105002411-add-transactions-table.js',
    '20241105002412-add-signers-table.js',
    '20241105002413-add-events-table.js',
    '20241105002414-add-transfers-table.js',
    '20241105002415-add-contracts-table.js',
    '20241105002416-add-balances-table.js',
    '20241105002417-add-guards-table.js',
    '20241105002418-add-streaming-errors-table.js',
  ];

  // Temporarily disable migrations
  for (const file of skip) {
    fs.renameSync(path.join(migrationsDir, file), path.join(migrationsDir, `${file}.disabled`));
  }

  // Run migrations
  execSync('npx sequelize-cli db:migrate', {
    stdio: 'inherit',
  });

  // Re-enable migrations
  for (const file of skip) {
    fs.renameSync(path.join(migrationsDir, `${file}.disabled`), path.join(migrationsDir, file));
  }
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

migrate();
