/**
 * Blockchain Transfer Processing Service
 *
 * This module is responsible for processing blockchain transfer events, both for fungible tokens (coins)
 * and non-fungible tokens (NFTs). It identifies transfer events from blockchain transaction data,
 * extracts the relevant information, and constructs standardized transfer objects.
 *
 * The module handles two main types of transfers:
 * 1. NFT Transfers - Non-fungible token transfers with unique token IDs
 * 2. Coin Transfers - Fungible token transfers of standard coins like KDA
 *
 * It also manages contract synchronization for the tokens involved in transfers,
 * ensuring that contract information is properly stored and referenced.
 */

import { TransactionAttributes, TransactionCreationAttributes } from '@/models/transaction';
import { TransferAttributes } from '@/models/transfer';

/**
 * Filters and processes NFT transfer events from a payload's event data. It identifies NFT transfer events based on
 * predefined criteria (e.g., event name and parameter structure), and constructs transfer attribute objects for each.
 *
 * @param {number} chainId - The ID of the blockchain chain.
 * @param {Array} eventsData - The array of event data from a transaction payload.
 * @param {TransactionAttributes} transactionAttributes - Transaction attributes associated with the events.
 * @returns {Promise<TransferAttributes[]>} A Promise that resolves to an array of transfer attributes specifically for NFT transfers.
 *
 * NFT transfers are identified by:
 * - TRANSFER event name
 * - 4 parameters: tokenId, from account, to account, and amount
 * - Parameters having the expected types (string, string, string, number)
 *
 * TODO: [OPTIMIZATION] Consider implementing batch processing for transactions with many NFT transfers
 * to reduce database operations.
 */
export function getNftTransfers(
  chainId: number,
  eventsData: any,
  transactionAttributes: TransactionAttributes,
) {
  // Define constants for identifying NFT transfer events
  // NFT transfers must have the event name "TRANSFER"
  const TRANSFER_NFT_SIGNATURE = 'TRANSFER';
  // NFT transfers must have exactly 4 parameters
  const TRANSFER_NFT_PARAMS_LENGTH = 4;

  /**
   * Define a predicate function to identify valid NFT transfer events
   * This function checks if an event matches the NFT transfer signature by:
   * 1. Verifying the event name is "TRANSFER"
   * 2. Checking it has exactly 4 parameters
   * 3. Validating that the parameters are of the correct types:
   *    - First param (tokenId): must be a string
   *    - Second param (from_acct): must be a string
   *    - Third param (to_acct): must be a string
   *    - Fourth param (amount): must be a number
   */
  const transferNftSignature = (eventData: any) =>
    eventData.name == TRANSFER_NFT_SIGNATURE &&
    eventData.params.length == TRANSFER_NFT_PARAMS_LENGTH &&
    typeof eventData.params[0] == 'string' &&
    typeof eventData.params[1] == 'string' &&
    typeof eventData.params[2] == 'string' &&
    typeof eventData.params[3] == 'number';

  // Process each event that matches the NFT transfer signature
  const transferPromises = eventsData
    // Filter the events array to only include valid NFT transfers
    .filter(transferNftSignature)
    // Map each matching event to a promise that resolves to a TransferAttributes object
    .map(async (eventData: any): Promise<TransferAttributes> => {
      // Extract the parameters from the event data
      const params = eventData.params;
      // param[0] is the token ID (the unique identifier for this NFT)
      const tokenId = params[0];
      // param[1] is the sender's account address
      const from_acct = params[1];
      // param[2] is the receiver's account address
      const to_acct = params[2];
      // param[3] is the amount being transferred (usually 1.0 for NFTs)
      const amount = params[3];

      // Get the full module name (including namespace if present)
      // This identifies which smart contract/module is handling the NFT
      const modulename = eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name;

      // Create and return a transfer object with all the extracted information
      return {
        // Set the amount being transferred
        amount: amount,
        // The blockchain chain ID where this transfer occurred
        chainId: transactionAttributes.chainId,
        // The sender's account address
        from_acct: from_acct,
        // The hash of the module that processed this transfer
        modulehash: eventData.moduleHash,
        // The name of the module that processed this transfer
        modulename: modulename,
        // The unique request key of the transaction
        requestkey: transactionAttributes.requestkey,
        // The receiver's account address
        to_acct: to_acct,
        // Flag indicating this is a token with a unique ID (true for NFTs)
        hasTokenId: true,
        // The unique identifier for this specific NFT
        tokenId: tokenId,
        // The type of token being transferred (poly-fungible for NFTs)
        type: 'poly-fungible',
        // The position of this transfer within the transaction's events
        orderIndex: eventData.orderIndex,
      } as TransferAttributes;
    }) as TransferAttributes[];

  // Wait for all transfer processing promises to complete and return the results
  return Promise.all(transferPromises);
}

