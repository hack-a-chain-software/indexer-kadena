import { rootPgPool } from '../../../../config/database';
import type Token from '../../../../models/token';
import type PoolRepository from '../../application/pool-repository';
import type {
  GetPoolChartDataParams,
  GetPoolParams,
  GetPoolsParams,
  GetPoolTransactionsParams,
  PoolChartDataConnection,
  PoolChartDataOutput,
  PoolOutput,
  PoolsConnection,
  PoolStatsOutput,
  PoolTransactionOutput,
  PoolTransactionsConnection,
} from '../../application/pool-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';

export default class PoolDbRepository implements PoolRepository {
  async getPools(params: GetPoolsParams): Promise<PoolsConnection> {
    const {
      first,
      after,
      last,
      before,
      orderBy = 'totalLiquidityDollar',
      orderDirection = 'DESC',
    } = params;
    const pagination = getPaginationParams({ first, after, last, before });

    // Get the latest pool stats for each pair
    const latestStatsQuery = `
      WITH latest_stats AS (
        SELECT DISTINCT ON (pair_id) 
          pair_id, 
          "volume24hUsd", 
          "volume7dUsd", 
          "transactionCount24h", 
          "apr24h"
        FROM "PoolStats"
        ORDER BY pair_id, timestamp DESC
      )
      SELECT 
        p.id,
        p."lastPrice",
        p."token0Id",
        p."token1Id",
        p."token0Liquidity",
        p."token0LiquidityDollar",
        p."token1Liquidity",
        p."token1LiquidityDollar",
        p."totalLiquidityDollar",
        p."feePercentage",
        ls."volume24hUsd",
        ls."volume7dUsd",
        ls."transactionCount24h",
        ls."apr24h"
      FROM "Pairs" p
      LEFT JOIN latest_stats ls ON p.id = ls.pair_id
      ORDER BY p."${orderBy}" ${orderDirection}
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await rootPgPool.query(latestStatsQuery, [
      pagination.limit,
      pagination.after ? 0 : pagination.limit,
    ]);

    // Get the tokens for each pair
    const pairIds = rows.map(row => row.id);
    const tokensQuery = `
      SELECT t.*, p.id as pair_id, p."token0Id", p."token1Id"
      FROM "Tokens" t
      JOIN "Pairs" p ON t.id = p."token0Id" OR t.id = p."token1Id"
      WHERE p.id = ANY($1)
    `;

    const { rows: tokenRows } = await rootPgPool.query(tokensQuery, [pairIds]);

    // Map tokens to pairs
    const tokensByPairId: Record<number, { token0: Token | undefined; token1: Token | undefined }> =
      {};
    for (const tokenRow of tokenRows) {
      const pairId = tokenRow.pair_id;
      if (!tokensByPairId[pairId]) {
        tokensByPairId[pairId] = { token0: undefined, token1: undefined };
      }

      if (tokenRow.id === tokenRow.token0Id) {
        tokensByPairId[pairId].token0 = tokenRow;
      } else if (tokenRow.id === tokenRow.token1Id) {
        tokensByPairId[pairId].token1 = tokenRow;
      }
    }

    // Build the output
    const edges = rows.map(row => {
      const pairTokens = tokensByPairId[row.id] || { token0: undefined, token1: undefined };
      return {
        cursor: row.id.toString(),
        node: {
          id: row.id,
          lastPrice: row.lastPrice,
          token0: pairTokens.token0,
          token1: pairTokens.token1,
          token0Liquidity: row.token0Liquidity,
          token0LiquidityDollar: row.token0LiquidityDollar,
          token1Liquidity: row.token1Liquidity,
          token1LiquidityDollar: row.token1LiquidityDollar,
          totalLiquidityDollar: row.totalLiquidityDollar,
          feePercentage: row.feePercentage,
          volume24hUsd: row.volume24hUsd || 0,
          volume7dUsd: row.volume7dUsd || 0,
          transactionCount24h: row.transactionCount24h || 0,
          apr24h: row.apr24h || 0,
        } as PoolOutput,
      };
    });

    const pageInfo = getPageInfo({
      edges,
      order: orderDirection as 'ASC' | 'DESC',
      limit: pagination.limit,
      after,
      before,
    });
    return {
      edges,
      pageInfo: {
        hasNextPage: pageInfo.pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.pageInfo.hasPreviousPage,
        startCursor: pageInfo.pageInfo.startCursor,
        endCursor: pageInfo.pageInfo.endCursor,
      },
    } as PoolsConnection;
  }

  async getPool(params: GetPoolParams): Promise<PoolOutput | null> {
    const { id } = params;

    // Get the pair
    const pairQuery = `
      SELECT 
        p.id,
        p."lastPrice",
        p."token0Id",
        p."token1Id",
        p."token0Liquidity",
        p."token0LiquidityDollar",
        p."token1Liquidity",
        p."token1LiquidityDollar",
        p."totalLiquidityDollar",
        p."feePercentage"
      FROM "Pairs" p
      WHERE p.id = $1
    `;

    const { rows: pairRows } = await rootPgPool.query(pairQuery, [id]);
    if (pairRows.length === 0) {
      return null;
    }

    const pair = pairRows[0];

    // Get the tokens
    const tokensQuery = `
      SELECT t.*
      FROM "Tokens" t
      WHERE t.id = $1 OR t.id = $2
    `;

    const { rows: tokenRows } = await rootPgPool.query(tokensQuery, [pair.token0Id, pair.token1Id]);
    const token0 = tokenRows.find(t => t.id === pair.token0Id);
    const token1 = tokenRows.find(t => t.id === pair.token1Id);

    // Get the latest pool stats
    const statsQuery = `
      SELECT 
        "volume24hUsd",
        "volume7dUsd",
        "transactionCount24h",
        "apr24h"
      FROM "PoolStats"
      WHERE pair_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const { rows: statsRows } = await rootPgPool.query(statsQuery, [id]);
    const stats =
      statsRows.length > 0
        ? statsRows[0]
        : {
            volume24hUsd: 0,
            volume7dUsd: 0,
            transactionCount24h: 0,
            apr24h: 0,
          };

    return {
      id: pair.id,
      lastPrice: pair.lastPrice,
      token0,
      token1,
      token0Liquidity: pair.token0Liquidity,
      token0LiquidityDollar: pair.token0LiquidityDollar,
      token1Liquidity: pair.token1Liquidity,
      token1LiquidityDollar: pair.token1LiquidityDollar,
      totalLiquidityDollar: pair.totalLiquidityDollar,
      feePercentage: pair.feePercentage,
      volume24hUsd: stats.volume24hUsd,
      volume7dUsd: stats.volume7dUsd,
      transactionCount24h: stats.transactionCount24h,
      apr24h: stats.apr24h,
    } as PoolOutput;
  }

