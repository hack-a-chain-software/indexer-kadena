'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Signers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the signer',
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'The address of the signer',
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The order index for the signer',
      },
      pubkey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The public key of the signer',
      },
      clist: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'The capabilities list (clist) associated with the signer',
      },
      scheme: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'The scheme associated with the signer, eg. ED25519',
      },
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Transactions',
          key: 'id',
        },
        comment: 'Foreign key referencing the related transaction ID',
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

    await queryInterface.addIndex('Signers', ['pubkey', 'transactionId'], {
      name: 'signers_pubkey_transactionid_idx',
    });
    await queryInterface.addIndex('Signers', ['transactionId'], {
      name: 'signers_transaction_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Signers');
  },
};
