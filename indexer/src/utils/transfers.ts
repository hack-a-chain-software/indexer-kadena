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
 */

import { TransactionAttributes, TransactionCreationAttributes } from '@/models/transaction';
import { TransferAttributes } from '@/models/transfer';

/**
 * Filters and processes NFT transfer events from a payload's event data. It identifies NFT transfer events based on
 * predefined criteria (e.g., event name and parameter structure), and constructs transfer attribute objects for each.
 *
 * @param {Array} eventsData - The array of event data from a transaction payload.
 * @param {TransactionAttributes} transactionAttributes - Transaction attributes associated with the events.
 * @returns {TransferAttributes[]} An array of transfer attributes specifically for NFT transfers.
 *
 * NFT transfers are identified by:
 * - TRANSFER event name
 * - 4 parameters: tokenId, from account, to account, and amount
 * - Parameters having the expected types (string, string, string, number)
 *
 */
export function getNftTransfers(
  eventsData: any,
  transactionAttributes: TransactionAttributes,
): TransferAttributes[] {
  // Define constants for identifying RECONCILE events only
  const RECONCILE_SIGNATURE = 'RECONCILE';
  // RECONCILE events must have exactly 4 parameters
  const RECONCILE_PARAMS_LENGTH = 4;

  /**
   * Define a predicate function to identify valid RECONCILE events
   * RECONCILE events have a specific parameter structure:
   * 1. Verifying the event name is "RECONCILE"
   * 2. Checking it has exactly 4 parameters
   * 3. Validating parameter structure:
   *    - First param (tokenId): must be a string
   *    - Second param (amount): must be a number
   *    - Third param: must be an object with account field
   *    - Fourth param: must be an object with account field
   */
  const reconcileSignature = (eventData: any) =>
    eventData.name == RECONCILE_SIGNATURE &&
    eventData.params.length == RECONCILE_PARAMS_LENGTH &&
    (eventData.module.namespace == 'marmalade-v2' || eventData.module.namespace == 'marmalade') &&
    typeof eventData.params[0] == 'string' &&
    isAmountInCorrectFormat(eventData.params[1]) &&
    typeof eventData.params[2] == 'object' &&
    eventData.params[2]?.hasOwnProperty('account') &&
    typeof eventData.params[3] == 'object' &&
    eventData.params[3]?.hasOwnProperty('account');

  // Process RECONCILE events only
  const transfers = eventsData.filter(reconcileSignature).map((eventData: any) => {
    // RECONCILE events have specific parameter structure:
    // params[0] = tokenId (string)
    // params[1] = amount
    // params[2] = {account: fromAcct, current: X, previous: Y}
    // params[3] = {account: toAcct, current: X, previous: Y}
    const params = eventData.params;

    // param[0] is the token ID
    const tokenId = params[0];
    // param[1] is the amount being transferred
    const amount = getAmount(params[1]);
    // param[2].account is the sender's account address
    const from_acct = params[2]?.account || '';
    // param[3].account is the receiver's account address
    const to_acct = params[3]?.account || '';

    // Get the full module name (including namespace if present)
    const modulename = eventData.module.namespace
      ? `${eventData.module.namespace}.${eventData.module.name}`
      : eventData.module.name;

    return {
      amount: amount,
      chainId: transactionAttributes.chainId,
      from_acct: from_acct,
      modulehash: eventData.moduleHash,
      modulename: modulename,
      requestkey: transactionAttributes.requestkey,
      to_acct: to_acct,
      hasTokenId: true,
      tokenId: tokenId,
      type: 'poly-fungible',
      orderIndex: eventData.orderIndex,
    };
  }) as TransferAttributes[];

  return transfers;
}

/**
 * Filters and processes coin transfer events from a payload's event data. Similar to `getNftTransfers`, but focuses on
 * coin-based transactions. It identifies events that represent coin transfers and constructs transfer attribute objects.
 *
 * @param {Array} eventsData - The array of event data from a transaction payload.
 * @param {TransactionAttributes} transactionAttributes - Transaction attributes associated with the events.
 * @returns {TransferAttributes[]} A Promise that resolves to an array of transfer attributes specifically for coin transfers.
 *
 * Coin transfers are identified by:
 * - TRANSFER event name
 * - 3 parameters: from account, to account, and amount
 * - Parameters having the expected types (string, string, number)
 *
 */
export function getCoinTransfers(
  eventsData: any,
  transactionAttributes: TransactionCreationAttributes,
): TransferAttributes[] {
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
    isAmountInCorrectFormat(eventData.params[2]);

  // Process each event that matches the coin transfer signature
  const transfers = eventsData
    // Filter the events array to only include valid coin transfers
    .filter(transferCoinSignature)
    // Map each matching event to a TransferAttributes object
    .map((eventData: any) => {
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
      const amount = getAmount(params[2]);

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
      };
    }) as TransferAttributes[];

  return transfers;
}

/**
 * Parses and validates an amount value from various formats.
 * Returns the parsed amount if valid, or null if invalid.
 *
 * @param amount - The amount value to parse (number, decimal object, or integer object)
 * @returns The parsed amount as number/string, or null if invalid
 */
function parseAmount(amount: any): number | string | null {
  if (typeof amount === 'number') {
    return amount;
  }

  if (amount?.decimal && typeof amount.decimal === 'string') {
    return amount.decimal;
  }

  if (amount?.integer && typeof amount.integer === 'string') {
    return amount.integer;
  }

  return null;
}

function isAmountInCorrectFormat(amount: any): boolean {
  return parseAmount(amount) !== null;
}

function getAmount(amount: any): number | string {
  const parsedAmount = parseAmount(amount);
  return parsedAmount !== null ? parsedAmount : 0;
}
