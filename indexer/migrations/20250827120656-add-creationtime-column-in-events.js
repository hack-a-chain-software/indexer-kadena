'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Events', 'creationtime', {
      type: Sequelize.STRING,
      comment: "The creation time of the transaction (e.g., '1715747797').",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Events', 'creationtime');
  },
};
