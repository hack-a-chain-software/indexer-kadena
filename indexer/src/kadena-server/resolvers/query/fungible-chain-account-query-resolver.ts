import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildFungibleChainAccount } from '../output/build-fungible-chain-account-output';

export const fungibleChainAccountQueryResolver: QueryResolvers<ResolverContext>['fungibleChainAccount'] =
  async (_parent, args, context) => {
    const { accountName, chainId, fungibleName } = args;
    const [account] = await context.balanceRepository.getChainsAccountInfo_NODE(
      accountName,
      fungibleName,
      [chainId.toString()],
    );

    if (!account) return null;

    const output = buildFungibleChainAccount(account);
    return output;
  };
