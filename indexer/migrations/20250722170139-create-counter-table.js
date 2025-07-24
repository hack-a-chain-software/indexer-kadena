'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Counters', {
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
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

    const chainIds = Array.from({ length: 20 }, (_, i) => ({
      chainId: i,
      canonicalBlocks: 0,
      orphansBlocks: 0,
      canonicalTransactions: 0,
      orphanTransactions: 0,
    }));

    await queryInterface.bulkInsert('Counters', chainIds);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Counters');
  },
};
