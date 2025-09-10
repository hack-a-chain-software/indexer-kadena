/**
 * Utility functions for date and timestamp conversions
 *
 * This file provides functions to handle conversion between different timestamp
 * formats and JavaScript Date objects. It specifically addresses the challenge
 * of working with the microsecond-precision timestamps commonly used in blockchain
 * data while maintaining compatibility with JavaScript's Date object.
 */

/**
 * Converts a microsecond-precision timestamp string to a JavaScript Date object
 *
 * This function handles the conversion process with several safeguards:
 * 1. Validates that the input is a string
 * 2. Converts the string to a BigInt to handle potentially large numbers
 * 3. Converts from microseconds to milliseconds (required for JavaScript Date)
 * 4. Ensures the value is within JavaScript's safe integer range
 * 5. Creates and returns a proper Date object
 *
 * The function is designed to work with blockchain timestamps that often use
 * microsecond precision (millionths of a second), while JavaScript's Date
 * uses millisecond precision (thousandths of a second).
 *
 * @param timestampInMicrosecondsString - The timestamp as a string in microseconds
 * @returns A JavaScript Date object representing the timestamp
 * @throws Error if the input is not a string or if the timestamp is too large
 */
export function convertStringToDate(timestampInMicrosecondsString: any) {
  // Ensure the input is a string
  if (typeof timestampInMicrosecondsString !== 'string') {
    throw new Error('[ERROR][VALID][VALID_TYPE] The input timestamp must be a string.');
  }

  // Convert the string to a BigInt
  const timestampInMicroseconds = BigInt(timestampInMicrosecondsString);

  // Convert the BigInt microseconds to milliseconds by dividing by 1000n
  const timestampInMillisecondsBigInt = timestampInMicroseconds / 1000n;

  // Maximum safe integer for JavaScript Numbers
  const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

  // Check if the timestamp is within the safe integer range
  if (timestampInMillisecondsBigInt <= MAX_SAFE_INTEGER) {
    // Convert to Number safely
    const timestampInMilliseconds = Number(timestampInMillisecondsBigInt);

    // Create a Date object and convert to ISO string
    return new Date(timestampInMilliseconds);
  } else {
    // Handle the case where the BigInt is too large to convert
    throw new Error(
      '[ERROR][MATH][MATH_OVERFLOW] The timestamp is too large to safely convert to a JavaScript number.',
    );
  }
}
