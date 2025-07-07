/**
 * Transaction Repository Interface
 *
 * This module defines the interface for accessing transaction data in the Kadena blockchain indexer.
 * Following the repository pattern, it establishes a contract for transaction data access
 * without specifying implementation details, allowing for different storage mechanisms.
 *
 * The interface provides methods for:
 * 1. Retrieving transactions with various filtering criteria
 * 2. Counting transactions based on specified conditions
 * 3. Looking up transactions by request keys, transfers, events, and public keys
 * 4. Accessing transaction metadata and signer information
 *
 * This abstraction layer separates the business logic from data access concerns,
 * enabling clean architecture principles and simplifying testing and maintenance.
 */

import { PageInfo, Signer, Transaction, TransactionMeta } from '../../config/graphql-types';
import { PaginationsParams } from '../pagination';
import { ConnectionEdge } from '../types';

/**
 * Parameters for fetching transactions, combining count parameters with pagination options.
 * This composite type provides comprehensive filtering and pagination for transaction queries.
 */
export type GetTransactionsParams = GetTransactionsCountParams & PaginationsParams;

/**
 * Parameters for fetching transactions by a specific public key.
 * Extends pagination parameters to support page-based data access.
 */
export interface GetTransactionsByPublicKeyParams extends PaginationsParams {
  /** The public key to filter transactions by */
  publicKey: string;
}

/**
 * This function has two methods of getting the signers on transactions.
 *
 * The first method is by passing only the 'trasanctionId'.
 * The second method is by passing 'requestKey' and 'orderIndex' together.
 *
 * Both methods will result in the same return type and value.
 */
export interface GetSignersParams {
  transactionId?: string;
  requestKey?: string;
  orderIndex?: string;
}

/**
 * Parameters for filtering transactions in count and retrieval operations.
 * These parameters enable precise querying of transactions based on various attributes.
 */
export interface GetTransactionsCountParams {
  /** Filter by block hash */
  blockHash?: string | null;
  /** Filter by account name */
  accountName?: string | null;
  /** Filter by chain ID */
  chainId?: string | null;
  /** Filter by transaction request key */
  requestKey?: string | null;
  /** Filter by fungible token name */
  fungibleName?: string | null;
  /** Filter by minimum confirmation depth */
  minimumDepth?: number | null;
  /** Filter by maximum block height */
  maxHeight?: number | null;
  /** Filter by minimum block height */
  minHeight?: number | null;
  /** Filter by whether the transaction has a token ID (NFT transactions) */
  hasTokenId?: boolean | null;
}

/**
 * Parameters for looking up transactions by their request key.
 * Request keys are unique identifiers for transactions in the Kadena blockchain.
 */
export interface GetTransactionsByRequestKey {
  /** The request key to search for */
  requestKey: string;
  /** Optional block hash to narrow the search */
  blockHash?: string | null;
  /** Optional minimum confirmation depth requirement */
  minimumDepth?: number | null;
}

/**
 * Represents a transaction as returned by the repository.
 * This type modifies the GraphQL Transaction type to fit repository needs,
 * adjusting command structure and adding database-specific fields.
 */
export type TransactionOutput = Omit<Transaction, 'cmd'> & {
  /** Modified command structure without meta and signers (handled separately) */
  cmd: Omit<Transaction['cmd'], 'meta' | 'signers'>;
} & {
  /** Database-specific transaction ID */
  databaseTransactionId: string;
  /** Hash of the block containing this transaction */
  blockHash: string;
  /** Height of the block containing this transaction */
  blockHeight: number;
};

/**
 * Transaction metadata as returned by the repository.
 * Direct mapping to the GraphQL TransactionMeta type.
 */
export type TransactionMetaOutput = TransactionMeta;

/**
 * Signer information as returned by the repository.
 * Direct mapping to the GraphQL Signer type.
 */
export type SignerOutput = Signer;

/**
 * Interface defining the contract for transaction data access.
 * Implementations of this interface handle the details of retrieving
 * transaction data from specific storage mechanisms (e.g., database).
 */
export default interface TransactionRepository {
  /**
   * Retrieves transactions based on specified parameters with pagination.
   *
   * @param params - Filtering and pagination parameters
   * @returns Promise resolving to paginated transaction results
   */
  getTransactions(params: GetTransactionsParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<TransactionOutput>[];
  }>;

  /**
   * Retrieves the last transactions based on specified parameters.
   *
   * @param quantity - Quantity of transactions to retrieve
   * @returns Promise resolving to the last transactions
   */
  getLastTransactions(quantity: number): Promise<TransactionOutput[]>;

  /**
   * Counts transactions matching the specified filter parameters.
   *
   * @param params - Filtering parameters
   * @returns Promise resolving to the count of matching transactions
   */
  getTransactionsCount(params: GetTransactionsCountParams): Promise<number>;

  /**
   * Retrieves transactions by their request key.
   *
   * @param params - Request key search parameters
   * @returns Promise resolving to matching transactions
   */
  getTransactionsByRequestKey(params: GetTransactionsByRequestKey): Promise<TransactionOutput[]>;

  /**
   * Retrieves a transaction associated with a specific transfer.
   *
   * @param transferId - ID of the transfer
   * @returns Promise resolving to the associated transaction
   */
  getTransactionByTransferId(transferId: string): Promise<TransactionOutput>;

  /**
   * Retrieves metadata for a transaction by its ID.
   *
   * @param transactionId - ID of the transaction
   * @returns Promise resolving to the transaction metadata
   */
  getTransactionMetaInfoById(transactionId: string): Promise<TransactionMetaOutput>;

  /**
   * Retrieves transactions associated with a specific public key with pagination.
   *
   * @param params - Public key and pagination parameters
   * @returns Promise resolving to paginated transaction results
   */
  getTransactionsByPublicKey(params: GetTransactionsByPublicKeyParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<TransactionOutput>[];
  }>;

  /**
   * Counts transactions associated with a specific public key.
   *
   * @param publicKey - The public key to count transactions for
   * @returns Promise resolving to the count of matching transactions
   */
  getTransactionsByPublicKeyCount(publicKey: string): Promise<number>;

  /**
   * Retrieves transactions associated with specific events.
   *
   * @param eventIds - Array of event IDs
   * @returns Promise resolving to matching transactions
   */
  getTransactionsByEventIds(eventIds: string[]): Promise<TransactionOutput[]>;

  /**
   * Retrieves signers for a specific transaction.
   *
   * @param params - The GetSignersParam Object
   * @param params.transactionId - The transaction unique identifier on the 'transactions' table
   * @param params.requestKey - The unique identifier of the transaction on the blockchain
   * @param params.orderIndex - Optional argument to retrieve single signer from signers list
   * @returns Promise resolving to an array of signers
   */
  getSigners(params: GetSignersParams): Promise<SignerOutput[]>;
}
