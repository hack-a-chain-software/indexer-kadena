'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable pg_trgm extension for efficient LIKE queries with wildcards
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    // Create GIN index with trigram operators for LIKE '%pattern%' queries
    // This optimizes: WHERE td.code::text LIKE '%coin.transfer%'
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_transactiondetails_code_trgm 
      ON "TransactionDetails" USING GIN ((code::text) gin_trgm_ops);
    `);

    // Additional optimization: Create index for JOIN conditions to support the multi-table query
    await queryInterface.addIndex('TransactionDetails', ['transactionId'], {
      name: 'idx_transactiondetails_transaction_id',
      fields: ['transactionId'],
    });

    await queryInterface.addIndex('Transfers', ['transactionId'], {
      name: 'idx_transfers_transaction_id',
      fields: ['transactionId'],
    });

    // Create index for ORDER BY clause optimization
    await queryInterface.addIndex('Transactions', ['creationtime'], {
      name: 'idx_transactions_creationtime_desc',
      fields: [
        {
          name: 'creationtime',
          order: 'DESC',
        },
      ],
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Rollback performance optimizations
     */

    // Remove indexes in reverse order
    await queryInterface.removeIndex('Transactions', 'idx_transactions_creationtime_desc');
    await queryInterface.removeIndex('Transfers', 'idx_transfers_transaction_id');
    await queryInterface.removeIndex('TransactionDetails', 'idx_transactiondetails_transaction_id');

    // Remove trigram index
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_transactiondetails_code_trgm;');

    // Note: We don't remove the pg_trgm extension as it might be used by other parts of the system
    // If you specifically need to remove it, uncomment the line below:
    // await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS pg_trgm;');
  },
};
