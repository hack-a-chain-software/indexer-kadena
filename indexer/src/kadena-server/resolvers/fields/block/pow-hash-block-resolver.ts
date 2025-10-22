/**
 * Resolver for the powHash field of the Block type.
 * This module calculates the Proof of Work hash for a blockchain block.
 */
import { getRequiredEnvString } from '../../../../utils/helpers';
import { fetchWithRetry } from '@/utils/http';
import { logDedup } from '@/utils/error-dedupe';
import { ResolverContext } from '../../../config/apollo-server-config';
import { BlockResolvers } from '../../../config/graphql-types';
import crypto from 'crypto';

const SYNC_BASE_URL = getRequiredEnvString('SYNC_BASE_URL');
const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

/**
 * Converts Base64 URL format to standard Base64 format.
 * Base64 URL format replaces '+' with '-', '/' with '_', and omits padding '='.
 *
 * @param base64url - The Base64 URL encoded string to convert
 * @returns The standard Base64 encoded string with proper padding
 */
function base64UrlToBase64(base64url: any) {
  // Convert Base64 URL format to standard Base64
  return (
    base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4)
  );
}

/**
 * Hashes the input using the Blake2s algorithm with specific transformations.
 *
 * @param input - The Base64 URL encoded input to hash
 * @returns The hexadecimal representation of the reversed Blake2s hash
 */
async function hashWithBlake2s(input: any) {
  try {
    const normalizedBase64 = base64UrlToBase64(input);
    const buffer = Buffer.from(normalizedBase64, 'base64');
    const truncatedBuffer = buffer.subarray(0, -32);
    const hash = crypto.createHash('blake2s256').update(truncatedBuffer).digest();
    return Buffer.from(hash).reverse().toString('hex');
  } catch (error) {
    logDedup(
      { message: 'powHash hashing failed', operation: 'block.powHash', reason: 'hash_error' },
      'powHash hashing failed',
      { error: String(error) },
    );
    throw error;
  }
}

/**
 * Resolver function for the powHash field of the Block type.
 * Fetches the block header from the blockchain API and calculates its PoW hash.
 *
 * @param parent - The parent object containing block hash and chainId
 * @returns The calculated Proof of Work hash for the block
 */
export const powHashBlockResolver: BlockResolvers<ResolverContext>['powHash'] = async parent => {
  const url = `${SYNC_BASE_URL}/${NETWORK_ID}/chain/${parent.chainId}/header/${parent.hash}`;
  const output = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    operation: 'block.powHash',
    parseAs: 'json',
  });
  return hashWithBlake2s(output);
};
