/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AnalyticSummaries', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        comment: 'Unique identifier for the analytics summary record.',
      },
      metricType: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of metric (transaction_fees, event_types, network_activity, etc.)',
      },
      timeframe: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Time aggregation level (hourly, daily, weekly, monthly, yearly)',
      },
      periodStart: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Start of the time period for this metric',
      },
      periodEnd: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'End of the time period for this metric',
      },
      chainId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Chain ID for chain-specific metrics (null for cross-chain metrics)',
      },
      metricData: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'JSON object containing the computed metrics data',
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

    // Add indexes for efficient querying
    await queryInterface.addIndex('AnalyticSummaries', ['metricType', 'timeframe'], {
      name: 'analytic_summaries_metric_timeframe_idx',
    });

    await queryInterface.addIndex('AnalyticSummaries', ['periodStart', 'periodEnd'], {
      name: 'analytic_summaries_period_idx',
    });

    await queryInterface.addIndex('AnalyticSummaries', ['chainId'], {
      name: 'analytic_summaries_chain_idx',
    });

    await queryInterface.addIndex(
      'AnalyticSummaries',
      ['metricType', 'timeframe', 'chainId', 'periodStart'],
      {
        name: 'analytic_summaries_lookup_idx',
      },
    );

    // Add unique constraint to prevent duplicate analytics for the same period
    await queryInterface.addConstraint('AnalyticSummaries', {
      fields: ['metricType', 'timeframe', 'periodStart', 'chainId'],
      type: 'unique',
      name: 'analytic_summaries_unique_period',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AnalyticSummaries');
  },
};
