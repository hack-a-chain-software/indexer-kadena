'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE INDEX transactiondetails_code_gin_idx ON public."TransactionDetails" USING gin (code);',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS transactiondetails_code_gin_idx;');
  },
};
