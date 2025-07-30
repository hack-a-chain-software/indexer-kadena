import { Model, DataTypes, Optional } from 'sequelize';
import Transaction from './transaction';
import { sequelize } from '@/config/db-migrator';

export interface SignerAttributes {
  id: number;
  address?: string;
  orderIndex?: number;
  pubkey: string;
  clist: object;
  scheme?: string;
  transactionId: number;
}

interface SignerCreationAttributes extends Optional<SignerAttributes, 'id'> {}

class Signer extends Model<SignerAttributes, SignerCreationAttributes> implements SignerAttributes {
  public id!: number;
  public address?: string;
  public orderIndex?: number;
  public pubkey!: string;
  public clist!: object;
  public scheme?: string;
  public transactionId!: number;
}

Signer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the signer',
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The address of the signer',
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'The order index for the signer',
    },
    pubkey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The public key of the signer',
    },
    clist: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'The capabilities list (clist) associated with the signer',
    },
    scheme: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The scheme associated with the signer, eg. ED25519',
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Transactions',
        key: 'id',
      },
      comment: 'Foreign key referencing the related transaction ID',
    },
  },
  {
    sequelize,
    modelName: 'Signer',
    tableName: 'Signers',
    timestamps: true,
    indexes: [
      {
        name: 'signers_pubkey_transactionid_idx',
        fields: ['pubkey', 'transactionId'],
      },
      {
        name: 'signers_transaction_id_idx',
        fields: ['transactionId'],
      },
    ],
  },
);

// Set up association with Transaction
Signer.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  as: 'transaction',
});

export default Signer;
