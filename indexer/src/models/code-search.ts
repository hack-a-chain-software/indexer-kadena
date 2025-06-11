import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CodeSearchAttributes {
  pk: number;
  arg: string;
  created_at: Date;
  updated_at: Date;
}

export interface CodeSearchCreationAttributes
  extends Optional<CodeSearchAttributes, 'pk' | 'created_at' | 'updated_at'> {}

export interface TransactionCodeSearchAttributes {
  pk: number;
  requestkey: string;
  args_fk: number;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionCodeSearchCreationAttributes
  extends Optional<TransactionCodeSearchAttributes, 'pk' | 'created_at' | 'updated_at'> {}

/**
 * Model for storing unique searchable arguments extracted from Pact code
 */
class CodeSearch
  extends Model<CodeSearchAttributes, CodeSearchCreationAttributes>
  implements CodeSearchAttributes
{
  declare pk: number;
  declare arg: string;
  declare created_at: Date;
  declare updated_at: Date;
}

/**
 * Model for linking transactions to their searchable arguments
 */
class TransactionCodeSearch
  extends Model<TransactionCodeSearchAttributes, TransactionCodeSearchCreationAttributes>
  implements TransactionCodeSearchAttributes
{
  declare pk: number;
  declare requestkey: string;
  declare args_fk: number;
  declare created_at: Date;
  declare updated_at: Date;
}

CodeSearch.init(
  {
    pk: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    arg: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CodeSearch',
    tableName: 'CodeSearch',
    timestamps: false, // We handle timestamps manually
  },
);

TransactionCodeSearch.init(
  {
    pk: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    requestkey: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    args_fk: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'CodeSearch',
        key: 'pk',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'TransactionCodeSearch',
    tableName: 'Transaction_CodeSearch',
    timestamps: false, // We handle timestamps manually
  },
);

// Define relationships
TransactionCodeSearch.belongsTo(CodeSearch, {
  foreignKey: 'args_fk',
  as: 'codeSearch',
});

CodeSearch.hasMany(TransactionCodeSearch, {
  foreignKey: 'args_fk',
  as: 'transactionCodeSearches',
});

export { CodeSearch, TransactionCodeSearch };
export default CodeSearch;
