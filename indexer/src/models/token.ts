import { DataTypes, Model } from 'sequelize';

import { sequelize } from '@/config/db-migrator';
import type Pair from './pair';

class Token extends Model {
  public id!: number;
  public address!: string;
  public name!: string;
  public symbol!: string;
  public code!: string;
  public decimals!: number;
  public totalSupply!: string;
  public tokenInfo!: {
    decimalsToDisplay: number;
    description: string;
    themeColor: string;
    discordUrl: string;
    mediumUrl: string;
    telegramUrl: string;
    twitterUrl: string;
    websiteUrl: string;
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Type definitions for associations
  public readonly pairsAsToken0?: Pair[];
  public readonly pairsAsToken1?: Pair[];
}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    decimals: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalSupply: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    tokenInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        decimalsToDisplay: 8,
        description: '',
        themeColor: '#000000',
        discordUrl: '',
        mediumUrl: '',
        telegramUrl: '',
        twitterUrl: '',
        websiteUrl: '',
      },
    },
  },
  {
    sequelize,
    modelName: 'Token',
    timestamps: true,
  },
);

export default Token;
