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
    await queryInterface.addIndex('AnalyticsSummaries', ['metricType', 'timeframe'], {
      name: 'analytics_summary_metric_timeframe_idx',
    });

    await queryInterface.addIndex('AnalyticsSummaries', ['periodStart', 'periodEnd'], {
      name: 'analytics_summary_period_idx',
    });

    await queryInterface.addIndex('AnalyticsSummaries', ['chainId'], {
      name: 'analytics_summary_chain_idx',
    });

    await queryInterface.addIndex(
      'AnalyticsSummaries',
      ['metricType', 'timeframe', 'chainId', 'periodStart'],
      {
        name: 'analytics_summary_lookup_idx',
      },
    );

    // Add unique constraint to prevent duplicate analytics for the same period
    await queryInterface.addConstraint('AnalyticsSummaries', {
      fields: ['metricType', 'timeframe', 'periodStart', 'chainId'],
      type: 'unique',
      name: 'analytics_summary_unique_period',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AnalyticSummaries');
  },
};
