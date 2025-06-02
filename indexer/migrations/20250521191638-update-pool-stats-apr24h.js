'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('PoolStats', 'apr24h', {
      type: Sequelize.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour Annual Percentage Rate',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('PoolStats', 'apr24h', {
      type: Sequelize.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour Annual Percentage Rate',
    });
  },
};
