import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';
import Pair from './pair';

export enum ChartDataType {
  VOLUME = 'VOLUME',
  TVL = 'TVL',
  FEES = 'FEES',
}

export interface PoolChartDataAttributes {
  id: number;
  pairId: number;
  type: ChartDataType;
  timestamp: Date;
  valueUsd: number;
}

/**
 * Represents historical data points for pool charts (volume, TVL, fees).
 */
class PoolChartData extends Model<PoolChartDataAttributes> implements PoolChartDataAttributes {
  /** The unique identifier for the pool chart data record */
  declare id: number;

  /** The ID of the associated pair */
  declare pairId: number;

  /** The type of chart data (VOLUME, TVL, FEES) */
  declare type: ChartDataType;

  /** The timestamp for this data point */
  declare timestamp: Date;

  /** The USD value for this data point */
  declare valueUsd: number;

  /** The associated pair */
  declare pair: Pair;
}

PoolChartData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the pool chart data record',
    },
    pairId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the associated pair',
    },
    type: {
      type: DataTypes.ENUM(...Object.values(ChartDataType)),
      allowNull: false,
      comment: 'The type of chart data (VOLUME, TVL, FEES)',
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'The timestamp for this data point',
    },
    valueUsd: {
      type: DataTypes.DECIMAL(24, 8),
      allowNull: false,
      defaultValue: 0,
      comment: 'The USD value for this data point',
    },
  },
  {
    sequelize,
    modelName: 'PoolChartData',
    indexes: [
      {
        name: 'pool_chart_data_pairid_type_timestamp_idx',
        fields: ['pairId', 'type', 'timestamp'],
      },
    ],
  },
);

// Define associations
PoolChartData.belongsTo(Pair, {
  foreignKey: 'pairId',
  as: 'pair',
});

export default PoolChartData;
