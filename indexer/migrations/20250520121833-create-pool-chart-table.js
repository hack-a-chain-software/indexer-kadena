'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PoolCharts', {
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
      reserve0: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reserve1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      totalSupply: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reserve0Usd: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      reserve1Usd: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      tvlUsd: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
      },
      timestamp: {
        type: Sequelize.DATE,
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

    // Add indexes
    await queryInterface.addIndex('PoolCharts', ['pairId']);
    await queryInterface.addIndex('PoolCharts', ['pairId', 'timestamp']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PoolCharts');
  },
};
