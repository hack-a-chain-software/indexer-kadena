'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the event record (e.g., 5985644).',
      },
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Transactions',
          key: 'id',
        },
        comment: 'Foreign key referencing the related transaction ID',
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'The ID of the blockchain network (e.g., 0).',
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The module associated with the event (e.g., 'coin').",
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The name of the event (e.g., 'TRANSFER').",
      },
      params: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment:
          "The parameters of the event (e.g., ['k:ec48fcadd0649a4230800668ca5bb17d1a91f14daf87a56cb954964055994031', 'k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3', 0.000969]).",
      },
      qualname: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The qualified name of the event (e.g., 'coin').",
      },
      requestkey: {
        type: Sequelize.STRING,
        allowNull: false,
        comment:
          "The request key of the event (e.g., 'vyL1rMR_qbkoi8yUW3ktEeBU9XzdWSEaoe1GdPLL3j4').",
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The event order.',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('Events', ['transactionId'], {
      name: 'events_transactionid_idx',
    });
    await queryInterface.addIndex('Events', ['module', 'name'], {
      name: 'events_module_name_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Events');
  },
};
