'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Counters', {
      canonicalBlocks: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      orphansBlocks: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      canonicalTransactions: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      orphanTransactions: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });

    await queryInterface.bulkInsert('Counters', [
      {
        canonicalBlocks: 0,
        orphansBlocks: 0,
        canonicalTransactions: 0,
        orphanTransactions: 0,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Counters');
  },
};
