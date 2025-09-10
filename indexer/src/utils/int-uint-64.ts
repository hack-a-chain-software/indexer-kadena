/**
 * Utility functions for handling 64-bit integer conversions
 *
 * This file provides conversion functions between signed int64 and unsigned uint64 values.
 * These conversions are necessary because PostgreSQL does not natively support unsigned 64-bit
 * integers (uint64), but blockchain data often uses unsigned integers for values such as
 * hashes, balances, and timestamps.
 *
 * The conversion preserves the bit pattern of the numbers while changing their interpretation
 * between signed and unsigned domains.
 */

/** Constants for the minimum and maximum values of signed and unsigned 64-bit integers */
const INT64_MIN = BigInt('-9223372036854775808'); // -2^63
const INT64_MAX = BigInt('9223372036854775807'); // 2^63 - 1
const UINT64_MAX = BigInt('18446744073709551615'); // 2^64 - 1

/**
 * Converts an unsigned 64-bit integer to a signed 64-bit integer
 *
 * This function takes a value in the uint64 range (0 to 2^64-1) and converts it
 * to a corresponding signed int64 value (-2^63 to 2^63-1) while preserving the bit pattern.
 * This is useful when storing blockchain values (which are often unsigned) in PostgreSQL
 * tables that only support signed integers.
 *
 * @param uint64Value - The unsigned 64-bit integer to convert (can be number, string, or BigInt)
 * @returns The equivalent signed 64-bit integer as a BigInt
 * @throws Error if the input value is outside the valid uint64 range
 */
export function uint64ToInt64(uint64Value: any): bigint {
  const bigIntValue = BigInt(uint64Value);

  // Ensure the value is in the valid uint64 range
  if (bigIntValue < 0n || bigIntValue > UINT64_MAX) {
    throw new Error('[ERROR][VALID][VALID_RANGE] Value is out of range for uint64');
  }

  if (bigIntValue <= INT64_MAX) {
    return bigIntValue;
  } else {
    return bigIntValue - UINT64_MAX - 1n;
  }
}

/**
 * Converts a signed 64-bit integer to an unsigned 64-bit integer string
 *
 * This function takes a value in the int64 range (-2^63 to 2^63-1) and converts it
 * to a corresponding unsigned uint64 value (0 to 2^64-1) while preserving the bit pattern.
 * This is useful when retrieving signed integers from PostgreSQL and converting them back
 * to their original unsigned representation for blockchain operations or display.
 *
 * @param bigintString - The signed 64-bit integer to convert (can be number, string, or BigInt)
 * @returns The equivalent unsigned 64-bit integer as a string
 * @throws RangeError if the input value is outside the valid int64 range
 */
export function int64ToUint64String(bigintString: any) {
  const UINT64_WRAPAROUND = BigInt('18446744073709551616'); // 2^64

  const int64Value = BigInt(bigintString);

  // Validate the range for int64
  if (int64Value < INT64_MIN || int64Value > INT64_MAX) {
    throw new RangeError('[ERROR][VALID][VALID_RANGE] Value is out of range for int64');
  }

  // Convert int64 to uint64
  const uint64Value = int64Value < 0n ? int64Value + UINT64_WRAPAROUND : int64Value;

  return uint64Value.toString();
}
