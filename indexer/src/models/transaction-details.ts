import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Transaction from './transaction';

export interface TransactionDetailsAttributes {
  id: number;
  transactionId: number;
  code: object;
  continuation: object;
  data: object;
  gas: string;
  gaslimit: string;
  gasprice: string;
  nonce: string;
  pactid: string;
  proof: string;
  rollback: boolean;
  sigs: object;
  step: number;
  ttl: string;
  code_indexed?: boolean;
}

export interface TransactionDetailsCreationAttributes
  extends Optional<TransactionDetailsAttributes, 'id'> {}

/**
 * Represents transaction details in the blockchain.
 */
class TransactionDetails
  extends Model<TransactionDetailsAttributes, TransactionDetailsCreationAttributes>
  implements TransactionDetailsAttributes
{
  /** The unique identifier for the transaction details record. */
  declare id: number;

  /** The ID of the associated transaction. */
  declare transactionId: number;

  /** The code executed in the transaction. */
  declare code: object;

  /** The continuation of the transaction. */
  declare continuation: object;

  /** The data associated with the transaction. */
  declare data: object;

  /** The gas used in the transaction. */
  declare gas: string;

  /** The gas limit for the transaction. */
  declare gaslimit: string;

  /** The gas price for the transaction. */
  declare gasprice: string;

  /** The nonce of the transaction. */
  declare nonce: string;

  /** The pact ID of the transaction. */
  declare pactid: string;

  /** The proof of the transaction. */
  declare proof: string;

  /** Indicates whether the transaction is a rollback. */
  declare rollback: boolean;

  /** The signatures of the transaction. */
  declare sigs: object;

  /** The step of the transaction. */
  declare step: number;

  /** The time-to-live of the transaction. */
  declare ttl: string;

  /** The associated transaction. */
  declare transaction: Transaction;
}

TransactionDetails.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the transaction details record.',
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Transactions',
        key: 'id',
      },
      comment: 'The ID of the associated transaction.',
    },
    code: {
      type: DataTypes.JSONB,
      comment: 'The code executed in the transaction.',
    },
    continuation: {
      type: DataTypes.JSONB,
      comment: 'The continuation of the transaction.',
    },
    data: {
      type: DataTypes.JSONB,
      comment: 'The data associated with the transaction.',
    },
    gas: {
      type: DataTypes.STRING,
      comment: 'The gas used in the transaction.',
    },
    gaslimit: {
      type: DataTypes.STRING,
      comment: 'The gas limit for the transaction.',
    },
    gasprice: {
      type: DataTypes.STRING,
      comment: 'The gas price for the transaction.',
    },
    nonce: {
      type: DataTypes.TEXT,
      comment: 'The nonce of the transaction.',
    },
    pactid: {
      type: DataTypes.STRING,
      comment: 'The pact ID of the transaction.',
    },
    proof: {
      type: DataTypes.TEXT,
      comment: 'The proof of the transaction.',
    },
    rollback: {
      type: DataTypes.BOOLEAN,
      comment: 'Indicates whether the transaction is a rollback.',
    },
    sigs: {
      type: DataTypes.JSONB,
      comment: 'The signatures of the transaction.',
    },
    step: {
      type: DataTypes.INTEGER,
      comment: 'The step of the transaction.',
    },
    ttl: {
      type: DataTypes.STRING,
      comment: 'The time-to-live of the transaction.',
    },
    code_indexed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag indicating whether this transaction code was indexed in ClickHouse',
    },
  },
  {
    timestamps: true,
    sequelize,
    modelName: 'TransactionDetails',
  },
);

TransactionDetails.belongsTo(Transaction, {
  foreignKey: 'transactionId',
});

export default TransactionDetails;
