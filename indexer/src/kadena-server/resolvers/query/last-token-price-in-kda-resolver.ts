import { rootPgPool } from '@/config/database';
import { ResolverContext } from '@/kadena-server/config/apollo-server-config';
import { QueryLastTokenPriceInKdaArgs, QueryResolvers } from '@/kadena-server/config/graphql-types';
import Decimal from 'decimal.js';

export const lastTokenPriceInKdaQueryResolver: QueryResolvers<ResolverContext>['lastTokenPriceInKda'] =
  async (_parent: unknown, args: QueryLastTokenPriceInKdaArgs) => {
    const query = `
      SELECT t.result
      FROM public."Transactions" t
      WHERE t.result::text LIKE '%' || $1 || '%'
      ORDER BY t.creationtime DESC, t.id DESC
      LIMIT 1
    `;

    const res: any = await rootPgPool.query(query, [args.moduleName]);

    const data = res.rows?.[0]?.result?.data;
    if (!data?.[0]?.token || !data?.[1]?.token) {
      return null;
    }

    const isFirstElementTheKdaToken = data?.[0]?.token === 'coin';
    const firstValue =
      data?.[0]?.amount?.decimal ?? data?.[0]?.amount?.integer ?? data?.[0]?.amount;
    const secondValue =
      data?.[1]?.amount?.decimal ?? data?.[1]?.amount?.integer ?? data?.[1]?.amount;

    const kadenaValue = isFirstElementTheKdaToken ? firstValue : secondValue;
    const tokenValue = isFirstElementTheKdaToken ? secondValue : firstValue;
    const amount = new Decimal(kadenaValue).div(new Decimal(tokenValue)).toFixed(12);
    return amount;
  };
