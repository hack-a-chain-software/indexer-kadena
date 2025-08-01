'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transfers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the transfer record (e.g., 1799984).',
      },
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Transactions',
          key: 'id',
        },
        comment: 'Foreign key referencing the related transaction ID',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The type of the transfer (e.g., 'fungible').",
      },
      amount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
        comment: 'The amount transferred (e.g., 0.0003112).',
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'The ID of the blockchain network (e.g., 0).',
      },
      from_acct: {
        type: Sequelize.STRING,
        allowNull: false,
        comment:
          "The account from which the transfer was made (e.g., 'k:6fdc4bdbd5bd319466d7b83d85465d8a5a5546bf3b9aababb77aac7bb44241aa').",
      },
      modulehash: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The hash of the module (e.g., 'klFkrLfpyLW-M3xjVPSdqXEMgxPPJibRt_D6qiBws6s').",
      },
      modulename: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The name of the module (e.g., 'coin').",
      },
      requestkey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment:
          "The request key of the transfer (e.g., 'y2XuhnGPkvptF-scYTnMfdcD2zokQf-HyOu-qngAm9s').",
      },
      to_acct: {
        type: Sequelize.STRING,
        allowNull: false,
        comment:
          "The account to which the transfer was made (e.g., 'k:251efb06f3b798dbe7bb3f58f535b67b0a9ed2da9aa4e2367be4abc07cc927fa').",
      },
      hasTokenId: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Whether the transfer has a token ID (e.g., true).',
      },
      tokenId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment:
          "The token ID associated with the transfer (optional, e.g., 't:DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM').",
      },
      contractId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The ID of the associated contract (optional, e.g., 1).',
      },
      canonical: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Whether the transfer is canonical',
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The transfer order',
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

    await queryInterface.addIndex('Transfers', ['type'], { name: 'transfers_type_idx' });
    await queryInterface.addIndex('Transfers', ['transactionId'], {
      name: 'transfers_transactionid_idx',
    });
    await queryInterface.addIndex('Transfers', ['hasTokenId'], {
      name: 'transfers_hasTokenId_idx',
    });
    await queryInterface.addIndex('Transfers', ['contractId'], {
      name: 'transfers_contractid_idx',
    });
    await queryInterface.addIndex('Transfers', ['modulename'], {
      name: 'transfers_modulename_idx',
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
    await queryInterface.addIndex('Transfers', ['from_acct'], { name: 'from_acct_idx' });
    await queryInterface.addIndex('Transfers', ['to_acct'], { name: 'to_acct_idx' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Transfers');
  },
};
