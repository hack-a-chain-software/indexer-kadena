import { TokenPrice, QueryTokenPriceArgs, QueryTokenPricesArgs } from '../../config/graphql-types';

export interface TokenPriceRepository {
  getTokenPrice(params: QueryTokenPriceArgs): Promise<TokenPrice | null>;
  getTokenPrices(params: QueryTokenPricesArgs): Promise<TokenPrice[]>;
}
