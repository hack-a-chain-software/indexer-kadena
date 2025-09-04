/**
 * Validation and transformation utilities for transfer data
 *
 * This file provides schema validation and data transformation functions for
 * token transfers in the Kadena blockchain indexer. It ensures that data from
 * various sources (database, API responses) conforms to the expected structure
 * before being used in the application.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw database rows to the standardized TransferOutput type that's used
 * throughout the application. It also generates globally unique identifiers
 * that conform to the Relay specification for GraphQL objects.
 */

import zod from 'zod';
import { TransferOutput } from '../../application/transfer-repository';

/**
 * Zod schema for validating transfer data
 *
 * Defines the expected structure and types for transfer records retrieved from
 * the database or API responses. Any data that doesn't match this schema will
 * cause validation to fail.
 */
const schema = zod.object({
  id: zod.number(),
  transferAmount: zod.string(),
  blockHash: zod.string(),
  chainId: zod.number(),
  creationTime: zod.string(),
  height: zod.number(),
  moduleName: zod.string(),
  moduleHash: zod.string(),
  orderIndex: zod.number(),
  receiverAccount: zod.string(),
  senderAccount: zod.string(),
  requestKey: zod.string(),
  tokenId: zod.string().nullable().optional(),
  transactionId: zod.number(),
});

/**
 * Generates a globally unique ID for a transfer
 *
 * Creates a Base64-encoded string that represents a token transfer,
 * containing all the necessary components to uniquely identify it.
 * This follows the Relay Global Object Identification specification.
 *
 * @param blockHash - The hash of the block containing the transfer
 * @param chainId - The chain ID where the transfer occurred
 * @param orderIndex - The position of the transfer within its transaction
 * @param moduleHash - The hash of the module (contract) executing the transfer
 * @param requestKey - The transaction request key
 * @returns A Base64 encoded global ID string
 */
const getBase64ID = (
  blockHash: string,
  chainId: number,
  orderIndex: number,
  moduleHash: string,
  requestKey: string,
): string => {
  const inputString = `Transfer:[\"${blockHash}\",\"${chainId}\",\"${orderIndex}\",\"${moduleHash}\",\"${requestKey}\"]`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

/**
 * Validates and transforms raw transfer data into the standardized output format
 *
 * This function performs several important tasks:
 * 1. Validates the input data against the schema
 * 2. Generates a globally unique ID for the transfer
 * 3. Transforms database column formats to application-friendly formats
 * 4. Converts timestamps to JavaScript Date objects
 *
 * @param row - The raw data row typically from a database query result
 * @returns A validated and transformed TransferOutput object
 * @throws Will throw an error if validation fails
 */
function validate(row: any): TransferOutput {
  const res = schema.parse(row);
  return {
    id: getBase64ID(res.blockHash, res.chainId, res.orderIndex, res.moduleHash, res.requestKey),
    creationTime: new Date(Number(res.creationTime) * 1000),
    moduleHash: res.moduleHash,
    requestKey: res.requestKey,
    amount: res.transferAmount,
    blockHash: res.blockHash,
    chainId: res.chainId,
    height: res.height,
    moduleName: res.moduleName,
    orderIndex: res.orderIndex,
    receiverAccount: res.receiverAccount,
    senderAccount: res.senderAccount,
    transferId: res.id.toString(),
    transactionId: res.transactionId.toString(),
    tokenId: res.tokenId,
  };
}

/**
 * Exported validator object providing the validation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const transferSchemaValidator = { validate };
