/**
 * Transaction payload builder for gas estimation
 *
 * This file provides functionality to build transaction payloads from various input formats
 * for gas estimation purposes. It transforms different types of user inputs into a standardized
 * unsigned command format that can be submitted to a Kadena node for gas estimation.
 *
 * The builder supports multiple input formats including:
 * - Full transactions
 * - Stringified commands
 * - Complete and partial Pact commands
 * - Raw payloads
 * - Pact code snippets
 */

import { createTransaction, IUnsignedCommand } from '@kadena/client';
import { composePactCommand } from '@kadena/client/fp';
import { UserInput } from './types.gas';
import { hash as hashFunction } from '@kadena/cryptography-utils';
import { GasLimitEstimationError } from '../../errors/gas-limit-estimation-error';

/**
 * Builds a transaction payload from various input formats
 *
 * This function handles different input types and constructs a standardized
 * unsigned command that can be submitted to a Kadena node for gas estimation.
 * It applies appropriate defaults for missing fields and ensures the transaction
 * is properly formatted for the target network.
 *
 * For transaction creation, a default gasLimit of 10000 and gasPrice of 1.0e-8
 * are used as placeholders, since the actual purpose is to estimate these values.
 *
 * @param input - The user input in any of the supported formats
 * @param networkId - The target blockchain network identifier
 * @returns A standardized unsigned command ready for gas estimation
 * @throws {GasLimitEstimationError} If the transaction cannot be generated
 */
export const buildTransactionPayload = (input: UserInput, networkId: string): IUnsignedCommand => {
  let transaction: IUnsignedCommand;

  switch (input.type) {
    // Handle a fully constructed transaction
    case 'full-transaction':
      transaction = {
        cmd: input.cmd,
        hash: input.hash,
        sigs: input.sigs.map(s => ({ sig: s })),
      };
      break;

    // Handle a JSON-stringified command
    case 'stringified-command':
      transaction = {
        cmd: input.cmd,
        hash: hashFunction(input.cmd),
        sigs: input.sigs?.map(s => ({ sig: s })) || [],
      };
      break;

    // Handle a complete Pact command object
    case 'full-command':
      transaction = createTransaction(
        composePactCommand(
          { payload: input.payload },
          { meta: input.meta },
          { signers: input.signers },
          { networkId },
        )({
          meta: {
            gasLimit: 10000,
            gasPrice: 1.0e-8,
          },
        }),
      );
      break;

    // Handle a partial Pact command object
    case 'partial-command':
      // Convert chainId to meta if provided separately
      if (!input.meta && 'chainId' in input) {
        input.meta = { chainId: input.chainId };
      }

      transaction = createTransaction(
        composePactCommand(
          { payload: input.payload },
          { meta: input.meta },
          { signers: input.signers },
          { networkId },
        )({
          meta: {
            gasLimit: 10000,
            gasPrice: 1.0e-8,
          },
        }),
      );
      break;

    // Handle just a payload object
    case 'payload':
      transaction = createTransaction(
        composePactCommand(
          { payload: input.payload },
          { meta: { chainId: input.chainId } },
        )({
          meta: {
            gasLimit: 10000,
            gasPrice: 1.0e-8,
          },
        }),
      );
      break;

    // Handle raw Pact code
    case 'code':
      transaction = createTransaction(
        composePactCommand(
          {
            payload: {
              exec: {
                code: input.code,
                data: {},
              },
            },
          },
          { meta: { chainId: input.chainId } },
        )({
          meta: {
            gasLimit: 10000,
            gasPrice: 1.0e-8,
          },
        }),
      );
      break;

    // Handle unexpected input types
    default:
      throw new GasLimitEstimationError(
        '[ERROR][GAS][TRANSACTION] Something went wrong generating the transaction.',
      );
  }

  return transaction;
};
