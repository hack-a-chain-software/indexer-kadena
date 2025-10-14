'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransactionCounters', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sender: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      chainId: {
        type: Sequelize.SMALLINT,
        allowNull: false,
      },
      module: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      counter: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    });

    await queryInterface.addConstraint('TransactionCounters', {
      fields: ['sender', 'chainId', 'module'],
      type: 'unique',
      name: 'transaction_counters_sender_chainid_module_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'TransactionCounters',
      'transaction_counters_sender_chainid_module_unique',
    );
    await queryInterface.dropTable('TransactionCounters');
  },
};
