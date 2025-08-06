/**
 * GraphQL resolver for the 'fungibleAccount' query
 *
 * This file implements the resolver for the 'fungibleAccount' query in the GraphQL schema,
 * which allows clients to retrieve information about a specific account's fungible token
 * holdings. This includes the account's balance across all chains and additional
 * metadata about the tokens.
 */

import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildFungibleAccount } from '../output/build-fungible-account-output';

/**
 * Resolver function for the 'fungibleAccount' query
 *
 * This resolver handles requests for fungible token account data for a specific
 * account name and optionally filtered by a specific token. It delegates to the
 * balance repository to fetch the account data from the database, then transforms
 * the result into the GraphQL-compatible format using the fungible account builder.
 *
 * The function retrieves consolidated information about an account's token holdings,
 * including balances across all chains, token metadata, and references to related entities
 * like transactions and transfers.
 *
 * @param _parent - Parent resolver object (unused in this root resolver)
 * @param args - GraphQL query arguments containing accountName and optional fungibleName
 * @param context - Resolver context containing repository implementations
 * @returns Promise resolving to a GraphQL-compatible FungibleAccount object or null if not found
 */
export const fungibleAccountQueryResolver: QueryResolvers<ResolverContext>['fungibleAccount'] =
  async (_parent, args, context) => {
    const account = await context.balanceRepository.getAccountInfo_NODE(
      args.accountName,
      args.fungibleName,
    );

    if (!account) return null;

    return buildFungibleAccount(account);
  };
