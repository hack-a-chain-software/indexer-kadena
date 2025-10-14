import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';

class TransactionCounter extends Model {
  public id!: number;
  public sender!: string;
  public chainId!: number;
  public module!: string;
  public counter!: number;
}

TransactionCounter.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sender: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    chainId: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    counter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'TransactionCounters',
    tableName: 'TransactionCounters',
    timestamps: false,
  },
);

export { TransactionCounter };
