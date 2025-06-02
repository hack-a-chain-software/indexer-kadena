'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove unique constraint from key column
    await queryInterface.removeConstraint('Pairs', 'Pairs_key_key');

    // Add composite unique index for address and key
    await queryInterface.addIndex('Pairs', ['address', 'key'], {
      name: 'pair_address_key_unique',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove composite unique index
    await queryInterface.removeIndex('Pairs', 'pair_address_key_unique');

    // Add back unique constraint to key column
    await queryInterface.addConstraint('Pairs', {
      fields: ['key'],
      type: 'unique',
      name: 'Pairs_key_key',
    });
  },
};
