/**
 * Resolver for the transfers field of the FungibleChainAccount type.
 */
import { ResolverContext } from '../../../config/apollo-server-config';
import { FungibleChainAccountResolvers } from '../../../config/graphql-types';
import { buildTransferOutput } from '../../output/build-transfer-output';

/**
 * Resolver function for the transfers field of the FungibleChainAccount type.
 * Retrieves transfers for a specific account, fungible token, and chain.
 *
 * @param parent - The parent object containing accountName, fungibleName, and chainId
 * @param args - GraphQL pagination arguments
 * @param context - The resolver context
 * @returns A paginated connection of transfers
 */
export const transfersFungibleChainAccountResolver: FungibleChainAccountResolvers<ResolverContext>['transfers'] =
  async (parent, args, context) => {
    const { first, after, last, before } = args;
    const hasTokenId = false;
    const output = await context.transferRepository.getTransfers({
      accountName: parent.accountName,
      fungibleName: parent.fungibleName,
      chainId: parent.chainId,
      hasTokenId,
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
      totalCount: -1, // Placeholder value for separate resolver
      hasTokenId,
      accountName: parent.accountName,
      chainId: parent.chainId,
      fungibleName: parent.fungibleName,
    };
  };
