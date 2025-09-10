/**
 * GraphQL subscription resolver for real-time block updates
 *
 * This file implements the resolver for the 'newBlocks' subscription in the GraphQL schema,
 * which allows clients to receive real-time updates when new blocks are added to the blockchain.
 * It uses an AsyncGenerator to continuously poll for new blocks and push them to subscribed clients.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { SubscriptionResolvers } from '../../config/graphql-types';
import { BlockOutput } from '../../repository/application/block-repository';
import { buildBlockOutput } from '../output/build-block-output';

/**
 * AsyncGenerator function that continuously polls for new blocks
 *
 * This function creates a polling loop that checks for new blocks at regular intervals.
 * It keeps track of the last seen block ID to avoid sending duplicate blocks, and uses
 * a starting timestamp to limit results to blocks created after the subscription started.
 *
 * The function maintains its state between iterations, allowing it to effectively paginate
 * through new blocks as they are created on the blockchain.
 *
 * @param context - Resolver context containing repositories and control signals
 * @param chainIds - Array of chain IDs to filter blocks by (empty array means all chains)
 * @param quantity - The number of blocks to fetch per poll
 * @returns AsyncGenerator that yields arrays of new blocks as they are discovered
 */

interface IteratorFnParams {
  context: ResolverContext;
  chainIds: string[];
  quantity: number;
}

async function* iteratorFn({
  context,
  chainIds,
  quantity,
}: IteratorFnParams): AsyncGenerator<BlockOutput[], void, unknown> {
  if (quantity > 100) {
    throw new Error('[ERROR][GRAPHQL][VALID_RANGE] Quantity must be less than 100.');
  }

  const startingTimestamp = new Date().getTime() / 1000;

  let lastBlockId: number | undefined;

  while (context.signal) {
    // TODO: [ERROR-OPTIMIZATION] missing try catch block
    const newBlocks = await context.blockRepository.getLatestBlocks({
      creationTime: startingTimestamp,
      lastBlockId,
      chainIds,
      quantity,
    });

    if (newBlocks.length > 0) {
      lastBlockId = Number(newBlocks[0].id);
      yield newBlocks.map(b => buildBlockOutput(b));
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

/**
 * GraphQL subscription resolver for the 'newBlocks' subscription
 *
 * This resolver follows the Apollo subscription pattern with separate subscribe and resolve functions:
 * - subscribe: Sets up the AsyncIterator that will push new data to subscribers
 * - resolve: Transforms the data from the AsyncIterator into the format expected by the GraphQL schema
 *
 * The resolver filters blocks by chain ID if specified, or returns blocks from all chains if no filter is provided.
 */
export const newBlocksSubscriptionResolver: SubscriptionResolvers<ResolverContext>['newBlocks'] = {
  resolve: (payload: any) => payload,
  subscribe: (_root, args, context) => {
    return iteratorFn({
      context,
      chainIds: args.chainIds ?? [],
      quantity: args.quantity,
    });
  },
};
