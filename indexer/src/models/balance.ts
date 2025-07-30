/**
 * Balance Model Definition
 *
 * This module defines the Balance model, which represents account token balances
 * in the Kadena blockchain ecosystem. Balances track the ownership and quantity of
 * both fungible tokens (coins/currencies) and poly-fungible tokens (NFTs) across
 * different chains and accounts.
 *
 * The Balance model is central to the indexer's ability to track:
 * 1. Account wealth and token ownership
 * 2. Token distribution and circulation
 * 3. Historical balance changes through transactions
 *
 * Balances are linked to contracts and can be queried through specialized GraphQL
 * endpoints to provide rich data about token holders and distributions.
 */

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/db-migrator';
import Contract from './contract';

/**
 * Interface defining the attributes of a Balance.
 * These attributes represent the essential properties of token balances
 * as they are stored in the database.
 */
export interface BalanceAttributes {
  /** Unique identifier for the balance record */
  id?: number;
  /** Account address that owns the balance */
  account: string;
  /** Chain ID where this balance exists */
  chainId: number;
  /** Actual token amount/quantity owned */
  balance: bigint;
  /** Module/contract name associated with this balance */
  module: string;
  /** Specific token ID for NFTs, undefined for fungible tokens */
  tokenId?: string;
  /** Flag indicating whether this balance has a specific token ID (NFTs) */
  hasTokenId: boolean;
  /** Reference to the associated contract record */
  contractId?: number;
  /** Count of transactions affecting this balance */
  transactionsCount?: number;
  /** Count of fungible token transfers affecting this balance */
  fungiblesCount?: number;
  /** Count of poly-fungible (NFT) transfers affecting this balance */
  polyfungiblesCount?: number;
}

/**
 * Interface for Balance creation attributes, making id and balance optional during creation
 * since id is auto-generated and balance can have a default value.
 */
interface BalanceCreationAttributes extends Optional<BalanceAttributes, 'id' | 'balance'> {}

/**
 * Represents a balance in the system.
 *
 * Balances track the quantity of tokens owned by specific accounts,
 * providing the foundation for tracking wealth and ownership across
 * the blockchain ecosystem.
 */
class Balance
  extends Model<BalanceAttributes, BalanceCreationAttributes>
  implements BalanceAttributes
{
  /** The unique identifier for the balance record (e.g., 45690). */
  public id!: number;

  /** The account associated with the balance (e.g., "k:aaef3fbd4715dff905a3c50cb243d97058b8221da858e645551b44ffdd4364a4"). */
  public account!: string;

  /** The ID of the blockchain network (e.g., 2). */
  public chainId!: number;

  /** The balance amount (e.g., 25). */
  public balance!: bigint;

  /** The module associated with the balance (e.g., "coin"). */
  public module!: string;

  /** The token ID associated with the balance (e.g., "boxing-badger #1443"). */
  public tokenId!: string;

  /** Whether the balance has a token ID (e.g., false). */
  public hasTokenId!: boolean;

  /** The ID of the associated contract (e.g., 204). */
  public contractId!: number;

  /** The number of transactions in the block. */
  public transactionsCount!: number;

  /** The number of fungibles in the block. */
  public fungiblesCount!: number;

  /** The number of polyfungibles in the block. */
  public polyfungiblesCount!: number;
}

/**
 * Initialize the Balance model with its attributes and configuration.
 * This defines the database schema for the Balances table and sets up indexes
 * for efficient querying of balance data.
 *
 * The model includes multiple specialized indexes:
 * - A unique constraint ensuring each balance combination is unique
 * - Simple indexes for common lookup fields (account, tokenId, contractId)
 * - A case-insensitive search index for account addresses
 *
 * These indexes support efficient balance lookups, account portfolio views,
 * and token distribution analysis.
 */
Balance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the balance record (e.g., 45690).',
    },
    account: {
      type: DataTypes.STRING,
      allowNull: false,
      comment:
        "The account associated with the balance (e.g., 'k:aaef3fbd4715dff905a3c50cb243d97058b8221da858e645551b44ffdd4364a4').",
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the blockchain network (e.g., 2).',
    },
    balance: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      defaultValue: 0,
      comment: 'The balance amount (e.g., 25).',
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The module associated with the balance (e.g., 'coin').",
    },
    tokenId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "The token ID associated with the balance (e.g., 'boxing-badger #1443').",
    },
    hasTokenId: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the balance has a token ID (e.g., false).',
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'The ID of the associated contract (e.g., 204).',
    },
    transactionsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'The number of transactions in the block.',
    },
    fungiblesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'The number of fungibles in the block.',
    },
    polyfungiblesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'The number of polyfungibles in the block.',
    },
  },
  {
    sequelize,
    modelName: 'Balance',
    indexes: [
      {
        name: 'balances_unique_constraint',
        unique: true,
        fields: ['chainId', 'account', 'module', 'tokenId'],
      },
      {
        name: 'balances_account_index',
        fields: ['account'],
      },
      {
        name: 'balances_tokenid_index',
        fields: ['tokenId'],
      },
      {
        name: 'balances_contractid_index',
        fields: ['contractId'],
      },
      {
        name: 'balances_search_idx',
        fields: [sequelize.fn('LOWER', sequelize.col('account'))],
      },
    ],
  },
);

/**
 * Define relationships between the Balance model and other models.
 *
 * Balances belong to:
 * - Contract - Each balance is associated with a specific token contract
 *
 * This relationship enables efficient querying of token metadata and properties
 * when retrieving balance information.
 */
Balance.belongsTo(Contract, {
  foreignKey: 'contractId',
  as: 'contract',
});

export default Balance;
