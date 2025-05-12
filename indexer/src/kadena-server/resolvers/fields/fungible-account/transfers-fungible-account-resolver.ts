/**
 * Resolver for the transfers field of the FungibleAccount type.
 * This module retrieves token transfers associated with a specific fungible token account
 * in a paginated connection format.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { FungibleAccountResolvers } from '../../../config/graphql-types';
import { buildTransferOutput } from '../../output/build-transfer-output';

/**
 * Resolver function for the transfers field of the FungibleAccount type.
 * Retrieves a paginated connection of token transfers associated with the specified
 * account and fungible token.
 *
 * @param parent - The parent object containing accountName and fungibleName
 * @param args - GraphQL pagination arguments (first, after, before, last)
 * @param context - The resolver context containing repositories and services
 * @returns A connection object with edges containing transfer nodes, pagination info, and metadata for resolvers
 */
export const transfersFungibleAccountResolver: FungibleAccountResolvers<ResolverContext>['transfers'] =
  async (parent, args, context) => {
    const { first, after, before, last } = args;
    const output = await context.transferRepository.getTransfers({
      accountName: parent.accountName,
      fungibleName: parent.fungibleName,
      after,
      first,
      last,
      before,
    });

    const edges = output.edges.map(e => ({
      cursor: e.cursor,
      node: buildTransferOutput(e.node),
    }));

    return {
      edges,
      pageInfo: output.pageInfo,

      // for resolvers
      accountName: parent.accountName,
      fungibleName: parent.fungibleName,
      totalCount: -1, // Placeholder value; actual count is resolved by a separate resolver
    };
  };
