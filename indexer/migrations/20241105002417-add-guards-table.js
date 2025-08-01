'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Guards', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the signer',
      },
      publicKey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The public key associated with the account',
      },
      predicate: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The predicate associated with the account, public key and chain',
      },
      balanceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Balances',
          key: 'id',
        },
        comment: 'Foreign key referencing the related balance ID',
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

    await queryInterface.addIndex('Guards', ['publicKey', 'predicate', 'balanceId'], {
      name: 'guards_publickey_predicate_balanceid_idx',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Guards');
  },
};
