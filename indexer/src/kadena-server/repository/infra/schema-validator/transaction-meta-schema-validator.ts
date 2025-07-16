/**
 * Validation and transformation utilities for transaction metadata
 *
 * This file provides schema validation and data transformation functions for
 * transaction metadata in the Kadena indexer. Transaction metadata includes
 * important contextual information about transactions such as gas limits,
 * pricing, sender information, and timing parameters.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw database rows to the standardized TransactionMetaOutput type that's
 * used throughout the application.
 */

import zod from 'zod';
import { TransactionMetaOutput } from '../../application/transaction-repository';
import Decimal from 'decimal.js';

/**
 * Zod schema for validating transaction metadata
 *
 * Defines the expected structure and types for transaction metadata records
 * retrieved from the database or API responses. The schema includes fields
 * like chainId, creationTime, gas parameters, sender address, and time-to-live.
 */
const schema = zod.object({
  chainId: zod.number(),
  creationTime: zod.string(),
  gasLimit: zod.string().nullable(),
  gasPrice: zod.string().nullable(),
  sender: zod.string(),
  ttl: zod.string().nullable(),
});

/**
 * Validates and transforms raw transaction metadata into the standardized output format
 *
 * This function performs several important tasks:
 * 1. Validates the input data against the schema
 * 2. Converts timestamp strings to JavaScript Date objects
 * 3. Handles nullable fields with appropriate default values
 * 4. Ensures consistent typing of numeric values
 *
 * @param row - The raw data row typically from a database query result
 * @returns A validated and transformed TransactionMetaOutput object
 * @throws Will throw an error if validation fails
 */
function validate(row: any): TransactionMetaOutput {
  const res = schema.parse(row);
  return {
    chainId: res.chainId,
    creationTime: new Date(Number(res.creationTime) * 1000),
    gasLimit: res.gasLimit ?? 0,
    gasPrice: new Decimal(res.gasPrice ?? 0).toFixed(),
    sender: res.sender,
    ttl: res.ttl ?? 0,
  };
}

/**
 * Exported validator object providing validation and transformation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const transactionMetaValidator = { validate };