/**
 * Filters and processes coin transfer events from a payload's event data. Similar to `getNftTransfers`, but focuses on
 * coin-based transactions. It identifies events that represent coin transfers and constructs transfer attribute objects.
 *
 * @param {Array} eventsData - The array of event data from a transaction payload.
 * @param {TransactionAttributes} transactionAttributes - Transaction attributes associated with the events.
 * @returns {Promise<TransferAttributes[]>} A Promise that resolves to an array of transfer attributes specifically for coin transfers.
 *
 * Coin transfers are identified by:
 * - TRANSFER event name
 * - 3 parameters: from account, to account, and amount
 * - Parameters having the expected types (string, string, number)
 *
 * TODO: [OPTIMIZATION] The contract precision query could be optimized by implementing a more efficient
 * caching mechanism or by pre-fetching common contracts.
 */
export function getCoinTransfers(
  eventsData: any,
  transactionAttributes: TransactionCreationAttributes,
) {
  // Define constants for identifying coin transfer events
  // Coin transfers must have the event name "TRANSFER"
  const TRANSFER_COIN_SIGNATURE = 'TRANSFER';
  // Coin transfers must have exactly 3 parameters (unlike NFTs which have 4)
  const TRANSFER_COIN_PARAMS_LENGTH = 3;

  /**
   * Define a predicate function to identify valid coin transfer events
   * This function checks if an event matches the coin transfer signature by:
   * 1. Verifying the event name is "TRANSFER"
   * 2. Checking it has exactly 3 parameters
   * 3. Validating that the parameters are of the correct types:
   *    - First param (from_acct): must be a string
   *    - Second param (to_acct): must be a string
   *    - Third param (amount): must be a number
   */
  const transferCoinSignature = (eventData: any) =>
    eventData.name == TRANSFER_COIN_SIGNATURE &&
    eventData.params.length == TRANSFER_COIN_PARAMS_LENGTH &&
    typeof eventData.params[0] == 'string' &&
    typeof eventData.params[1] == 'string' &&
    typeof eventData.params[2] == 'number';

  // Process each event that matches the coin transfer signature
  const transferPromises = eventsData
    // Filter the events array to only include valid coin transfers
    .filter(transferCoinSignature)
    // Map each matching event to a promise that resolves to a TransferAttributes object
    .map(async (eventData: any): Promise<TransferAttributes> => {
      // Get the full module name (including namespace if present)
      // This identifies which token module is being transferred (e.g., 'coin', 'fungible-v2', etc.)
      const modulename = eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name;

      // Extract the parameters from the event data
      const params = eventData.params;
      // param[0] is the sender's account address
      const from_acct = params[0];
      // param[1] is the receiver's account address
      const to_acct = params[1];
      // param[2] is the amount being transferred
      const amount = params[2];

      // Create and return a transfer object with all the extracted information
      return {
        // The amount of tokens being transferred
        amount: amount,
        // The blockchain chain ID where this transfer occurred
        chainId: transactionAttributes.chainId,
        // The sender's account address
        from_acct: from_acct,
        // The hash of the module that processed this transfer
        modulehash: eventData.moduleHash,
        // The name of the module that processed this transfer
        modulename,
        // The unique request key of the transaction
        requestkey: transactionAttributes.requestkey,
        // The receiver's account address
        to_acct: to_acct,
        // Flag indicating this is NOT a token with a unique ID (false for fungible tokens)
        hasTokenId: false,
        // Tokens don't have a unique ID for fungible transfers
        tokenId: undefined,
        // The type of token being transferred ('fungible' for regular tokens)
        type: 'fungible',
        // The position of this transfer within the transaction's events
        orderIndex: eventData.orderIndex,
      } as TransferAttributes;
    }) as TransferAttributes[];

  // Wait for all transfer processing promises to complete and return the results
  return Promise.all(transferPromises);
}
