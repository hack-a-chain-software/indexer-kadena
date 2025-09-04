/**
 * Input parser for gas estimation requests
 *
 * This file provides functionality to parse and validate raw input strings
 * for the gas estimation system. It uses Zod for schema validation to ensure
 * that inputs conform to the expected structure before further processing.
 *
 * The parser is typically the first step in the gas estimation pipeline,
 * converting raw JSON string inputs into structured TypeScript objects.
 */

import zod from 'zod';
import { GasLimitEstimationError } from '../../errors/gas-limit-estimation-error';

/**
 * Zod schema for validating gas estimation input
 *
 * Defines the expected structure for gas estimation requests, making all fields
 * optional to support various input formats. The specific combinations of fields
 * that constitute valid requests are checked in the input-checker module.
 */
const schema = zod.object({
  cmd: zod.string().optional(),
  hash: zod.string().optional(),
  sigs: zod.array(zod.string()).optional(),
  payload: zod.string().optional(),
  meta: zod.string().optional(),
  signers: zod.array(zod.string()).optional(),
  chainId: zod.string().optional(),
  code: zod.string().optional(),
});

/**
 * TypeScript type for gas estimation input
 * Generated from the Zod schema to ensure type consistency
 */
export type IGasLimitEstimationInput = zod.infer<typeof schema>;

/**
 * Parses and validates a raw input string for gas estimation
 *
 * This function takes a JSON string input, attempts to parse it into a JavaScript
 * object, and then validates it against the defined schema. If either the parsing
 * or validation fails, it throws a GasLimitEstimationError with a helpful message.
 *
 * @param input - JSON string containing gas estimation request data
 * @returns Validated gas estimation input object
 * @throws {GasLimitEstimationError} If input cannot be parsed as valid JSON or doesn't match schema
 */
export function parseInput(input: string): IGasLimitEstimationInput {
  try {
    const parsed = JSON.parse(input);
    return schema.parse(parsed);
  } catch (e) {
    throw new GasLimitEstimationError(
      '[ERROR][GAS][PARSER] Unable to parse input as JSON. Please see the README for the accepted input format.',
    );
  }
}
