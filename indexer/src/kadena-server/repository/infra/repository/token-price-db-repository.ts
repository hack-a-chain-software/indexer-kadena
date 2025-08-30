import { sequelize } from '../../../../config/database';
import Token from '../../../../models/token';
import { PairService } from '../../../../services/pair-service';
import {
  QueryTokenPriceArgs,
  QueryTokenPricesArgs,
  TokenPrice,
} from '../../../config/graphql-types';
import { TokenPriceRepository } from '../../application/token-price-repository';
import { DEFAULT_PROTOCOL } from '../../../config/apollo-server-config';

export default class TokenPriceDbRepository implements TokenPriceRepository {
  async getTokenPrice(params: QueryTokenPriceArgs): Promise<TokenPrice | null> {
    const { tokenAddress, protocolAddress } = params;
    const token = await Token.findOne({ where: { code: tokenAddress } });

    if (!token) {
      return null;
    }

    const price = await PairService.calculateTokenPrice(
      token,
      undefined,
      protocolAddress || DEFAULT_PROTOCOL,
    );

    return {
      id: `price-${tokenAddress}`,
      token: {
        id: token.id.toString(),
        name: token.name,
        chainId: '0',
        address: token.code || '',
      },
      priceInKda: price ? price.priceInKDA : 0,
      priceInUsd: price ? price.priceInUSD : 0,
      protocolAddress: protocolAddress || DEFAULT_PROTOCOL,
      updatedAt: new Date(),
    } as TokenPrice;
  }

  async getTokenPrices(params: QueryTokenPricesArgs): Promise<TokenPrice[]> {
    const { protocolAddress = DEFAULT_PROTOCOL } = params;

    // Get all unique tokens from pairs
    const tokensQuery = `
      SELECT DISTINCT t.*
      FROM "Tokens" t
      JOIN "Pairs" p ON t.id = p."token0Id" OR t.id = p."token1Id"
      WHERE p.address = $1
    `;

    const tokens = await sequelize.query(tokensQuery, {
      type: 'SELECT',
      bind: [protocolAddress],
      model: Token,
    });

    const prices: TokenPrice[] = [];
    for (const token of tokens) {
      const price = await this.getTokenPrice({ tokenAddress: token.code, protocolAddress });
      if (price) {
        prices.push(price);
      }
    }

    return prices;
  }
}
