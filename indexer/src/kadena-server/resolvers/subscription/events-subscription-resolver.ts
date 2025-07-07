/**
 * GraphQL subscription resolver for real-time blockchain event updates
 *
 * This file implements the resolver for the 'events' subscription in the GraphQL schema,
 * which allows clients to receive real-time updates when specific types of events are
 * emitted on the blockchain. It uses an AsyncGenerator to continuously poll for new events
 * and push them to subscribed clients.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { SubscriptionResolvers } from '../../config/graphql-types';
import { EventOutput } from '../../repository/application/event-repository';
import { buildEventOutput } from '../output/build-event-output';

/**
 * AsyncGenerator function that continuously polls for new events
 *
 * This function creates a polling loop that checks for new events matching the specified
 * criteria at regular intervals. It keeps track of the last seen event ID to avoid
 * sending duplicate events to subscribers.
 *
 * The function supports filtering events by:
 * - Qualified event name (module.name format)
 * - Chain ID
 * - Minimum confirmation depth
 *
 * @param context - Resolver context containing repositories and control signals
 * @param qualifiedEventName - The qualified name of events to monitor (module.name format)
 * @param chainId - Optional chain ID to filter events by specific chain
 * @param minimumDepth - Optional minimum confirmation depth for events
 * @returns AsyncGenerator that yields arrays of new events as they are discovered
 */
async function* iteratorFn(
  context: ResolverContext,
  qualifiedEventName: string,
  chainId?: string | null,
  minimumDepth?: number | null,
): AsyncGenerator<EventOutput[] | undefined, void, unknown> {
  let lastEventId = await context.eventRepository.getLastEventId();
  while (context.signal) {
    const newEvents = await context.eventRepository.getLastEvents({
      qualifiedEventName,
      lastEventId,
      chainId,
      minimumDepth,
    });

    if (newEvents.length > 0) {
      lastEventId = Number(newEvents[0].eventId);
      yield newEvents.map(e => buildEventOutput(e));
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

/**
 * GraphQL subscription resolver for the 'events' subscription
 *
 * This resolver follows the Apollo subscription pattern with separate subscribe and resolve functions:
 * - subscribe: Sets up the AsyncIterator that will push new event data to subscribers
 * - resolve: Transforms the data from the AsyncIterator into the format expected by the GraphQL schema
 *
 * The resolver allows clients to monitor events by qualified name with optional filters
 * for chain ID and minimum confirmation depth.
 */
export const eventsSubscriptionResolver: SubscriptionResolvers<ResolverContext>['events'] = {
  subscribe: (__root, args, context) => {
    return iteratorFn(context, args.qualifiedEventName, args.chainId, args.minimumDepth);
  },
  resolve: (payload: any) => payload,
};
