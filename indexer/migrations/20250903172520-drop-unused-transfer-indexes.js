'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('Transfers', 'transfers_creationtime_id_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_type_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_from_acct_modulename_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_chainid_from_acct_modulename_idx');
    await queryInterface.removeIndex('Transfers', 'transfers_chainid_to_acct_modulename_idx');
  },

  async down(queryInterface) {
    await queryInterface.addIndex('Transfers', ['creationtime', 'id'], {
      name: 'transfers_creationtime_id_idx',
    });
    await queryInterface.addIndex('Transfers', ['type'], {
      name: 'transfers_type_idx',
    });
    await queryInterface.addIndex('Transfers', ['from_acct', 'modulename'], {
      name: 'transfers_from_acct_modulename_idx',
    });
    await queryInterface.addIndex('Transfers', ['chainId', 'from_acct', 'modulename'], {
      name: 'transfers_chainid_from_acct_modulename_idx',
    });
    await queryInterface.addIndex('Transfers', ['chainId', 'to_acct', 'modulename'], {
      name: 'transfers_chainid_to_acct_modulename_idx',
    });
  },
};
