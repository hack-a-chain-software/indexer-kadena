'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Balances', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the balance record (e.g., 45690).',
      },
      account: {
        type: Sequelize.STRING,
        allowNull: false,
        comment:
          "The account associated with the balance (e.g., 'k:aaef3fbd4715dff905a3c50cb243d97058b8221da858e645551b44ffdd4364a4').",
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'The ID of the blockchain network (e.g., 2).',
      },
      balance: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        defaultValue: 0,
        comment: 'The balance amount (e.g., 25).',
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The module associated with the balance (e.g., 'coin').",
      },
      tokenId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "The token ID associated with the balance (e.g., 'boxing-badger #1443').",
      },
      hasTokenId: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether the balance has a token ID (e.g., false).',
      },
      contractId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Contracts',
          key: 'id',
        },
        comment: 'Foreign key referencing the related contract ID',
      },
      transactionsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'The number of transactions in the block.',
      },
      fungiblesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'The number of fungibles in the block.',
      },
      polyfungiblesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'The number of polyfungibles in the block.',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('Balances', ['chainId', 'account', 'module', 'tokenId'], {
      name: 'balances_unique_constraint',
      unique: true,
    });
    await queryInterface.addIndex('Balances', ['account'], {
      name: 'balances_account_index',
    });
    await queryInterface.addIndex('Balances', ['tokenId'], {
      name: 'balances_tokenid_index',
    });
    await queryInterface.addIndex('Balances', ['contractId'], {
      name: 'balances_contractid_index',
    });
    await queryInterface.sequelize.query(
      'CREATE INDEX balances_search_idx ON "Balances" (LOWER(account));',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Balances');
  },
};
