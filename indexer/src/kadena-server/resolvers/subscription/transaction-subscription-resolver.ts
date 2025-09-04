/**
 * GraphQL subscription resolver for real-time transaction updates
 *
 * This file implements the resolver for the 'transaction' subscription in the GraphQL schema,
 * which allows clients to receive real-time updates when a specific transaction is added
 * to the blockchain. It uses an AsyncGenerator to poll for the transaction until it's found.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { SubscriptionResolvers } from '../../config/graphql-types';
import { TransactionOutput } from '../../repository/application/transaction-repository';
import { buildTransactionOutput } from '../output/build-transaction-output';

/**
 * AsyncGenerator function that polls for a specific transaction
 *
 * This function creates a polling loop that checks for a transaction with the
 * specified request key. Once the transaction is found, it retrieves all versions
 * of the transaction (including any potential orphaned versions from chain reorganizations),
 * orders them by block depth, and yields the result.
 *
 * The function terminates after yielding the first result, effectively providing
 * a one-time notification when the transaction is added to the blockchain.
 *
 * @param context - Resolver context containing repositories and control signals
 * @param requestKey - The unique request key of the transaction to monitor
 * @param chainId - Optional chain ID to filter transactions by specific chain
 * @returns AsyncGenerator that yields the transaction when found
 */
interface IteratorFnParams {
  context: ResolverContext;
  requestKey: string;
  chainId?: string | null;
}

async function* iteratorFn({
  requestKey,
  context,
  chainId,
}: IteratorFnParams): AsyncGenerator<TransactionOutput | undefined, void, unknown> {
  while (context.signal) {
    // TODO: [ERROR-OPTIMIZATION] missing try catch block
    const { edges } = await context.transactionRepository.getTransactions({
      requestKey,
      chainId,
    });
    const transactions = edges.map(e => e.node);

    if (transactions.length > 0) {
      // TODO: [ERROR-OPTIMIZATION] missing try catch block
      const [first, ...rest] =
        await context.blockRepository.getTransactionsOrderedByBlockDepth(transactions);

      const result = {
        ...buildTransactionOutput(first),
        orphanedTransactions: rest.map(r => buildTransactionOutput(r)),
      };

      yield result;
      return;
    }
  }
}

/**
 * GraphQL subscription resolver for the 'transaction' subscription
 *
 * This resolver follows the Apollo subscription pattern with separate subscribe and resolve functions:
 * - subscribe: Sets up the AsyncIterator that will push transaction data to subscribers
 * - resolve: Transforms the data from the AsyncIterator into the format expected by the GraphQL schema
 *
 * The resolver allows clients to monitor a specific transaction by its request key,
 * with an optional filter for a specific chain ID.
 */
export const transactionSubscriptionResolver: SubscriptionResolvers<ResolverContext>['transaction'] =
  {
    resolve: (payload: any) => payload,
    subscribe: (_root, args, context) => {
      return iteratorFn({
        context,
        requestKey: args.requestKey,
        chainId: args.chainId,
      });
    },
  };
