import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { buildFungibleAccount } from '../output/build-fungible-account-output';

export const fungibleAccountQueryResolver: QueryResolvers<ResolverContext>['fungibleAccount'] =
  async (_parent, args, context) => {
    const account = await context.balanceRepository.getAccountInfo_NODE(
      args.accountName,
      args.fungibleName,
    );
    return buildFungibleAccount(account);
  };
