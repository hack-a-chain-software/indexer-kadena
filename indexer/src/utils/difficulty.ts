/**
 * Utilities for calculating blockchain difficulty and related metrics
 *
 * This file provides functions and interfaces for working with blockchain difficulty,
 * which is a measure of how hard it is to find a new block. It includes utilities for
 * converting between different difficulty representations and calculating aggregate
 * difficulty metrics across multiple chains.
 */

/**
 * Represents a block with its difficulty information
 *
 * This interface defines the essential properties needed for difficulty calculations,
 * including timestamps, difficulty value, block height, and chain ID.
 */
export interface BlockWithDifficulty {
  creationTime: number;
  creationTimeDate: Date;
  difficulty: bigint;
  height: bigint;
  chainId: bigint;
}

/**
 * Internal interface for grouping blocks by their chain ID
 *
 * Used during difficulty calculations when handling multiple chains or
 * orphaned blocks to organize blocks by their respective chains.
 */
interface IBlockGroup {
  [key: string]: BlockWithDifficulty[];
}

/**
 * Calculates the total difficulty across all chains at a specific height
 *
 * This function computes the aggregate difficulty of blocks across multiple chains
 * by finding all blocks at a given height or nearby heights. It handles special cases:
 * 1. When exact number of blocks matches the number of chains (ideal case)
 * 2. When there are orphaned blocks (more blocks than chains)
 *
 * When orphaned blocks exist, the function averages the difficulty for each chain
 * to provide a fair representation of the network's overall difficulty.
 *
 * @param currentHeight - The block height to calculate difficulty for
 * @param blocks - Array of blocks with their difficulty information
 * @param chainIds - Array of chain IDs to consider in the calculation
 * @returns The total difficulty as a bigint, or undefined if insufficient blocks found
 */
export function calculateTotalDifficulty(
  currentHeight: bigint,
  blocks: BlockWithDifficulty[],
  chainIds: string[],
): bigint | undefined {
  // Look at the current height and up to 3 blocks backward
  // This helps find complete sets of blocks in case of missing data at the exact height
  for (let i = currentHeight; i > currentHeight - 4n; i--) {
    // Filter blocks to only those at the current iteration height
    const blocksOfThisHeight = blocks.filter(block => block.height === i);

    // Ideal case: We have exactly one block for each chain
    if (blocksOfThisHeight.length === chainIds.length) {
      // Sum up the difficulty values from all blocks
      const totalDifficulty = blocksOfThisHeight.reduce((acc, block) => acc + block.difficulty, 0n);
      return totalDifficulty;

      // Complex case: We have more blocks than chains (orphaned blocks exist)
      // TODO: Handle this case and better explain what its happening. We have 20 chains but is it normal to have more blocks than chains?
    } else if (blocksOfThisHeight.length > chainIds.length) {
      // Group blocks by their chain ID to handle multiple blocks per chain
      const blocksGroupedByChainId = blocksOfThisHeight.reduce<IBlockGroup>((acc, block) => {
        const chainIdKey = block.chainId.toString();
        // Initialize array for this chain if it doesn't exist
        if (!acc[chainIdKey]) {
          acc[chainIdKey] = [];
        }
        // Add this block to its chain's group
        acc[chainIdKey].push(block);
        return acc;
      }, {});

      let totalDifficulty = 0n;
      // Process each chain separately
      for (const chainId of chainIds) {
        const blocks = blocksGroupedByChainId[chainId];

        if (blocks) {
          // Calculate total difficulty for this chain
          const chainDifficulty = blocks.reduce((acc, block) => acc + block.difficulty, 0n);

          // If multiple blocks exist for this chain (orphans/forks),
          // average their difficulties to get a fair representation
          totalDifficulty += chainDifficulty / BigInt(blocks.length);
        }
      }
      return totalDifficulty;
    }
    // If we don't have enough blocks at this height, continue to the next height
  }
  // Return undefined if we couldn't find a complete set of blocks at any height
  return undefined;
}

/**
 * Converts a base64url-encoded string to a BigInt using little-endian byte order
 *
 * This function handles the conversion process required for working with Kadena's
 * difficulty target format:
 * 1. Converts base64url characters to standard base64
 * 2. Ensures proper padding
 * 3. Decodes to binary data
 * 4. Reverses byte order for little-endian representation
 * 5. Converts to BigInt
 *
 * @param base64UrlString - The base64url-encoded string to convert
 * @returns A BigInt representation of the input
 */
function base64UrlToBigIntLittleEndian(base64UrlString: any) {
  // Base64url format uses '-' and '_' instead of '+' and '/' in standard Base64
  // Convert these characters to the standard Base64 format
  const base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');

  // Base64 requires padding with '=' characters to make the length a multiple of 4
  // Calculate required padding and add it
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  // Decode the Base64 string into a byte array
  const byteArray = Buffer.from(paddedBase64, 'base64');

  // Kadena uses little-endian format (least significant byte first)
  // But BigInt construction needs most significant byte first
  // So we reverse the byte array to convert from little-endian to big-endian
  const reversedByteArray = Uint8Array.from(byteArray).reverse();

  // Build the BigInt value byte by byte
  let bigIntValue = 0n;
  for (let byte of reversedByteArray) {
    // Shift the existing value left by 8 bits (1 byte)
    // and add the next byte
    bigIntValue = (bigIntValue << 8n) + BigInt(byte);
  }

  return bigIntValue;
}

/**
 * Converts a target value to a difficulty value
 *
 * This function calculates difficulty by dividing the maximum possible target
 * (2^256 - 1) by the actual target. The lower the target, the higher the
 * difficulty, representing how hard it is to find a valid block.
 *
 * @param targetBigInt - The target value as a BigInt
 * @returns The calculated difficulty as a BigInt
 */
function targetToDifficulty(targetBigInt: any) {
  // In blockchain mining, difficulty is inversely proportional to the target
  // The maximum possible target is 2^256 - 1 (all bits set to 1)
  const maxTarget = 2n ** 256n - 1n;

  // Difficulty is calculated as maxTarget / actualTarget
  // The lower the target value, the higher the difficulty
  // (meaning it's harder to find a valid hash below that target)
  return maxTarget / targetBigInt;
}

/**
 * Calculates a block's difficulty from its base64url-encoded target
 *
 * This function combines the base64 decoding and difficulty calculation
 * to provide a simple interface for getting a block's difficulty from
 * the target format used in the blockchain.
 *
 * @param targetBase64Url - The base64url-encoded target string from the block
 * @returns The calculated difficulty as a BigInt
 */
export function calculateBlockDifficulty(targetBase64Url: string) {
  // Two-step process:
  // 1. Convert the base64url-encoded target to a BigInt
  const targetBigInt = base64UrlToBigIntLittleEndian(targetBase64Url);

  // 2. Calculate the difficulty value from the target
  const difficulty = targetToDifficulty(targetBigInt);

  return difficulty;
}
