import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AnalyticsSummaryAttributes {
  id: number;
  metricType: string; // 'transaction_fees', 'event_types', 'network_activity', etc.
  timeframe: string; // 'hourly', 'daily', 'weekly', 'monthly', 'yearly'
  periodStart: Date;
  periodEnd: Date;
  chainId?: number;
  metricData: object; // JSON object containing the computed metrics
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsSummaryCreationAttributes
  extends Optional<AnalyticsSummaryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * Analytics Summary Model
 *
 * Stores pre-computed analytics metrics to avoid expensive real-time calculations.
 * This enables fast retrieval of transaction fees, event frequencies, and other
 * network statistics without scanning millions of records.
 */
class AnalyticsSummary
  extends Model<AnalyticsSummaryAttributes, AnalyticsSummaryCreationAttributes>
  implements AnalyticsSummaryAttributes
{
  declare id: number;
  declare metricType: string;
  declare timeframe: string;
  declare periodStart: Date;
  declare periodEnd: Date;
  declare chainId?: number;
  declare metricData: object;
  declare createdAt: Date;
  declare updatedAt: Date;
}

AnalyticsSummary.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'Unique identifier for the analytics summary record.',
    },
    metricType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of metric (transaction_fees, event_types, network_activity, etc.)',
    },
    timeframe: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Time aggregation level (hourly, daily, weekly, monthly, yearly)',
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Start of the time period for this metric',
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'End of the time period for this metric',
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Chain ID for chain-specific metrics (null for cross-chain metrics)',
    },
    metricData: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'JSON object containing the computed metrics data',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'AnalyticsSummary',
    indexes: [
      {
        name: 'analytics_summary_metric_timeframe_idx',
        fields: ['metricType', 'timeframe'],
      },
      {
        name: 'analytics_summary_period_idx',
        fields: ['periodStart', 'periodEnd'],
      },
      {
        name: 'analytics_summary_chain_idx',
        fields: ['chainId'],
      },
      {
        name: 'analytics_summary_lookup_idx',
        fields: ['metricType', 'timeframe', 'chainId', 'periodStart'],
      },
    ],
  },
);

export default AnalyticsSummary;
