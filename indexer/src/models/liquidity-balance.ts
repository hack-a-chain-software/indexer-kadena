import { Model, DataTypes } from 'sequelize';
import { sequelize } from '@/config/db-migrator';

class LiquidityBalance extends Model {
  public id!: number;
  public pairId!: number;
  public liquidity!: string;
  public walletAddress!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LiquidityBalance.init(
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
    liquidity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '0',
    },
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'LiquidityBalances',
    indexes: [
      {
        unique: true,
        fields: ['pairId', 'walletAddress'],
      },
      {
        fields: ['pairId'],
      },
    ],
  },
);

export default LiquidityBalance;
