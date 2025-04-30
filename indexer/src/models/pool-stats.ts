import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';
import Pair from './pair';

export interface PoolStatsAttributes {
  id: number;
  pairId: number;
  timestamp: Date;
  tvlUsd: number;
  volume24hUsd: number;
  volume7dUsd: number;
  fees24hUsd: number;
  transactionCount24h: number;
  apr24h: number;
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

  /** 24-hour transaction count */
  declare transactionCount24h: number;

  /** 24-hour Annual Percentage Rate */
  declare apr24h: number;

  /** The associated pair */
  declare pair: Pair;
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
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the associated pair',
    },
    timestamp: {
      type: DataTypes.DATE,
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
    transactionCount24h: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour transaction count',
    },
    apr24h: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
      comment: '24-hour Annual Percentage Rate',
    },
  },
  {
    sequelize,
    modelName: 'PoolStats',
    indexes: [
      {
        name: 'pool_stats_pairid_timestamp_idx',
        fields: ['pairId', 'timestamp'],
      },
    ],
  },
);

// Define associations
PoolStats.belongsTo(Pair, {
  foreignKey: 'pairId',
  as: 'pair',
});

export default PoolStats;
