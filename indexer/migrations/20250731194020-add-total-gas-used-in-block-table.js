'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Blocks', 'totalGasUsed', {
      type: Sequelize.DECIMAL(20, 10),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Blocks', 'totalGasUsed');
  },
};
