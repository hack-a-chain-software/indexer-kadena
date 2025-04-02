import { ResolverContext } from '../../../config/apollo-server-config';
import {
  NonFungibleAccountResolvers,
  NonFungibleChainAccount,
} from '../../../config/graphql-types';
import { buildNonFungibleChainAccount } from '../../output/build-non-fungible-chain-account-output';

export const chainAccountsNonFungibleAccountResolver: NonFungibleAccountResolvers<ResolverContext>['chainAccounts'] =
  async (parent, _args, context) => {
    const accounts = await context.balanceRepository.getNonFungibleChainAccountsInfo(
      parent.accountName,
    );

    const outputPromises = accounts.map(async account => {
      const params = account.nonFungibleTokenBalances.map(n => ({
        tokenId: n.tokenId,
        chainId: n.chainId,
        module: n.module,
      }));

      const nftsInfo = await context.pactGateway.getNftsInfo(
        params ?? [],
        parent.accountName ?? '',
      );
      return buildNonFungibleChainAccount(account, nftsInfo);
    });

    const results = await Promise.all(outputPromises);
    return results.filter((result): result is NonFungibleChainAccount => result !== null);
  };
