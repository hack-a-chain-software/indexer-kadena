/**
 * Validation and transformation utilities for chain-specific fungible token account data
 *
 * This file provides schema validation and data transformation functions for
 * chain-specific fungible token accounts in the Kadena blockchain indexer.
 * Unlike general fungible accounts, these represent token balances on specific
 * chains within the Kadena multi-chain system, including balance amounts and
 * guard (security predicate) information.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw database rows to the standardized FungibleChainAccountOutput type that's used
 * throughout the application. It also generates globally unique identifiers
 * that conform to the Relay specification for GraphQL objects.
 */

import zod from 'zod';
import { FungibleChainAccountOutput } from '../../application/block-repository';

/**
 * Generates a globally unique ID for a chain-specific fungible token account
 *
 * Creates a Base64-encoded string that represents a fungible token account on a specific chain,
 * combining the chain ID, token module name, and account name to uniquely identify it.
 * This follows the Relay Global Object Identification specification.
 *
 * @param chainId - The chain ID where the balance is held
 * @param fungibleName - The name of the fungible token module
 * @param accountName - The account that owns the tokens
 * @returns A Base64 encoded global ID string
 */
const getBase64IDChain = (chainId: number, fungibleName: string, accountName: string): string => {
  const inputString = `FungibleChainAccount:[\"${chainId}\",\"${fungibleName}\",\"${accountName}\"]`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

/**
 * Zod schema for validating chain-specific fungible account data
 *
 * Defines the expected structure and types for fungible chain account records retrieved
 * from the database or API responses. The schema includes account identification properties
 * as well as the chain ID and balance amount.
 */
const fungibleChainSchema = zod.object({
  accountName: zod.string(),
  module: zod.string(),
  chainId: zod.number(),
  balance: zod.string(),
});

/**
 * Validates and transforms raw fungible chain account data into the standardized output format
 *
 * This function performs several important tasks:
 * 1. Validates the input data against the schema
 * 2. Generates a globally unique ID for the chain-specific account
 * 3. Converts string balance values to numbers
 * 4. Preserves guard (security predicate) information if present
 * 5. Transforms database column formats to application-friendly formats
 *
 * @param row - The raw data row typically from a database query result
 * @returns A validated and transformed FungibleChainAccountOutput object
 * @throws Will throw an error if validation fails
 */
const validate = (row: any): FungibleChainAccountOutput => {
  const res = fungibleChainSchema.parse(row);
  return {
    id: getBase64IDChain(res.chainId, res.module, res.accountName),
    accountName: res.accountName,
    fungibleName: res.module,
    chainId: res.chainId.toString(),
    balance: Number(res.balance),
    guard: row.guard, // Guard may be present but is not required by the schema
  };
};

/**
 * Exported validator object providing validation and transformation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const fungibleChainAccountValidator = {
  validate,
};
