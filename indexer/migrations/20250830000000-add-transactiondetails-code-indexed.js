'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TransactionDetails', 'code_indexed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag indicating whether this transaction code was indexed in ClickHouse',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('TransactionDetails', 'code_indexed');
  },
};
