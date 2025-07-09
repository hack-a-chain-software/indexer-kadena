/**
 * Resolver for the block field of the Transfer type.
 * This module retrieves the block associated with a specific transfer.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { TransferResolvers } from '../../../config/graphql-types';
import { buildBlockOutput } from '../../output/build-block-output';
import zod from 'zod';

/**
 * Zod schema for validating the transfer input parameter.
 * Requires a non-nullable string for the blockHash field.
 */
const schema = zod.object({
  blockHash: zod.string(),
});

/**
 * Resolver function for the block field of the Transfer type.
 * Retrieves the block that contains the specified transfer.
 *
 * @param parent - The parent object containing the blockHash parameter
 * @param _args - GraphQL arguments (unused in this resolver)
 * @param context - The resolver context containing repositories and services
 * @returns The block data associated with the transfer, formatted using buildBlockOutput
 */
export const blockTransferResolver: TransferResolvers<ResolverContext>['block'] = async (
  parent,
  _args,
  context,
) => {
  const { blockHash } = schema.parse(parent);
  const output = await context.blockRepository.getBlockByHash(blockHash);

  if (!output) {
    throw new Error('[ERROR][DB][DATA_MISSING] Block transfer not found.');
  }

  return buildBlockOutput(output);
};
