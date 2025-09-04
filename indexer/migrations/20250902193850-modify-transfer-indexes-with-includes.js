'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Remove old indexes
    await queryInterface.removeIndex('Transfers', 'to_acct_idx');
    await queryInterface.removeIndex('Transfers', 'from_acct_idx');

    // Drop and recreate existing indexes with INCLUDE columns
    await queryInterface.removeIndex('Transfers', 'transfers_from_acct_creationtime_id_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_creationtime_id_idx');

    // Create new indexes with INCLUDE columns using raw SQL
    await queryInterface.sequelize.query(`
      CREATE INDEX transfers_from_acct_creationtime_id_idx ON "Transfers" USING btree (from_acct, creationtime, id) 
      INCLUDE (amount, "chainId", "transactionId", to_acct, modulename, modulehash, requestkey, "orderIndex", "tokenId")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX transfers_to_acct_creationtime_id_idx ON "Transfers" USING btree (to_acct, creationtime, id) 
      INCLUDE (amount, "chainId", "transactionId", from_acct, modulename, modulehash, requestkey, "orderIndex", "tokenId")
    `);
  },

  async down(queryInterface) {
    // Drop the new indexes
    await queryInterface.removeIndex('Transfers', 'transfers_from_acct_creationtime_id_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_creationtime_id_idx');

    // Recreate the original indexes without INCLUDE
    await queryInterface.addIndex('Transfers', ['from_acct', 'creationtime', 'id'], {
      name: 'transfers_from_acct_creationtime_id_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'creationtime', 'id'], {
      name: 'transfers_to_acct_creationtime_id_idx',
    });

    // Recreate the old simple indexes
    await queryInterface.addIndex('Transfers', ['to_acct'], {
      name: 'to_acct_idx',
    });
    await queryInterface.addIndex('Transfers', ['from_acct'], {
      name: 'from_acct_idx',
    });
  },
};
