import { DataTypes, Model } from 'sequelize';

import { sequelize } from '@/config/db-migrator';
import type Pair from './pair';

export enum TransactionType {
  SWAP = 'SWAP',
  ADD_LIQUIDITY = 'ADD_LIQUIDITY',
  REMOVE_LIQUIDITY = 'REMOVE_LIQUIDITY',
}

class PoolTransaction extends Model {
  public id!: number;
  public transactionId!: number | null;
  public requestkey!: string;
  public pairId!: number;
  public maker!: string;
  public amount0In!: string;
  public amount1In!: string;
  public amount0Out!: string;
  public amount1Out!: string;
  public amountUsd!: number;
  public feeAmount!: string; // Fee amount in tokens
  public feeUsd!: number; // Fee amount in USD
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Type definitions for associations
  public readonly pair?: Pair;
}

PoolTransaction.init(
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
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    requestkey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TransactionType)),
      allowNull: false,
    },
    maker: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount0In: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    amount1In: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    amount0Out: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    amount1Out: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    amountUsd: {
      type: DataTypes.DECIMAL(20, 10),
      allowNull: false,
      defaultValue: 0,
    },
    feeAmount: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    feeUsd: {
      type: DataTypes.DECIMAL(20, 10),
      allowNull: false,
      defaultValue: 0,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PoolTransaction',
    timestamps: true,
  },
);

export default PoolTransaction;
