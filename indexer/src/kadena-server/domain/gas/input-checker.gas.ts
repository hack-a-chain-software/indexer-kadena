/**
 * Input type determination for gas estimation
 *
 * This file provides functionality to analyze parsed input data and determine
 * which specific type of gas estimation input it represents. The system supports
 * multiple input formats to accommodate different client use cases.
 *
 * The input checker acts as a bridge between the raw parsed input and the
 * transaction builder, transforming generic input objects into properly typed
 * and structured data with appropriate defaults for the estimation process.
 */

import { GasLimitEstimationError } from '../../errors/gas-limit-estimation-error';
import { IGasLimitEstimationInput } from './parser.gas';
import {
  CodeInput,
  FullCommandInput,
  FullTransactionInput,
  PartialCommandInput,
  PayloadInput,
  StringifiedCommandInput,
  UserInput,
} from './types.gas';

/**
 * Determines the specific type of gas estimation input
 *
 * This function analyzes the parsed input data and categorizes it into one of the
 * supported input types based on which fields are present. It also adds appropriate
 * default values for the preflight and signatureVerification flags based on the
 * input type.
 *
 * The function implements a cascading check that evaluates input against increasingly
 * simpler formats:
 * 1. Full transaction (cmd + hash + sigs)
 * 2. Stringified command (cmd only)
 * 3. Full command (payload + meta + signers)
 * 4. Partial command (payload + [meta | (signers + chainId)])
 * 5. Payload (payload + chainId)
 * 6. Code (code + chainId)
 *
 * @param input - The parsed input object to analyze
 * @returns A properly typed UserInput with appropriate defaults
 * @throws {GasLimitEstimationError} If the input doesn't match any supported format
 */
export function determineInputType(input: IGasLimitEstimationInput): UserInput {
  // Check for full transaction format
  if ('cmd' in input && 'hash' in input && 'sigs' in input) {
    return {
      type: 'full-transaction',
      preflight: true,
      signatureVerification: true,
      ...input,
    } as FullTransactionInput;
  }
  // Check for stringified command format
  else if ('cmd' in input) {
    return {
      type: 'stringified-command',
      preflight: true,
      signatureVerification: false,
      ...input,
    } as StringifiedCommandInput;
  }
  // Check for full command format
  else if ('payload' in input && 'meta' in input && 'signers' in input) {
    return {
      type: 'full-command',
      preflight: 'networkId' in input ? true : false,
      signatureVerification: false,
      ...input,
    } as FullCommandInput;
  }
  // Check for partial command format
  else if ('payload' in input && ('meta' in input || ('signers' in input && 'chainId' in input))) {
    return {
      type: 'partial-command',
      preflight: 'networkId' in input ? true : false,
      signatureVerification: false,
      ...input,
    } as PartialCommandInput;
  }
  // Check for payload format
  else if ('payload' in input && 'chainId' in input) {
    return {
      type: 'payload',
      preflight: false,
      signatureVerification: false,
      ...input,
    } as PayloadInput;
  }
  // Check for code format
  else if ('code' in input && 'chainId' in input) {
    return {
      type: 'code',
      preflight: false,
      signatureVerification: false,
      ...input,
    } as CodeInput;
  }

  // If none of the above formats match, throw error
  throw new GasLimitEstimationError(
    '[ERROR][GRAPHQL][GAS][INPUT_CHECKER] Unknown input type. Please see the README for the accepted input format.',
  );
}
