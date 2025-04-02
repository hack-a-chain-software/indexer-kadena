import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildNonFungibleAccount } from '../output/build-non-fungible-account-output';

export const nonFungibleAccountQueryResolver: QueryResolvers<ResolverContext>['nonFungibleAccount'] =
  async (_parent, args, context) => {
    const account = await context.balanceRepository.getNonFungibleAccountInfo(args.accountName);

    const params = (account?.nonFungibleTokenBalances ?? []).map(n => ({
      tokenId: n.tokenId,
      chainId: n.chainId,
      module: n.module,
    }));

    const nftsInfo = await context.pactGateway.getNftsInfo(
      params ?? [],
      account?.accountName ?? '',
    );

    const output = buildNonFungibleAccount(account, nftsInfo);
    return output;
  };
