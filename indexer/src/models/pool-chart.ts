import { DataTypes, Model } from 'sequelize';

import { sequelize } from '@/config/db-migrator';
import type Pair from './pair';

class PoolChart extends Model {
  public id!: number;
  public pairId!: number;
  public reserve0!: string; // Token0 amount in pool
  public reserve1!: string; // Token1 amount in pool
  public totalSupply!: string; // Total LP tokens
  public reserve0Usd!: string; // USD value of reserve0
  public reserve1Usd!: string; // USD value of reserve1
  public tvlUsd!: string; // Total USD value locked
  public timestamp!: Date; // When this state was recorded

  // Type definitions for associations
  public readonly pair?: Pair;
}

PoolChart.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pairId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Pairs',
        key: 'id',
      },
    },
    reserve0: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reserve1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalSupply: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reserve0Usd: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    reserve1Usd: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    tvlUsd: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PoolChart',
    timestamps: true,
  },
);

export default PoolChart;
