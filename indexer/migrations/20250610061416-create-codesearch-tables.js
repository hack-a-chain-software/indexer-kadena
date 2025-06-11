'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Criar tabela CodeSearch
    await queryInterface.createTable('CodeSearch', {
      pk: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      arg: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. Criar tabela Transaction_CodeSearch
    await queryInterface.createTable('Transaction_CodeSearch', {
      pk: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      requestkey: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'References Transaction.requestkey (not TransactionDetails)',
      },
      args_fk: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'CodeSearch',
          key: 'pk',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 3. Criar índices de performance
    await queryInterface.addIndex('CodeSearch', {
      fields: ['arg'],
      name: 'idx_codesearch_arg',
    });

    await queryInterface.addIndex('Transaction_CodeSearch', {
      fields: ['requestkey'],
      name: 'idx_transaction_codesearch_requestkey',
    });

    await queryInterface.addIndex('Transaction_CodeSearch', {
      fields: ['args_fk'],
      name: 'idx_transaction_codesearch_fk',
    });

    // 4. Adicionar constraint de unicidade
    await queryInterface.addConstraint('Transaction_CodeSearch', {
      fields: ['requestkey', 'args_fk'],
      type: 'unique',
      name: 'unique_requestkey_codesearch_fk',
    });
  },

  async down(queryInterface) {
    // Remove constraint
    await queryInterface.removeConstraint(
      'Transaction_CodeSearch',
      'unique_requestkey_codesearch_fk',
    );

    // Remove indexes
    await queryInterface.removeIndex('CodeSearch', 'idx_codesearch_arg');
    await queryInterface.removeIndex(
      'Transaction_CodeSearch',
      'idx_transaction_codesearch_requestkey',
    );
    await queryInterface.removeIndex('Transaction_CodeSearch', 'idx_transaction_codesearch_fk');

    // Drop tables (ordem inversa por causa das foreign keys)
    await queryInterface.dropTable('Transaction_CodeSearch');
    await queryInterface.dropTable('CodeSearch');
  },
};
