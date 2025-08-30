'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('Events', ['creationtime', 'id'], {
      name: 'events_creationtime_id_idx',
    });
    await queryInterface.addIndex('Events', ['module', 'id'], {
      name: 'events_module_id_idx',
    });
    await queryInterface.addIndex('Events', ['module', 'chainId', 'id'], {
      name: 'events_module_chain_id_id_idx',
    });
    await queryInterface.addIndex('Events', ['module', 'name', 'creationtime', 'id'], {
      name: 'events_module_name_creationtime_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Events', 'events_creationtime_id_idx');
    await queryInterface.removeIndex('Events', 'events_module_id_idx');
    await queryInterface.removeIndex('Events', 'events_module_chain_id_id_idx');
    await queryInterface.removeIndex('Events', 'events_module_name_creationtime_id_idx');
  },
};
