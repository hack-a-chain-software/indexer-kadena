/**
 * Sequelize CLI configuration file
 *
 * This file exports the database configuration in the format expected by Sequelize CLI
 * for running migrations. It imports the configuration from the main database.ts module
 * to maintain a single source of truth.
 */

const { sequelizeConfig } = require('./database.js');

module.exports = {
  development: sequelizeConfig,
  test: sequelizeConfig,
  production: sequelizeConfig,
};
