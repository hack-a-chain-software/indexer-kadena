'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PoolTransactions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the pool transaction',
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
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The ID of the associated transaction',
      },
      requestkey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The request key of the transaction',
      },
      type: {
        type: Sequelize.ENUM('SWAP', 'ADD_LIQUIDITY', 'REMOVE_LIQUIDITY'),
        allowNull: false,
        comment: 'The type of pool transaction',
      },
      maker: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The address of the transaction maker',
      },
      amount0In: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
        comment: 'Amount of token0 input',
      },
      amount1In: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
        comment: 'Amount of token1 input',
      },
      amount0Out: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
        comment: 'Amount of token0 output',
      },
      amount1Out: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
        comment: 'Amount of token1 output',
      },
      amountUsd: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Transaction amount in USD',
      },
      feeAmount: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '0',
        comment: 'Fee amount in tokens',
      },
      feeUsd: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Fee amount in USD',
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'The timestamp of the transaction',
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
    await queryInterface.addIndex('PoolTransactions', ['pairId'], {
      name: 'pool_transactions_pairid_idx',
    });
    await queryInterface.addIndex('PoolTransactions', ['requestkey'], {
      name: 'pool_transactions_requestkey_idx',
    });
    await queryInterface.addIndex('PoolTransactions', ['timestamp'], {
      name: 'pool_transactions_timestamp_idx',
    });
    await queryInterface.addIndex('PoolTransactions', ['type'], {
      name: 'pool_transactions_type_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('PoolTransactions');
  },
};
