'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LiquidityBalances', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      pairId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id',
        },
      },
      liquidity: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      walletAddress: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LiquidityBalances');
  },
};
