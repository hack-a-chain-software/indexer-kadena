/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransactionDetails', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      transactionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Transactions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      code: {
        type: Sequelize.JSONB,
      },
      continuation: {
        type: Sequelize.JSONB,
      },
      data: {
        type: Sequelize.JSONB,
      },
      gas: {
        type: Sequelize.STRING,
      },
      gaslimit: {
        type: Sequelize.STRING,
      },
      gasprice: {
        type: Sequelize.STRING,
      },
      nonce: {
        type: Sequelize.TEXT,
      },
      pactid: {
        type: Sequelize.STRING,
      },
      proof: {
        type: Sequelize.TEXT,
      },
      rollback: {
        type: Sequelize.BOOLEAN,
      },
      sigs: {
        type: Sequelize.JSONB,
      },
      step: {
        type: Sequelize.INTEGER,
      },
      ttl: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TransactionDetails');
  },
};
