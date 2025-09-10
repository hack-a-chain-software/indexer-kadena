'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('Events', ['module', 'chainId'], {
      name: 'events_module_chainid_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Events', 'events_module_chainid_idx');
  },
};
