import { ResolverContext } from '../../config/apollo-server-config';
import { QueryResolvers } from '../../config/graphql-types';
import { txByPactCodeDuration } from '@/services/metrics';

export const transactionsByPactCodeQueryResolver: QueryResolvers<ResolverContext>['transactionsByPactCode'] =
  async (_parent, args, context) => {
    const end = txByPactCodeDuration.startTimer();
    try {
      // Use ClickHouse-backed search repository when configured; fallback to Postgres otherwise
      if (process.env.CLICKHOUSE_URL && 'transactionSearchRepository' in context) {
        const output = await (context as any).transactionSearchRepository.getTransactionsByPactCode(
          args,
        );
        return output;
      }
      const output = await context.transactionRepository.getTransactionsByPactCode(args);
      return output;
    } finally {
      end();
    }
  };
