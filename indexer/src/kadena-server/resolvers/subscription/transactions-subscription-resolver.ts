/**
 * GraphQL subscription resolver for real-time blockchain transactions updates
 *
 * This file implements the resolver for the 'transactions' subscription in the GraphQL schema,
 * which allows clients to receive real-time updates when specific transactions are added
 * to the blockchain. It uses an AsyncGenerator to continuously poll for new transactions
 * and push them to subscribed clients.
 */

import { buildTransactionOutput } from '@/kadena-server/resolvers/output/build-transaction-output';
import { ResolverContext } from '../../config/apollo-server-config';
import { SubscriptionResolvers } from '../../config/graphql-types';
import { TransactionOutput } from '@/kadena-server/repository/application/transaction-repository';

/**
 * AsyncGenerator function that continuously polls for new transactions
 *
 * This function creates a polling loop that checks for new transactions matching the specified
 * criteria at regular intervals. It keeps track of the last seen transaction ID to avoid
 * sending duplicate transactions to subscribers.
 *
 * @param context - Resolver context containing repositories and control signals
 * @param quantity - The number of transactions to fetch per poll
 * @returns AsyncGenerator that yields arrays of new transactions as they are discovered
 */
async function* iteratorFn(
  context: ResolverContext,
  quantity: number,
): AsyncGenerator<TransactionOutput[] | undefined, void, unknown> {
  if (quantity > 100) {
    throw new Error('[ERROR][GRAPHQL][VALID_RANGE] Quantity must be less than 100.');
  }

  let hasError = false;
  try {
    while (context.signal || !hasError) {
      const lastTransactions = await context.transactionRepository.getLastTransactions(quantity);

      if (lastTransactions.length > 0) {
        yield lastTransactions.map(e => buildTransactionOutput(e));
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  } catch (error) {
    hasError = true;
    console.error('[ERROR][GRAPHQL][DB][DATA_CORRUPT] Error getting last transactions:', error);
  }
}

/**
 * GraphQL subscription resolver for the 'transactions' subscription
 *
 * This resolver follows the Apollo subscription pattern with separate subscribe and resolve functions:
 * - subscribe: Sets up the AsyncIterator that will push new transaction data to subscribers
 * - resolve: Transforms the data from the AsyncIterator into the format expected by the GraphQL schema
 *
 * The resolver allows clients to monitor transactions by chain ID and minimum confirmation depth.
 */
export const transactionsSubscriptionResolver: SubscriptionResolvers<ResolverContext>['transactions'] =
  {
    resolve: (payload: any) => payload,
    subscribe: (__root, args, context) => {
      return iteratorFn(context, args.quantity);
    },
  };
