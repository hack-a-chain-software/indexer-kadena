import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';

class Counter extends Model {
  public id!: number;
  public canonicalBlocks!: number;
  public orphansBlocks!: number;
  public canonicalTransactions!: number;
  public orphanTransactions!: number;
  public totalGasUsed!: number;
}

Counter.init(
  {
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    canonicalBlocks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orphansBlocks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    canonicalTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orphanTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalGasUsed: {
      type: DataTypes.DECIMAL(20, 10),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Counter',
    timestamps: false,
  },
);

export { Counter };
