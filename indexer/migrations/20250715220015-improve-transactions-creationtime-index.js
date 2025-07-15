'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('Transactions', ['creationtime', 'id'], {
      name: 'transactions_creationtime_id_idx',
    });
    await queryInterface.removeIndex('Transactions', 'transactions_creationtime_idx');
  },

  async down(queryInterface) {
    await queryInterface.addIndex('Transactions', {
      fields: ['creationtime'],
      name: 'transactions_creationtime_idx',
    });
    await queryInterface.removeIndex('Transactions', 'transactions_creationtime_id_idx');
  },
};
