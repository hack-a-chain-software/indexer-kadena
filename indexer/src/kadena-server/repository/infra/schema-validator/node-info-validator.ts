/**
 * Validation and transformation utilities for blockchain node information
 *
 * This file provides schema validation and data transformation functions for
 * Kadena blockchain node information in the indexer. It ensures that data retrieved
 * from the node API conforms to the expected structure before being used in the application.
 *
 * The validator uses Zod for runtime type checking and handles the conversion
 * of raw API responses to the standardized GetNodeInfo type that's used
 * throughout the application, particularly for network information queries.
 */

import zod from 'zod';
import { GetNodeInfo } from '../../application/network-repository';
import { getRequiredEnvString } from '../../../../utils/helpers';

/**
 * Zod schema for validating node information data
 *
 * Defines the expected structure and types for node information retrieved
 * from the blockchain node API. The schema includes details about the node
 * such as version, supported chains, genesis heights, and service information.
 */
const schema = zod.object({
  nodeApiVersion: zod.string(),
  nodeBlockDelay: zod.number(),
  nodeVersion: zod.string(),
  nodeChains: zod.array(zod.string()),
  nodeNumberOfChains: zod.number(),
  nodeGenesisHeights: zod.array(zod.tuple([zod.string(), zod.number()])),
  nodePackageVersion: zod.string(),
  nodeServiceDate: zod.string().nullable(),
  nodeLatestBehaviorHeight: zod.number(),
  nodeGraphHistory: zod.any(),
  nodeHistoricalChains: zod.any(),
});

/**
 * Host URL for the blockchain node from environment variables
 * Used to include the network host in the node information output
 */
const HOST_URL = getRequiredEnvString('NODE_API_URL');

/**
 * Validates and transforms raw node information data into the standardized output format
 *
 * This function performs several important tasks:
 * 1. Validates the input data against the schema
 * 2. Transforms API response formats to application-friendly formats
 * 3. Restructures genesis heights data into a more usable format
 * 4. Converts timestamp strings to JavaScript Date objects
 * 5. Adds the network host information from environment variables
 *
 * @param row - The raw data typically from a blockchain node API response
 * @returns A validated and transformed GetNodeInfo object
 * @throws Will throw an error if validation fails
 */
function validate(row: any): GetNodeInfo {
  const res = schema.parse(row);
  return {
    apiVersion: res.nodeApiVersion,
    networkHost: HOST_URL,
    networkId: res.nodeVersion,
    nodeBlockDelay: res.nodeBlockDelay,
    nodeChains: res.nodeChains,
    numberOfChains: res.nodeNumberOfChains,
    genesisHeights: res.nodeGenesisHeights.map(([chainId, height]) => ({
      chainId,
      height,
    })),
    nodePackageVersion: res.nodePackageVersion,
    nodeServiceDate: res.nodeServiceDate ? new Date(res.nodeServiceDate) : null,
    nodeLatestBehaviorHeight: res.nodeLatestBehaviorHeight,
  };
}

/**
 * Exported validator object providing validation and transformation functionality
 * This pattern allows for easy mocking in tests and consistent usage across the codebase
 */
export const nodeInfoValidator = { validate };
