/**
 * Implementation of the MempoolGateway interface for querying pending transactions
 *
 * This file provides a concrete implementation of the MempoolGateway interface that
 * communicates with the Kadena blockchain node to retrieve information about pending
 * transactions in the mempool. It includes extensive validation of response data
 * using Zod schemas to ensure type safety and data integrity.
 */

import { getRequiredEnvString } from '../../../../utils/helpers';
import { fetchWithRetry } from '@/utils/http';
import MempoolGateway from '../../gateway/mempool-gateway';
import zod from 'zod';

// Configuration values from environment variables
const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

/**
 * Schema for validating transaction signature objects
 * Each signature contains a signature string
 */
const ZodSignature = zod.object({
  sig: zod.string(),
});

/**
 * Schema for validating transaction signer capability lists
 * Each capability specifies allowed actions and their parameters
 */
const ZodSignerClist = zod.object({
  args: zod.array(zod.union([zod.string(), zod.number()])), // The args can be strings or numbers
  name: zod.string(),
});

/**
 * Schema for validating transaction signer details
 * Each signer includes a public key and list of capabilities
 */
const ZodSigner = zod.object({
  pubKey: zod.string(),
  clist: zod.array(ZodSignerClist),
});

/**
 * Schema for validating transaction metadata
 * Contains execution parameters and chain information
 */
const ZodMeta = zod.object({
  creationTime: zod.number(),
  ttl: zod.number(),
  gasLimit: zod.number(),
  chainId: zod.string(),
  gasPrice: zod.number(),
  sender: zod.string(),
});

/**
 * Schema for validating transaction execution data
 * Contains account keyset information and code to execute
 */
const ZodExecData = zod.object({
  'account-keyset': zod.object({
    pred: zod.string(),
    keys: zod.array(zod.string()),
  }),
  code: zod.string(),
});

/**
 * Schema for validating transaction execution payload
 * Contains the executable content of the transaction
 */
const ZodPayloadExec = zod.object({
  exec: zod.object({
    data: ZodExecData,
  }),
});

/**
 * Schema for validating the complete transaction command
 * Includes all components required for transaction execution
 */
const ZodCommand = zod.object({
  networkId: zod.string(),
  payload: ZodPayloadExec,
  signers: zod.array(ZodSigner),
  meta: ZodMeta,
  nonce: zod.string(),
});

/**
 * Schema for validating transaction content from the mempool
 * Contains the transaction hash, signatures, and command
 */
const ZodContents = zod.object({
  hash: zod.string(),
  sigs: zod.array(ZodSignature),
  cmd: zod.string(), // This is a stringified JSON object
});

/**
 * Schema for validating the complete mempool response
 * Includes the tag and contents of the transaction
 */
const ZodSchema = zod.object({
  tag: zod.string(),
  contents: ZodContents, //zod.union([, zod.string()]), // Could either be a string or parsed object
});

/**
 * Type definition for a validated mempool response
 * Represents the structure of data returned from the blockchain node's mempool
 */
export type MempoolResponse = zod.infer<typeof ZodContents>;

/**
 * Concrete implementation of the MempoolGateway interface
 *
 * This class implements the MempoolGateway interface by directly
 * communicating with the Kadena blockchain node's mempool API
 * to retrieve information about pending transactions.
 *
 * Key features:
 * - Direct API communication with blockchain node
 * - Comprehensive validation of response data using Zod schemas
 * - Structured error handling for network and validation failures
 * - Type-safe transformation of blockchain data to application models
 */
export default class MempoolApiGateway implements MempoolGateway {
  /**
   * Retrieves a pending transaction from the mempool by its request key
   *
   * This method sends a lookup request to the blockchain node's mempool API
   * and validates the response using Zod schemas to ensure type safety.
   * It returns a simplified version of the transaction data that includes
   * the hash, command, and signatures.
   *
   * The implementation:
   * 1. Constructs the appropriate endpoint URL based on configuration
   * 2. Sends a POST request to the mempool lookup endpoint
   * 3. Parses and validates the response against the defined schemas
   * 4. Returns a simplified transaction representation if found
   *
   * TODO: Add the type for this function return.
   *
   * @param requestKey - The unique identifier of the transaction to look up
   * @param chainId - The chain ID where the transaction was submitted
   * @returns Promise resolving to transaction data if found in the mempool
   * @throws Error if the response cannot be validated or if the API request fails
   */
  async getPendingTransaction(requestKey: string, chainId: string): Promise<any> {
    // Construct the URL for the mempool lookup endpoint
    const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${chainId}/mempool/lookup`;

    // Send the lookup request to the mempool API
    const data = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestKey }),
      operation: 'mempool.lookup',
      parseAs: 'json',
    });

    // Validate the response data against our schema
    const parsedData = ZodSchema.parse(data);

    // Return a simplified version of the transaction data
    return {
      hash: parsedData.contents.hash,
      cmd: parsedData.contents.cmd,
      sigs: parsedData.contents.sigs,
    };
  }
}
