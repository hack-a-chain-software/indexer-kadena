'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE INDEX transactions_result_gin_idx ON public."Transactions" USING gin (result);',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS transactions_result_gin_idx;');
  },
};
