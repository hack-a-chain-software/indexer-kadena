/**
 * Validation and transformation utilities for fungible token account data
 *
 * This file provides schema validation and data transformation functions for
 * fungible token accounts in the Kadena blockchain indexer. Fungible token accounts
 * represent ownership of divisible tokens (like cryptocurrencies) by specific
 * accounts across the blockchain network.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw database rows or Sequelize model instances to the standardized FungibleAccountOutput
 * type that's used throughout the application. It also generates globally unique identifiers
 * that conform to the Relay specification for GraphQL objects.
 */

import { FungibleAccountOutput } from '../../application/balance-repository';
import zod from 'zod';

/**
 * Zod schema for validating fungible account data
 *
 * Defines the expected structure and types for fungible account records retrieved
 * from the database or API responses. The schema includes the basic account
 * identification properties.
 */
const fungibleSchema = zod.object({
  account: zod.string(),
  module: zod.string(),
});

/**
 * Zod schema for validating total balance data
 *
 * Defines the expected structure for total balance aggregation results,
 * which may be retrieved separately from the main account data.
 */
const totalBalanceSchema = zod.object({
  totalBalance: zod.string(),
});

/**
 * Generates a globally unique ID for a fungible token account
 *
 * Creates a Base64-encoded string that represents a fungible token account,
 * combining the token module name and account name to uniquely identify it.
 * This follows the Relay Global Object Identification specification.
 *
 * @param fungibleName - The name of the fungible token module
 * @param accountName - The account that owns the tokens
 * @returns A Base64 encoded global ID string
 */
const getBase64ID = (fungibleName: string, accountName: string): string => {
  const inputString = `FungibleAccount:[\"${fungibleName}\",\"${accountName}\"]`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

/**
 * Validates and transforms raw fungible account data into the standardized output format
 *
 * This function validates the input data against the schema and generates
 * a globally unique ID for the fungible account. It returns a partial output
 * without the total balance, which may be added separately.
 *
 * @param row - The raw data row typically from a database query result
 * @returns A validated and transformed partial FungibleAccountOutput object
 * @throws Will throw an error if validation fails
 */
const validate = (row: any): Omit<FungibleAccountOutput, 'totalBalance'> => {
  const res = fungibleSchema.parse(row);
  return {
    id: getBase64ID(res.module, res.account),
    accountName: res.account,
    fungibleName: res.module,
  };
};

/**
 * Validates and extracts the total balance value from raw data
 *
 * This function is used to validate and extract just the total balance
 * from a data source, which can then be combined with the main account data.
 *
 * @param row - The raw data row containing total balance information
 * @returns The validated total balance as a string
 * @throws Will throw an error if validation fails
 */
const validateTotalBalance = (row: any): string => {
  const res = totalBalanceSchema.parse(row);
  return res.totalBalance;
};

/**
 * Exported validator object providing validation and transformation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const fungibleAccountValidator = {
  validate,
  validateTotalBalance,
};
