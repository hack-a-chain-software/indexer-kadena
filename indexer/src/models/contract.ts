/**
 * Contract Model Definition
 *
 * This module defines the Contract model, which represents blockchain token contracts
 * in the Kadena ecosystem. Contracts are the foundational structures that define token
 * behavior, ownership, and metadata in the blockchain.
 *
 * The model supports two primary contract types:
 * 1. Fungible token contracts (like 'coin', standard KDA tokens)
 * 2. Poly-fungible token contracts (NFTs with unique token IDs)
 *
 * Contracts are referenced by transfers and balances to maintain the relationship
 * between tokens, their metadata, and the accounts that hold them.
 */

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '@/config/db-migrator';
import Balance from './balance';

/**
 * Interface defining the attributes of a Contract.
 * These attributes represent the fundamental properties of blockchain token contracts
 * as they are stored in the database.
 */
export interface ContractAttributes {
  /** Unique identifier for the contract record */
  id: number;

  /** Chain ID where the contract exists */
  chainId: number;

  /** Type of contract: 'fungible' or 'poly-fungible' (NFT) */
  type: string;

  /** Smart contract module name (e.g., 'coin', 'marmalade.ledger') */
  module: string;

  /** Contract metadata, including manifest data for NFTs */
  metadata: object;

  /** Token ID for NFT contracts, null for fungible tokens */
  tokenId: string;

  /** Decimal precision for fungible tokens, null for NFTs */
  precision: number;
}

/**
 * Represents a contract in the blockchain.
 *
 * Contracts define the behavior and properties of tokens in the Kadena blockchain.
 * For fungible tokens, there's typically one contract per token type (e.g., 'coin').
 * For NFTs, each unique token ID has its own contract entry with specific metadata.
 */
class Contract extends Model<ContractAttributes> implements ContractAttributes {
  /** The unique identifier for the contract record (e.g., 1). */
  declare id: number;

  /** The ID of the blockchain network (e.g., 8). */
  declare chainId: number;

  /** The type of the contract (e.g., "fungible or poly-fungible"). */
  declare type: string;

  /** The module associated with the contract (e.g., "marmalade.ledger"). */
  declare module: string;

  /** The metadata of the contract (e.g., {"hash":"DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM", "data":[{"hash":"xWBBpd0sOxaydYz6-ZGnGegwSAIwPPncZArLeo7Ph-4", "uri":{"data":"3d6daeb041bed67899b1a8e664ebd6f3059b8ba06735b651d471dd2e074a951d", "scheme":"https://kmc-assets.s3.amazonaws.com/assets/"}}]}). */
  declare metadata: object;

  /** The token ID associated with the contract (e.g., "t:DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM"). */
  declare tokenId: string;

  /** The precision of the contract (e.g., 12). */
  declare precision: number;
}

/**
 * Initialize the Contract model with its attributes and configuration.
 * This defines the database schema for the Contracts table and sets up indexes
 * for efficient querying of contract data.
 *
 * The model has two key indexes:
 * 1. A unique constraint on chainId, module, and tokenId to prevent duplicates
 * 2. A search index on the lowercase module name for case-insensitive lookups
 *
 * TODO: [OPTIMIZATION] Consider adding additional indexes for common query patterns,
 * such as by contract type or by precision for performance improvements.
 */
Contract.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'The unique identifier for the contract record (e.g., 1).',
    },
    chainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The ID of the blockchain network (e.g., 8).',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The type of the contract (e.g., 'fungible or poly-fungible').",
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "The module associated with the contract (e.g., 'marmalade.ledger').",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "The metadata of the contract (e.g., {'hash':'DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM', 'data':[{'hash':'xWBBpd0sOxaydYz6-ZGnGegwSAIwPPncZArLeo7Ph-4', 'uri':{'data':'3d6daeb041bed67899b1a8e664ebd6f3059b8ba06735b651d471dd2e074a951d', 'scheme':'https://kmc-assets.s3.amazonaws.com/assets/'}}]}).",
    },
    tokenId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment:
        "The token ID associated with the contract (e.g., 't:DowR5LB9h6n96kxFRXDLSuSs1yh100Pk6STuUQNpseM').",
    },
    precision: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'The precision of the contract (e.g., 12).',
    },
  },
  {
    sequelize,
    modelName: 'Contract',
    indexes: [
      {
        // This unique constraint prevents duplicate contracts for the same token
        // For fungible tokens, tokenId will be null, so the constraint is on chainId+module
        // For NFTs, the constraint includes tokenId to allow multiple tokens from the same contract
        name: 'contract_unique_constraint',
        unique: true,
        fields: ['chainId', 'module', 'tokenId'],
      },
      {
        // This index supports case-insensitive searching by module name
        // Used for lookup operations when processing transfers
        name: 'contracts_search_idx',
        fields: [sequelize.fn('LOWER', sequelize.col('module'))],
      },
    ],
  },
);

export default Contract;
