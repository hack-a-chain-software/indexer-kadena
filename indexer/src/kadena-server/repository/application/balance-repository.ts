/**
 * Balance Repository Interface
 *
 * This module defines the interface for accessing balance data in the Kadena blockchain indexer.
 * Following the repository pattern, it establishes a contract for balance and token data access
 * without specifying implementation details, allowing for different storage mechanisms.
 *
 * The interface provides methods for:
 * 1. Retrieving fungible token balances (standard tokens/coins)
 * 2. Retrieving non-fungible token balances (NFTs)
 * 3. Looking up balances by account, chain, and public key
 * 4. Accessing token information with pagination
 * 5. Alternative methods using direct node queries for real-time balance data
 *
 * This abstraction layer supports both indexed balance data (from the database) and
 * real-time balance data (from blockchain nodes), providing flexibility in data access.
 */

import { FungibleAccount, FungibleChainAccount, PageInfo, Token } from '../../config/graphql-types';
import { PaginationsParams } from '../pagination';
import { ConnectionEdge } from '../types';

/**
 * Interface representing a non-fungible token balance.
 * This captures ownership of a specific NFT by an account on a specific chain.
 */
export interface INonFungibleTokenBalance {
  /** Unique identifier for the NFT balance record */
  id: string;
  /** Account name owning this NFT */
  accountName: string;
  /** Balance amount (typically 1 for NFTs) */
  balance: number;
  /** Chain ID where this NFT exists */
  chainId: string;
  /** Unique identifier for this specific NFT */
  tokenId: string;
  /** Module/contract name associated with this NFT */
  module: string;
}

/**
 * Interface representing an account with non-fungible tokens.
 * This aggregates all NFT holdings for an account across all chains.
 */
export interface INonFungibleAccount {
  /** Unique identifier for the account record */
  id: string;
  /** Account name */
  accountName: string;
  /** Array of chain-specific account details */
  chainAccounts: INonFungibleChainAccount[];
  /** Array of all NFT balances owned by this account */
  nonFungibleTokenBalances: Array<INonFungibleTokenBalance>;
}

/**
 * Interface representing chain-specific details for an account with non-fungible tokens.
 * This aggregates NFT holdings for an account on a specific chain.
 */
export interface INonFungibleChainAccount {
  /** Account name */
  accountName: string;
  /** Chain ID where these NFTs exist */
  chainId: string;
  /** Unique identifier for the chain account record */
  id: string;
  /** Array of NFT balances owned by this account on this chain */
  nonFungibleTokenBalances: Array<INonFungibleTokenBalance>;
}

/**
 * Type representing a fungible account output.
 * Omits relationship fields that are handled separately by GraphQL resolvers.
 */
export type FungibleAccountOutput = Omit<
  FungibleAccount,
  'chainAccounts' | 'transactions' | 'transfers'
>;

/**
 * Type representing a fungible chain account output.
 * Omits relationship fields that are handled separately by GraphQL resolvers.
 */
export type FungibleChainAccountOutput = Omit<FungibleChainAccount, 'transactions' | 'transfers'>;

/**
 * Type representing a token output.
 * Direct mapping to the GraphQL Token type.
 */
export type TokenOutput = Token;

/**
 * Parameters for fetching tokens with pagination.
 */
export interface GetTokensParams extends PaginationsParams {}

/**
 * Parameters for fetching account balances with pagination and filters.
 */
export interface GetAccountBalancesParams extends PaginationsParams {
  accountName: string;
  chainIds?: string[] | null;
  module?: string | null;
}

/**
 * Interface defining the contract for balance data access.
 * Implementations of this interface handle the details of retrieving
 * balance data from specific storage mechanisms (e.g., database or blockchain node).
 */
export default interface BalanceRepository {
  /**
   * Retrieves non-fungible token information for a specific account.
   *
   * @param accountName - Name of the account
   * @returns Promise resolving to the account's NFT information or null if not found
   */
  getNonFungibleAccountInfo(accountName: string): Promise<INonFungibleAccount | null>;

  /**
   * Retrieves chain-specific non-fungible token information for an account.
   *
   * @param accountName - Name of the account
   * @param chainId - ID of the specific chain
   * @returns Promise resolving to chain-specific NFT information or null if not found
   */
  getNonFungibleChainAccountInfo(
    accountName: string,
    chainId: string,
  ): Promise<INonFungibleChainAccount | null>;

  /**
   * Retrieves all chain-specific non-fungible token information for an account.
   *
   * @param accountName - Name of the account
   * @returns Promise resolving to array of chain-specific NFT information
   */
  getNonFungibleChainAccountsInfo(accountName: string): Promise<INonFungibleChainAccount[]>;

  /**
   * Retrieves balance information for a specific non-fungible token.
   *
   * @param accountName - Name of the account
   * @param chainId - ID of the specific chain
   * @param tokenId - ID of the specific non-fungible token
   * @returns Promise resolving to the NFT balance information or null if not found
   */
  getNonFungibleTokenBalance(
    accountName: string,
    chainId: string,
    tokenId: string,
  ): Promise<INonFungibleTokenBalance | null>;

  /**
   * Retrieves paginated list of tokens.
   *
   * @param params - Pagination parameters
   * @returns Promise resolving to paginated token results
   */
  getTokens(params: GetTokensParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<TokenOutput>[];
  }>;

  /**
   * Retrieves live balances for an account with optional module and chain filters, paginated.
   */
  getAccountBalances(params: GetAccountBalancesParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<{ module: string; chainId: string; balance: string }>[];
  }>;

  /**
   * Retrieves fungible token information for a specific account directly from a blockchain node.
   * This provides real-time balance information rather than indexed data.
   *
   * @param accountName - Name of the account
   * @param fungibleName - Optional name of the fungible token
   * @returns Promise resolving to the account's fungible token information
   */
  getAccountInfo_NODE(
    accountName: string,
    fungibleName?: string | null,
  ): Promise<FungibleAccountOutput | null>;

  /**
   * Retrieves fungible token information for an account across specified chains from blockchain nodes.
   *
   * @param accountName - Name of the account
   * @param fungibleName - Name of the fungible token
   * @param chainIds - Optional array of chain IDs to filter by
   * @returns Promise resolving to array of chain-specific account information
   */
  getChainsAccountInfo_NODE(
    accountName: string,
    fungibleName: string,
    chainIds?: string[],
  ): Promise<FungibleChainAccountOutput[]>;

  /**
   * Retrieves fungible accounts associated with a specific public key from blockchain nodes.
   *
   * @param publicKey - The public key to look up accounts for
   * @param fungibleName - Name of the fungible token
   * @returns Promise resolving to array of account information
   */
  getAccountsByPublicKey_NODE(
    publicKey: string,
    fungibleName: string,
  ): Promise<FungibleAccountOutput[]>;

  /**
   * Retrieves chain-specific fungible accounts for a public key from blockchain nodes.
   *
   * @param publicKey - The public key to look up accounts for
   * @param fungibleName - Name of the fungible token
   * @param chainId - ID of the specific chain
   * @returns Promise resolving to array of chain-specific account information
   */
  getChainAccountsByPublicKey_NODE(
    publicKey: string,
    fungibleName: string,
    chainId: string,
  ): Promise<FungibleChainAccountOutput[]>;
}
