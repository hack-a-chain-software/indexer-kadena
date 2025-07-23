'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, convert existing timestamps to date-only format
    await queryInterface.sequelize.query(`
      UPDATE "PoolStats"
      SET timestamp = DATE(timestamp)
      WHERE timestamp IS NOT NULL;
    `);

    // Remove duplicate entries keeping the latest one for each pairId and timestamp
    await queryInterface.sequelize.query(`
      DELETE FROM "PoolStats" a
      USING (
        SELECT "pairId", timestamp, MAX(id) as max_id
        FROM "PoolStats"
        GROUP BY "pairId", timestamp
        HAVING COUNT(*) > 1
      ) b
      WHERE a."pairId" = b."pairId" 
      AND a.timestamp = b.timestamp 
      AND a.id < b.max_id;
    `);

    // Then change the column type to DATE
    await queryInterface.changeColumn('PoolStats', 'timestamp', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Convert back to TIMESTAMP WITH TIME ZONE
    await queryInterface.changeColumn('PoolStats', 'timestamp', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
