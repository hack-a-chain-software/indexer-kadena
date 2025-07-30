import { DataTypes, Model } from 'sequelize';

import { sequelize } from '@/config/db-migrator';
import type Pair from './pair';

export interface PoolStatsAttributes {
  id?: number;
  pairId: number;
  timestamp: Date;
  tvlUsd: number;
  volume24hUsd: number;
  volume7dUsd: number;
  fees24hUsd: number;
  fees7dUsd: number;
  transactionCount24h?: number;
  apr24h: number;
  volume30dUsd: number;
  volume1yUsd: number;
  fees30dUsd: number;
  fees1yUsd: number;
  tvlHistory: {
    timestamp: Date;
    value: string;
  }[];
}

/**
 * Represents pool statistics tracked over time.
 */
class PoolStats extends Model<PoolStatsAttributes> implements PoolStatsAttributes {
  /** The unique identifier for the pool stats record */
  declare id: number;

  /** The ID of the associated pair */
  declare pairId: number;

  /** The timestamp when these stats were recorded */
  declare timestamp: Date;

  /** Total Value Locked in USD */
  declare tvlUsd: number;

  /** 24-hour volume in USD */
  declare volume24hUsd: number;

  /** 7-day volume in USD */
  declare volume7dUsd: number;

  /** 24-hour fees in USD */
  declare fees24hUsd: number;

  /** 7-day fees in USD */
  declare fees7dUsd: number;

  /** 24-hour transaction count */
  declare transactionCount24h: number;

  /** 24-hour Annual Percentage Rate */
  declare apr24h: number;

  /** 30-day volume in USD */
  declare volume30dUsd: number;

  /** 1-year volume in USD */
  declare volume1yUsd: number;

  /** 30-day fees in USD */
  declare fees30dUsd: number;

  /** 1-year fees in USD */
  declare fees1yUsd: number;

  /** TVL history */
  declare tvlHistory: {
    timestamp: Date;
    value: string;
  }[];

  /** The timestamp when these stats were created */
  declare readonly createdAt: Date;

  /** The timestamp when these stats were last updated */
  declare readonly updatedAt: Date;

  // Type definitions for associations
  declare readonly pair?: Pair;
}

PoolStats.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the pool stats record',
    },
    pairId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The ID of the associated pair',
    },
    timestamp: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'The timestamp when these stats were recorded',
    },
    tvlUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total Value Locked in USD',
    },
    volume24hUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour volume in USD',
    },
    volume7dUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '7-day volume in USD',
    },
    fees24hUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour fees in USD',
    },
    fees7dUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '7-day fees in USD',
    },
    transactionCount24h: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour transaction count',
    },
    apr24h: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour Annual Percentage Rate',
    },
    volume30dUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '30-day volume in USD',
    },
    volume1yUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '1-year volume in USD',
    },
    fees30dUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '30-day fees in USD',
    },
    fees1yUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: '1-year fees in USD',
    },
    tvlHistory: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'TVL history',
    },
  },
  {
    sequelize,
    modelName: 'PoolStats',
    timestamps: true,
    indexes: [
      {
        name: 'pool_stats_pairid_timestamp_idx',
        fields: ['pairId', 'timestamp'],
        unique: true,
      },
    ],
  },
);

export default PoolStats;
