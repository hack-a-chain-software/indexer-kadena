/**
 * Decodes a base64 encoded string into its original format and parses it as JSON.
 *
 * @param encodedData The base64 encoded string to be decoded.
 * @returns The decoded and parsed JSON object, or null if decoding or parsing fails.
 */
export function getDecoded(encodedData: string): any {
  const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
  try {
    return JSON.parse(decodedData);
  } catch (error) {
    console.error('[ERROR][DATA][DATA_FORMAT] Error decoding data:', error);
    return null;
  }
}

/**
 * Introduces a delay in the execution flow.
 *
 * @param ms The amount of time in milliseconds to delay.
 * @returns A promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retrieves a required environment variable as a string.
 * Throws an error if the variable is not found, ensuring that the application configuration is correctly defined.
 *
 * @param key - The name of the environment variable to retrieve.
 * @returns The value of the environment variable as a string.
 * @throws {Error} If the environment variable is not set.
 */
export function getRequiredEnvString(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ERROR][ENV][MISSING] Environment variable ${key} is required`);
  }
  return value;
}

/**
 * Retrieves an optional environment variable as a string array.
 * The environment variable is expected to be a comma-separated string.
 *
 * @param key - The name of the environment variable to retrieve.
 * @returns The value of the environment variable as a string array, or an empty array if the variable is not set.
 */
export function getArrayEnvString(key: string): string[] {
  const value = process.env[key] ?? '';
  return value.split(',').filter(item => item.trim() !== '');
}

/**
 * Checks if a value is null or undefined.
 *
 * @param value - The value to check.
 * @returns True if the value is null or undefined, false otherwise.
 */
export function isNullOrUndefined(value: any): boolean {
  return value === null || value === undefined;
}
