/**
 * Implementation of the GasGateway interface for estimating transaction gas costs
 *
 * This file provides a concrete implementation of the GasGateway interface that
 * communicates with the Kadena blockchain node to estimate the gas required for
 * executing Pact transactions. It uses the official Kadena client library to
 * perform local transaction execution simulations.
 */

import { createClient, IUnsignedCommand } from '@kadena/client';
import { GasLimitEstimation } from '../../../config/graphql-types';
import { GasLimitEstimationError } from '../../../errors/gas-limit-estimation-error';
import GasGateway, { EstimeGasOutput } from '../../gateway/gas-gateway';
import { UserInput } from '../../../domain/gas/types.gas';
import { getRequiredEnvString } from '../../../../utils/helpers';

// Base URL for the blockchain node, loaded from environment variables
const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');

/**
 * Concrete implementation of the GasGateway interface
 *
 * This class implements the GasGateway interface by using the Kadena client library
 * to communicate with the blockchain node for gas estimation. It simulates transaction
 * execution in a "local" mode (without actually submitting the transaction) to
 * determine the computational resources required.
 */
export default class GasApiGateway implements GasGateway {
  /**
   * Estimates the gas required for a transaction by simulating its execution
   *
   * This method sends the transaction to the blockchain node's local execution endpoint,
   * which simulates the transaction's execution and returns the estimated gas required.
   * It supports configuration options for preflight checks and signature verification,
   * which can affect the accuracy of the estimation.
   *
   * If the simulation fails (e.g., due to transaction errors), a GasLimitEstimationError
   * is thrown with details about the failure.
   *
   * @param input - User input parameters controlling estimation behavior
   * @param transaction - The unsigned transaction command to estimate gas for
   * @param networkId - The Kadena network ID (e.g., "mainnet01", "testnet04")
   * @returns Promise resolving to a gas estimation result with amount and configuration details
   * @throws GasLimitEstimationError if the estimation fails
   */
  async estimateGas(
    input: UserInput,
    transaction: IUnsignedCommand,
    networkId: string,
  ): Promise<GasLimitEstimation> {
    // Configure the local execution parameters
    const configuration = {
      preflight: input.preflight,
      signatureVerification: input.signatureVerification,
    };

    try {
      // Create a client pointing to the appropriate blockchain node endpoint
      const client = createClient(({ chainId }) => {
        return `${SYNC_BASE_URL}/${networkId}/chain/${chainId}/pact`;
      });

      // Execute the transaction locally (simulation)
      const result = await client.local(transaction, configuration);

      // Check if the simulation failed
      if (result.result.status === 'failure') {
        throw result.result.error;
      }

      // Format the response to match the expected output type
      const response: EstimeGasOutput = {
        amount: result.gas,
        inputType: input.type,
        usedPreflight: input.preflight,
        usedSignatureVerification: input.signatureVerification,
        transaction: JSON.stringify(transaction),
      };

      return response;
    } catch (error) {
      // Wrap and rethrow any errors in our custom error type
      throw new GasLimitEstimationError(
        '[ERROR][GAS_API_GATEWAY][ESTIMATE_GAS] Chainweb Node was unable to estimate the gas limit',
        error,
      );
    }
  }
}
