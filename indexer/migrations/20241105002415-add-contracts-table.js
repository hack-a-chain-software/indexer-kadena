'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Contracts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'The unique identifier for the contract record (e.g., 1).',
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'The ID of the blockchain network (e.g., 8).',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The type of the contract (e.g., 'fungible or poly-fungible').",
      },
      module: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "The module associated with the contract (e.g., 'marmalade.ledger').",
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment:
          "The metadata of the contract (e.g., {'hash':'DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM', 'data':[{'hash':'xWBBpd0sOxaydYz6-ZGnGegwSAIwPPncZArLeo7Ph-4', 'uri':{'data':'3d6daeb041bed67899b1a8e664ebd6f3059b8ba06735b651d471dd2e074a951d', 'scheme':'https://kmc-assets.s3.amazonaws.com/assets/'}}]}).",
      },
      tokenId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment:
          "The token ID associated with the contract (e.g., 't:DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM').",
      },
      precision: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The precision of the contract (e.g., 12).',
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

    await queryInterface.addIndex('Contracts', ['chainId', 'module', 'tokenId'], {
      name: 'contract_unique_constraint',
      unique: true,
    });

    await queryInterface.sequelize.query(
      'CREATE INDEX contracts_search_idx ON "Contracts" (LOWER(module));',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Contracts');
  },
};
