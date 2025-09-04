import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';

export const transactionsByPactCodeQueryResolver: QueryResolvers<ResolverContext>['transactionsByPactCode'] =
  async (_parent, args, context) => {
    const output = await context.transactionRepository.getTransactionsByPactCode(args);
    return output;
  };
