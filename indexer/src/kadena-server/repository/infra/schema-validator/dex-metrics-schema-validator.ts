/**
 * Validation and transformation utilities for DEX metrics data
 *
 * This file provides schema validation and data transformation functions for
 * DEX metrics in the Kadena indexer. It ensures that data retrieved from
 * database queries conforms to the expected structure before being used in
 * the application.
 */

import zod from 'zod';
import { DexMetrics } from '../../../config/graphql-types';

/**
 * Zod schema for validating DEX metrics data
 */
const schema = zod.object({
  totalPools: zod.number(),
  currentTvlUsd: zod.number(),
  tvlHistory: zod.array(
    zod.object({
      timestamp: zod.date(),
      value: zod.number(),
    }),
  ),
  volumeHistory: zod.array(
    zod.object({
      timestamp: zod.date(),
      value: zod.number(),
    }),
  ),
  totalVolumeUsd: zod.number(),
});

/**
 * Validates and transforms raw DEX metrics data into the standardized output format
 */
const validate = (row: any): DexMetrics => {
  const res = schema.parse(row);
  return {
    __typename: 'DexMetrics',
    totalPools: res.totalPools,
    currentTvlUsd: res.currentTvlUsd,
    tvlHistory: res.tvlHistory,
    volumeHistory: res.volumeHistory,
    totalVolumeUsd: res.totalVolumeUsd,
  };
};

/**
 * Exported validator object providing validation functionality
 */
export const dexMetricsValidator = { validate };
