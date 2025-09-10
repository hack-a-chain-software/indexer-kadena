/**
 * Utilities for executing Pact queries against the Kadena blockchain
 *
 * This file provides functions to send and manage raw Pact code queries to the Kadena blockchain.
 * It handles the communication with the blockchain node, error handling, timeouts, and
 * response formatting. These utilities are essential for interacting with smart contracts
 * and retrieving on-chain data.
 */

import { dirtyReadClient } from '@kadena/client-utils/core';
import type { ChainId } from '@kadena/types';
import { PactQuery, PactQueryData, PactQueryResponse } from '../kadena-server/config/graphql-types';
import { getRequiredEnvString } from './helpers';
import { PactCommandError } from '../kadena-server/errors/pact-command-error';

const HOST_URL = getRequiredEnvString('NODE_API_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

/**
 * Sends a raw Pact query to the blockchain node
 *
 * This function builds and executes a direct Pact query against the blockchain by:
 * 1. Preparing the request with the provided code and optional data
 * 2. Formatting data parameters for the query
 * 3. Executing the query via the Kadena client utilities
 * 4. Returning the JSON-stringified result
 *
 * @param code - The Pact code to execute
 * @param chainId - The chain ID to execute the query against
 * @param data - Optional key-value data parameters for the query
 * @returns Promise resolving to the stringified JSON response
 * @throws PactCommandError if the query execution fails
 */
async function sendRawQuery(
  code: string,
  chainId: string,
  data?: PactQueryData[] | null,
): Promise<string> {
  try {
    const result = await dirtyReadClient({
      host: HOST_URL,
      defaults: {
        networkId: NETWORK_ID,
        meta: { chainId: chainId as ChainId },
        payload: {
          exec: {
            code,
            data:
              data?.reduce(
                (acc, obj) => {
                  acc[obj.key] = obj.value;
                  return acc;
                },
                {} as Record<string, unknown>,
              ) || {},
          },
        },
      },
    })().execute();

    return JSON.stringify(result);
  } catch (error) {
    throw new PactCommandError(
      '[ERROR][RAW_QUERY][SEND_RAW_QUERY] Pact Command failed with error',
      error,
    );
  }
}

/**
 * Executes a PactQuery and formats the response
 *
 * This function wraps the raw query execution with proper error handling:
 * 1. Extracts query parameters from the PactQuery object
 * 2. Calls sendRawQuery to execute the Pact code
 * 3. Captures and formats any errors that occur
 * 4. Returns a standardized PactQueryResponse object
 *
 * @param query - The PactQuery object containing code, chainId and optional data
 * @returns Promise resolving to a PactQueryResponse with status and result/error
 */
async function sendQuery(query: PactQuery): Promise<PactQueryResponse> {
  const { code, chainId, data } = query;
  try {
    const result = await sendRawQuery(code, chainId, data);
    return {
      status: 'success',
      result,
      error: null,
      chainId: chainId,
      code: code,
    };
  } catch (error: unknown) {
    const err = error as PactCommandError;
    const pactErrorMessage =
      err.pactError?.message ||
      JSON.stringify(err.pactError || error) ||
      '[ERROR][RAW_QUERY][SEND_QUERY] Pact Command failed with error';

    return {
      status: 'error',
      result: null,
      error: pactErrorMessage,
      chainId: chainId,
      code: code,
    };
  }
}

/**
 * Creates a timeout promise for a query
 *
 * This function creates a promise that resolves after a specified timeout period
 * with an appropriate timeout response. It's used to implement timeout handling
 * for queries that might take too long to execute.
 *
 * @param query - The original PactQuery
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Promise that resolves with a timeout response after the specified duration
 */
function createTimeout(query: PactQuery, timeoutMs: number): Promise<PactQueryResponse> {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve({
        status: 'timeout',
        result: null,
        error:
          '[ERROR][RAW_QUERY][CREATE_TIMEOUT] The query took too long to execute and was aborted',
        chainId: query.chainId,
        code: query.code,
      });
    }, timeoutMs),
  );
}

/**
 * Handles a single Pact query with timeout protection
 *
 * This function executes a Pact query with built-in timeout handling:
 * 1. Creates a promise that will resolve with a timeout error after 10 seconds
 * 2. Creates a promise for the actual query execution
 * 3. Uses Promise.race to return whichever completes first
 *
 * This ensures queries don't hang indefinitely and provides a consistent
 * response format whether the query succeeds, fails, or times out.
 *
 * @param query - The PactQuery to execute
 * @returns Promise resolving to a PactQueryResponse with appropriate status
 */
export async function handleSingleQuery(query: PactQuery): Promise<PactQueryResponse> {
  const timeoutPromise = createTimeout(query, 10000);

  const sendQueryPromise = sendQuery(query);

  return Promise.race([sendQueryPromise, timeoutPromise]);
}
