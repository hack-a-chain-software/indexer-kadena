'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Events', 'canonical', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      comment: 'Whether the event is canonical',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Events', 'canonical');
  },
};
