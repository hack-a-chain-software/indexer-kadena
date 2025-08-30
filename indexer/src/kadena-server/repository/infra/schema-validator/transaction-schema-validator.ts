/**
 * Validation and transformation utilities for blockchain transaction data
 *
 * This file provides schema validation and data transformation functions for
 * blockchain transactions in the Kadena indexer. It ensures that data retrieved
 * from various sources (database, API responses) conforms to the expected structure
 * before being used in the application.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw database rows to the standardized TransactionOutput type that's used
 * throughout the application. It also generates globally unique identifiers
 * that conform to the Relay specification for GraphQL objects.
 */

import { getRequiredEnvString } from '../../../../utils/helpers';
import { TransactionOutput } from '../../application/transaction-repository';
import zod from 'zod';

/**
 * Network ID from environment variables
 * Used to include the network identifier in transaction output
 */
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

/**
 * Generates a globally unique ID for a transaction
 *
 * Creates a Base64-encoded string that represents a blockchain transaction,
 * containing both the block hash and request key as identifiers. This follows
 * the Relay Global Object Identification specification.
 *
 * @param blockHash - The hash of the block containing the transaction
 * @param requestKey - The unique request key of the transaction
 * @returns A Base64 encoded global ID string
 */
const getBase64ID = (blockHash: string, requestKey: string): string => {
  const inputString = `Transaction:[\"${blockHash}\",\"${requestKey}\"]`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

/**
 * Zod schema for validating transaction data
 *
 * Defines the expected structure and types for transaction records retrieved
 * from the database or API responses. The schema includes all essential transaction
 * properties such as request key, hash, signatures, and execution results.
 */
const schema = zod.object({
  id: zod.number(),
  hashTransaction: zod.string(),
  txid: zod.string().nullable(),
  sigs: zod.array(zod.any()).nullable(),
  continuation: zod.any().nullable(),
  eventCount: zod.number(),
  gas: zod.string().nullable(),
  height: zod.number(),
  logs: zod.string(),
  code: zod.any().nullable(),
  data: zod.any().nullable(),
  pactId: zod.string().nullable(),
  proof: zod.string().nullable(),
  step: zod.number().nullable(),
  rollback: zod.boolean().nullable(),
  nonceTransaction: zod.string().nullable(),
  blockHash: zod.string(),
  requestKey: zod.string(),
  result: zod.any(),
});

/**
 * Validates and transforms raw transaction data into the standardized output format
 *
 * This function performs several important tasks:
 * 1. Validates the input data against the schema
 * 2. Generates a globally unique ID for the transaction
 * 3. Determines if the transaction was successful
 * 4. Structures the transaction result data appropriately based on success/failure
 * 5. Formats command payload data for consistent representation
 *
 * The transformation organizes transaction data into logical sections:
 * - Core identification (id, blockHash, etc.)
 * - Result data (status, gas, logs, etc.)
 * - Command payload (code, data, continuation info)
 *
 * @param row - The raw data row typically from a database query result
 * @returns A validated and transformed TransactionOutput object
 * @throws Will throw an error if validation fails
 */
function validate(row: any): TransactionOutput {
  const res = schema.parse(row);
  const isSuccess = res.result.status === 'success';
  const continuation = JSON.stringify(res.continuation);
  return {
    id: getBase64ID(res.blockHash, res.requestKey),
    databaseTransactionId: res.id.toString(),
    blockHeight: res.height,
    blockHash: res.blockHash,
    hash: res.hashTransaction,
    sigs: res.sigs ?? [],
    result: {
      // TransactionMempoolInfo
      status: '', // TODO

      // TransactionResult
      badResult: !isSuccess ? JSON.stringify(res.result.error) : null,
      continuation: continuation === '{}' ? null : continuation,
      eventCount: res.eventCount,
      transactionId: res.txid ? res.txid : null,
      height: res.height,

      gas: res.gas ?? '0',
      goodResult: isSuccess && res.result.data !== '' ? JSON.stringify(res.result.data) : null,
      logs: res.logs,
    },
    cmd: {
      payload: {
        // ExecutionPayload
        code: res.code ? JSON.stringify(res.code) : '{}',

        // ContinuationPayload and ExecutionPayload
        data: res.data ? JSON.stringify(res.data) : '{}',

        // ContinuationPayload
        pactId: res.pactId,
        proof: res.proof,
        rollback: res.rollback,
        step: res.step,
      },

      networkId: NETWORK_ID,
      nonce: row.nonceTransaction ?? '',
    },
  };
}

/**
 * Exported validator object providing validation and transformation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const transactionValidator = { validate };
