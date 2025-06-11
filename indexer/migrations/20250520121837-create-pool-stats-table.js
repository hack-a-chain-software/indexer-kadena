'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PoolStats', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the pool stats record',
      },
      pairId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pairs',
          key: 'id',
        },
        comment: 'The ID of the associated pair',
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'The timestamp when these stats were recorded',
      },
      tvlUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total Value Locked in USD',
      },
      volume24hUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '24-hour volume in USD',
      },
      volume7dUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '7-day volume in USD',
      },
      fees24hUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '24-hour fees in USD',
      },
      fees7dUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '7-day fees in USD',
      },
      transactionCount24h: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '24-hour transaction count',
      },
      apr24h: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0,
        comment: '24-hour Annual Percentage Rate',
      },
      volume30dUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '30-day volume in USD',
      },
      volume1yUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '1-year volume in USD',
      },
      fees30dUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '30-day fees in USD',
      },
      fees1yUsd: {
        type: Sequelize.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        comment: '1-year fees in USD',
      },
      tvlHistory: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'TVL history',
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
    await queryInterface.dropTable('PoolStats');
  },
};
