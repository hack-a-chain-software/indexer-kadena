'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Outbox', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      topic: { type: Sequelize.STRING, allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      processedAt: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('Outbox', ['topic', 'id'], { name: 'outbox_topic_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Outbox');
  },
};
