'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('Transfers', 'to_acct_idx');
    await queryInterface.removeIndex('Transfers', 'from_acct_idx');

    await queryInterface.removeIndex('Transfers', 'transfers_from_acct_creationtime_id_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_to_acct_creationtime_id_idx');
  },

  async down(queryInterface) {
    await queryInterface.addIndex('Transfers', ['from_acct', 'creationtime', 'id'], {
      name: 'transfers_from_acct_creationtime_id_idx',
    });
    await queryInterface.addIndex('Transfers', ['to_acct', 'creationtime', 'id'], {
      name: 'transfers_to_acct_creationtime_id_idx',
    });

    await queryInterface.addIndex('Transfers', ['to_acct'], {
      name: 'to_acct_idx',
    });
    await queryInterface.addIndex('Transfers', ['from_acct'], {
      name: 'from_acct_idx',
    });
  },
};