  async getPoolTransactions(
    params: GetPoolTransactionsParams,
  ): Promise<PoolTransactionsConnection> {
    const { pairId, type, first, after, last, before } = params;
    const pagination = getPaginationParams({ first, after, last, before });

    let query = `
      SELECT 
        id,
        type,
        timestamp,
        maker,
        "amountIn",
        "amountOut",
        "amountInUsd",
        "amountOutUsd",
        "token0Amount",
        "token1Amount",
        "token0AmountUsd",
        "token1AmountUsd",
        "feesUsd",
        "transactionHash"
      FROM "PoolTransactions"
      WHERE pair_id = $1
    `;

    const queryParams = [pairId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      queryParams.push(type as unknown as number);
      paramIndex++;
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(pagination.limit, pagination.after ? 0 : pagination.limit);

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: row.id.toString(),
      node: {
        id: row.id,
        type: row.type,
        timestamp: row.timestamp,
        maker: row.maker,
        amountIn: row.amountIn,
        amountOut: row.amountOut,
        amountInUsd: row.amountInUsd,
        amountOutUsd: row.amountOutUsd,
        token0Amount: row.token0Amount,
        token1Amount: row.token1Amount,
        token0AmountUsd: row.token0AmountUsd,
        token1AmountUsd: row.token1AmountUsd,
        feesUsd: row.feesUsd,
        transactionHash: row.transactionHash,
      } as PoolTransactionOutput,
    }));

    const pageInfo = getPageInfo({ edges, order: 'DESC', limit: pagination.limit, after, before });
    return {
      edges,
      pageInfo: {
        hasNextPage: pageInfo.pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.pageInfo.hasPreviousPage,
        startCursor: pageInfo.pageInfo.startCursor,
        endCursor: pageInfo.pageInfo.endCursor,
      },
    } as PoolTransactionsConnection;
  }

  async getPoolChartData(params: GetPoolChartDataParams): Promise<PoolChartDataConnection> {
    const { pairId, type, first, after, last, before, timeRange = 'ALL' } = params;
    const pagination = getPaginationParams({ first, after, last, before });

    let timeFilter = '';
    const now = new Date();
    let startDate = new Date(0); // Default to epoch start

    switch (timeRange) {
      case '1D':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1W':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1M':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      // 'ALL' doesn't need a filter
    }

    if (timeRange !== 'ALL') {
      timeFilter = ' AND timestamp >= $2';
    }

    const query = `
      SELECT 
        id,
        timestamp,
        "valueUsd"
      FROM "PoolChartData"
      WHERE pair_id = $1 AND type = $${timeRange === 'ALL' ? 2 : 3}${timeFilter}
      ORDER BY timestamp ASC
      LIMIT $${timeRange === 'ALL' ? 3 : 4} OFFSET $${timeRange === 'ALL' ? 4 : 5}
    `;

    const queryParams = [pairId, type];
    if (timeRange !== 'ALL') {
      queryParams.push(startDate.getTime());
    }
    queryParams.push(pagination.limit, pagination.after ? 0 : pagination.limit);

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: row.id.toString(),
      node: {
        id: row.id,
        timestamp: row.timestamp,
        valueUsd: row.valueUsd,
      } as PoolChartDataOutput,
    }));

    const pageInfo = getPageInfo({ edges, order: 'ASC', limit: pagination.limit, after, before });
    return {
      edges,
      pageInfo: {
        hasNextPage: pageInfo.pageInfo.hasNextPage,
        hasPreviousPage: pageInfo.pageInfo.hasPreviousPage,
        startCursor: pageInfo.pageInfo.startCursor,
        endCursor: pageInfo.pageInfo.endCursor,
      },
    } as PoolChartDataConnection;
  }

  async getLatestPoolStats(pairId: number): Promise<PoolStatsOutput | null> {
    const query = `
      SELECT 
        id,
        timestamp,
        "tvlUsd",
        "volume24hUsd",
        "volume7dUsd",
        "fees24hUsd",
        "transactionCount24h",
        "apr24h"
      FROM "PoolStats"
      WHERE pair_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const { rows } = await rootPgPool.query(query, [pairId]);
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      timestamp: row.timestamp,
      tvlUsd: row.tvlUsd,
      volume24hUsd: row.volume24hUsd,
      volume7dUsd: row.volume7dUsd,
      fees24hUsd: row.fees24hUsd,
      transactionCount24h: row.transactionCount24h,
      apr24h: row.apr24h,
    } as PoolStatsOutput;
  }
}
