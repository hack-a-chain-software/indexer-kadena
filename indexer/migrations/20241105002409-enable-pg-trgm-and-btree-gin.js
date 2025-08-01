'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE EXTENSION pg_trgm;
      CREATE EXTENSION btree_gin;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP EXTENSION pg_trgm;
      DROP EXTENSION btree_gin;
    `);
  },
};
