/**
 * Validation and transformation utilities for blockchain block data
 *
 * This file provides schema validation and data transformation functions for
 * blockchain blocks in the Kadena indexer. It ensures that data retrieved from
 * various sources (database, API responses) conforms to the expected structure
 * before being used in the application.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw database rows or Sequelize model instances to the standardized BlockOutput
 * type that's used throughout the application. It also generates globally unique
 * identifiers that conform to the Relay specification for GraphQL objects.
 */

import { BlockAttributes } from '../../../../models/block';
import zod from 'zod';
import { BlockOutput } from '../../application/block-repository';
import { convertStringToDate } from '../../../../utils/date';
import { calculateBlockDifficulty } from '../../../../utils/difficulty';
import { int64ToUint64String } from '../../../../utils/int-uint-64';

/**
 * Zod schema for validating block data
 *
 * Defines the expected structure and types for block records retrieved from
 * the database or API responses. The schema includes all essential blockchain
 * block properties such as hash, height, chain ID, and cryptographic elements.
 */
const schema = zod.object({
  id: zod.number(),
  hash: zod.string(),
  chainId: zod.number(),
  creationTime: zod.string(),
  epochStart: zod.string(),
  featureFlags: zod.string(),
  height: zod.number(),
  nonce: zod.string(),
  payloadHash: zod.string(),
  weight: zod.string(),
  target: zod.string(),
  adjacents: zod.record(zod.any()),
  parent: zod.string(),
  coinbase: zod.any(),
});

/**
 * Generates a globally unique ID for a block
 *
 * Creates a Base64-encoded string that represents a blockchain block,
 * containing the hash as the unique identifier. This follows the Relay
 * Global Object Identification specification.
 *
 * @param hash - The unique hash of the block
 * @returns A Base64 encoded global ID string
 */
const getBase64ID = (hash: string): string => {
  const inputString = `Block:${hash.toString()}`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

/**
 * Validates and transforms raw block data into the standardized output format
 *
 * This function performs several important tasks:
 * 1. Validates the input data against the schema
 * 2. Generates a globally unique ID for the block
 * 3. Transforms database column formats to application-friendly formats
 * 4. Converts string timestamps to JavaScript Date objects
 * 5. Calculates derived properties like difficulty from the target value
 *
 * @param row - The raw data row typically from a database query result
 * @returns A validated and transformed BlockOutput object
 * @throws Will throw an error if validation fails
 */
const validate = (row: any): BlockOutput => {
  const res = schema.parse(row);
  return {
    id: getBase64ID(res.hash),
    parentHash: res.parent,
    creationTime: convertStringToDate(res.creationTime),
    epoch: convertStringToDate(res.epochStart),
    flags: int64ToUint64String(res.featureFlags),
    powHash: '...', // TODO (STREAMING)
    hash: res.hash,
    height: res.height,
    nonce: res.nonce,
    payloadHash: res.payloadHash,
    target: res.target,
    coinbase: JSON.stringify(res.coinbase),
    weight: res.weight,
    chainId: res.chainId,
    difficulty: Number(calculateBlockDifficulty(res.target)),
    neighbors: Object.entries(res.adjacents).map(([chainId, hash]) => ({
      chainId,
      hash,
    })),
    blockId: res.id,
  };
};

/**
 * Transforms a Sequelize block model instance into the standardized output format
 *
 * This function is similar to validate() but works specifically with Sequelize ORM
 * model instances instead of raw database rows. It performs the necessary transformations
 * to convert the Sequelize model attributes into the standardized BlockOutput format.
 *
 * @param blockModel - A Sequelize Block model instance
 * @returns A transformed BlockOutput object
 */
const mapFromSequelize = (blockModel: BlockAttributes): BlockOutput => {
  return {
    id: getBase64ID(blockModel.hash),
    hash: blockModel.hash,
    parentHash: blockModel.parent,
    chainId: blockModel.chainId,
    creationTime: convertStringToDate(blockModel.creationTime),
    powHash: '...', // TODO (STREAMING)
    difficulty: Number(calculateBlockDifficulty(blockModel.target)),
    epoch: convertStringToDate(blockModel.epochStart),
    flags: int64ToUint64String(blockModel.featureFlags),
    height: blockModel.height,
    nonce: blockModel.nonce,
    payloadHash: blockModel.payloadHash,
    weight: blockModel.weight,
    target: blockModel.target,
    coinbase: JSON.stringify(blockModel.coinbase),
    neighbors: Object.entries(blockModel.adjacents).map(([chainId, hash]) => ({
      chainId,
      hash,
    })),
    blockId: blockModel.id,
  };
};

/**
 * Exported validator object providing validation and transformation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const blockValidator = { validate, mapFromSequelize };
