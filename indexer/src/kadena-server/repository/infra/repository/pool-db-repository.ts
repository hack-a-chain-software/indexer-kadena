import { Op, QueryTypes } from 'sequelize';

import { sequelize } from '../../../../config/database';
import Pair from '../../../../models/pair';
import PoolStats from '../../../../models/pool-stats';
import { encodeCursor, getPageInfo, getPaginationParams } from '../../pagination';
import {
  PageInfo,
  Pool,
  PoolCharts,
  PoolTransactionType,
  TimeFrame,
} from '../../../config/graphql-types';
import {
  GetPoolsParams,
  GetPoolParams,
  GetPoolTransactionsParams,
  GetPoolChartsParams,
  PoolTransactionsConnection,
} from '../../application/pool-repository';
import { ConnectionEdge } from '../../types';
import TokenModel from '../../../../models/token';

type OrderDirection = 'ASC' | 'DESC';

const POOL_ORDER_BY_MAP: Record<
  string,
  { model: typeof PoolStats; field: string; direction: OrderDirection }
> = {
  TVL_USD_ASC: { model: PoolStats, field: 'tvlUsd', direction: 'ASC' },
  TVL_USD_DESC: { model: PoolStats, field: 'tvlUsd', direction: 'DESC' },
  VOLUME_24H_ASC: { model: PoolStats, field: 'volume24hUsd', direction: 'ASC' },
  VOLUME_24H_DESC: { model: PoolStats, field: 'volume24hUsd', direction: 'DESC' },
  VOLUME_7D_ASC: { model: PoolStats, field: 'volume7dUsd', direction: 'ASC' },
  VOLUME_7D_DESC: { model: PoolStats, field: 'volume7dUsd', direction: 'DESC' },
  APR_24H_ASC: { model: PoolStats, field: 'apr24h', direction: 'ASC' },
  APR_24H_DESC: { model: PoolStats, field: 'apr24h', direction: 'DESC' },
  TRANSACTION_COUNT_24H_ASC: { model: PoolStats, field: 'transactionCount24h', direction: 'ASC' },
  TRANSACTION_COUNT_24H_DESC: { model: PoolStats, field: 'transactionCount24h', direction: 'DESC' },
};

export default class PoolDbRepository {
  private readonly DEFAULT_PROTOCOL = 'kdlaunch.kdswap-exchange';

  async getPools(params: GetPoolsParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<Pool>[];
    totalCount: number;
  }> {
    const { after, before, first, last, orderBy, protocolAddress = this.DEFAULT_PROTOCOL } = params;
    const pagination = getPaginationParams({ after, before, first, last });

    // Get the latest stats for each pool
    const latestStats = await PoolStats.findAll({
      attributes: ['pairId', [sequelize.fn('MAX', sequelize.col('timestamp')), 'maxTimestamp']],
      group: ['pairId'],
    });

    const pairIds = latestStats.map(stat => stat.pairId);
    const maxTimestamps = latestStats.reduce(
      (acc, stat) => {
        const maxTimestamp = stat.get('maxTimestamp') as Date;
        if (maxTimestamp) {
          acc[stat.pairId] = maxTimestamp;
        }
        return acc;
      },
      {} as Record<number, Date>,
    );

    const pairIdsStr = pairIds.join(',');
    const timestampsStr = Object.values(maxTimestamps)
      .map(t => `'${t.toISOString()}'`)
      .join(',');

    let whereClause = '';
    const conditions = [];

    if (pairIdsStr) {
      conditions.push(`p.id IN (${pairIdsStr})`);
    }
    if (timestampsStr) {
      conditions.push(`ps.timestamp IN (${timestampsStr})`);
    }

    conditions.push(`p.address = '${protocolAddress}'`);

    if (pagination.after) {
      conditions.push(`p.id ${pagination.order === 'DESC' ? '<' : '>'} ${pagination.after}`);
    }

    if (pagination.before) {
      conditions.push(`p.id ${pagination.order === 'DESC' ? '>' : '<'} ${pagination.before}`);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const query = `
      SELECT 
        p.*,
        t0.id as "token0Id",
        t0.name as "token0Name",
        t1.id as "token1Id",
        t1.name as "token1Name",
        ps."tvlUsd",
        ps."volume24hUsd",
        ps."volume7dUsd",
        ps."transactionCount24h",
        ps."apr24h"
      FROM "Pairs" p
      JOIN "Tokens" t0 ON p."token0Id" = t0.id
      JOIN "Tokens" t1 ON p."token1Id" = t1.id
      JOIN "PoolStats" ps ON p.id = ps."pairId"
      ${whereClause}
      ORDER BY ps."${POOL_ORDER_BY_MAP[orderBy || 'TVL_USD_DESC'].field}" ${POOL_ORDER_BY_MAP[orderBy || 'TVL_USD_DESC'].direction}
      LIMIT ${pagination.limit}
    `;

    const pairs = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const promises = pairs.map((pair: any) => this.getPool(pair));
    const pools = await Promise.all(promises);
    const edges = pools
      .filter((pool): pool is Pool => pool !== null)
      .map(pool => ({
        cursor: pool.id,
        node: pool,
      }));

    const totalCount = await Pair.count({
      where: {
        id: {
          [Op.in]: pairIds,
        },
        ...(protocolAddress ? { address: protocolAddress } : {}),
      },
    });

    const pageInfo = getPageInfo({
      edges,
      order: pagination.order,
      limit: pagination.limit,
      after,
      before,
    });

    return {
      edges,
      pageInfo: pageInfo.pageInfo,
      totalCount,
    };
  }

  async getPool(params: GetPoolParams): Promise<Pool | null> {
    const { id } = params;

    // Get the pair
    const pairQuery = `
      SELECT 
        p.id,
        p.address,
        p."token0Id",
        p."token1Id",
        p.reserve0,
        p.reserve1,
        p."totalSupply",
        p.key,
        p."createdAt",
        p."updatedAt"
      FROM "Pairs" p
      WHERE p.id = $1
    `;

    const [pairResult] = await sequelize.query(pairQuery, {
      type: QueryTypes.SELECT,
      bind: [id],
    });

    if (!pairResult) {
      throw new Error(`Token pair not found for pool ${id}`);
    }
    const pair = pairResult as any;

    // Get the tokens
    const tokensQuery = `
      SELECT t.*
      FROM "Tokens" t
      WHERE t.id = $1 OR t.id = $2
    `;

    const tokens = await sequelize.query(tokensQuery, {
      type: QueryTypes.SELECT,
      bind: [pair.token0Id, pair.token1Id],
    });

    const token0 = tokens.find((t: any) => t.id === pair.token0Id) as TokenModel;
    const token1 = tokens.find((t: any) => t.id === pair.token1Id) as TokenModel;
    if (!token0 || !token1) {
      throw new Error(`Tokens not found for pool ${id}`);
    }

    // Get the latest pool stats
    const statsQuery = `
      WITH current_stats AS (
        SELECT 
          "tvlUsd",
          "volume24hUsd",
          "volume7dUsd",
          "fees24hUsd",
          "transactionCount24h",
          "apr24h",
          timestamp
        FROM "PoolStats"
        WHERE "pairId" = $1
        ORDER BY timestamp DESC
        LIMIT 1
      ),
      previous_stats AS (
        SELECT 
          "tvlUsd",
          "volume24hUsd",
          "fees24hUsd",
          "transactionCount24h"
        FROM "PoolStats"
        WHERE "pairId" = $1
          AND timestamp <= (SELECT timestamp - INTERVAL '24 hours' FROM current_stats)
        ORDER BY timestamp DESC
        LIMIT 1
      )
      SELECT 
        cs.*,
        ps."tvlUsd" as "previousTvlUsd",
        ps."volume24hUsd" as "previousVolume24hUsd",
        ps."fees24hUsd" as "previousFees24hUsd",
        ps."transactionCount24h" as "previousTransactionCount24h"
      FROM current_stats cs
      LEFT JOIN previous_stats ps ON true
    `;
    const [statsResult] = await sequelize.query(statsQuery, {
      type: QueryTypes.SELECT,
      bind: [id],
    });

    const stats = statsResult
      ? (statsResult as any)
      : {
          tvlUsd: 0,
          volume24hUsd: 0,
          volume7dUsd: 0,
          fees24hUsd: 0,
          transactionCount24h: 0,
          apr24h: 0,
          previousTvlUsd: 0,
          previousVolume24hUsd: 0,
          previousFees24hUsd: 0,
          previousTransactionCount24h: 0,
        };
    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    const tvlChange24h = calculatePercentageChange(
      parseFloat(stats.tvlUsd),
      parseFloat(stats.previousTvlUsd),
    );
    const volumeChange24h = calculatePercentageChange(
      parseFloat(stats.volume24hUsd),
      parseFloat(stats.previousVolume24hUsd),
    );
    const feesChange24h = calculatePercentageChange(
      parseFloat(stats.fees24hUsd),
      parseFloat(stats.previousFees24hUsd),
    );
    const transactionCountChange24h = calculatePercentageChange(
      stats.transactionCount24h,
      stats.previousTransactionCount24h,
    );

    const charts = await this.getPoolCharts({
      pairId: parseInt(pair.id),
      timeFrame: TimeFrame.Day,
    });
    const transactions = await this.getPoolTransactions({
      pairId: parseInt(pair.id),
      first: 10,
    });

    return {
      __typename: 'Pool',
      id: pair.id.toString(),
      address: pair.address,
      token0: {
        __typename: 'Token',
        id: token0.id.toString(),
        name: token0.name,
        chainId: '0',
      },
      token1: {
        __typename: 'Token',
        id: token1.id.toString(),
        name: token1.name,
        chainId: '0',
      },
      reserve0: pair.reserve0,
      reserve1: pair.reserve1,
      totalSupply: pair.totalSupply,
      key: pair.key,
      tvlUsd: stats.tvlUsd ?? 0,
      tvlChange24h,
      volume24hUsd: stats.volume24hUsd ?? 0,
      volumeChange24h,
      volume7dUsd: stats.volume7dUsd ?? 0,
      fees24hUsd: stats.fees24hUsd ?? 0,
      feesChange24h,
      transactionCount24h: stats.transactionCount24h ?? 0,
      transactionCountChange24h,
      apr24h: stats.apr24h ?? 0,
      createdAt: pair.createdAt,
      updatedAt: pair.updatedAt,
      charts,
      transactions,
    };
  }

  async getPoolTransactions(
    params: GetPoolTransactionsParams,
  ): Promise<PoolTransactionsConnection | null> {
    const { pairId, type, first, after, last, before } = params;
    const limit = first || last || 10;
    const order = last ? 'ASC' : 'DESC';

    let query = `
      SELECT 
        t.id,
        t.type,
        t.maker,
        t."amount0In",
        t."amount1In",
        t."amount0Out",
        t."amount1Out",
        t."amountUsd",
        t."timestamp",
        t."transactionId",
        t."requestkey"
      FROM "PoolTransactions" t
      WHERE t."pairId" = $1
    `;

    const queryParams: any[] = [pairId];
    let paramIndex = 2;

    if (type) {
      query += ` AND t.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (after) {
      const afterId = parseInt(Buffer.from(after, 'base64').toString());
      query += ` AND t.id ${order === 'DESC' ? '<' : '>'} $${paramIndex}`;
      queryParams.push(afterId);
      paramIndex++;
    }

    if (before) {
      const beforeId = parseInt(Buffer.from(before, 'base64').toString());
      query += ` AND t.id ${order === 'DESC' ? '>' : '<'} $${paramIndex}`;
      queryParams.push(beforeId);
      paramIndex++;
    }

    query += ` ORDER BY t.id ${order} LIMIT $${paramIndex}`;
    queryParams.push(limit);
    const result = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      bind: queryParams,
    });

    const edges =
      result.length > 0
        ? (result as any[]).map(row => ({
            cursor: Buffer.from(row.id.toString()).toString('base64'),
            node: {
              __typename: 'PoolTransaction',
              id: row.id.toString(),
              maker: row.maker,
              amount0In: row.amount0In?.toString() ?? '0',
              amount1In: row.amount1In?.toString() ?? '0',
              amount0Out: row.amount0Out?.toString() ?? '0',
              amount1Out: row.amount1Out?.toString() ?? '0',
              amountUsd: row.amountUsd.toString(),
              timestamp: row.timestamp,
              transactionId: row.transactionId,
              requestkey: row.requestkey,
              transactionType: row.type,
            },
          }))
        : [];

    const countQuery = `
      SELECT COUNT(*)
      FROM "PoolTransactions"
      WHERE "pairId" = $1
      ${type ? 'AND type = $2' : ''}
    `;

    const countResult = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      bind: type ? [pairId, type] : [pairId],
    });

    const totalCount = parseInt((countResult[0] as any).count);

    return {
      edges,
      pageInfo: {
        hasNextPage: limit + (after ? 0 : 1) < totalCount,
        hasPreviousPage: limit + (before ? 0 : 1) > 0,
        startCursor: edges[0]?.cursor || null,
        endCursor: edges[edges.length - 1]?.cursor || null,
      },
      totalCount,
    };
  }

  async getPoolCharts({ pairId, timeFrame }: GetPoolChartsParams): Promise<PoolCharts> {
    const now = new Date();
    let startDate: Date;

    switch (timeFrame) {
      case TimeFrame.Day:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case TimeFrame.Week:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case TimeFrame.Month:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case TimeFrame.Year:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case TimeFrame.All:
        startDate = new Date(0); // Beginning of Unix time
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24h
    }

    // Get TVL data from PoolStats
    const tvlData = await sequelize.query<{ timestamp: Date; tvlUsd: number }>(
      `
      SELECT 
        date_trunc('hour', "createdAt") as timestamp,
        AVG("tvlUsd") as "tvlUsd"
      FROM "PoolStats"
      WHERE "pairId" = :pairId
        AND "createdAt" >= :startDate
      GROUP BY date_trunc('hour', "createdAt")
      ORDER BY timestamp ASC
      `,
      {
        replacements: {
          pairId,
          startDate: startDate.toISOString(),
        },
        type: QueryTypes.SELECT,
      },
    );

    // Get volume and fees data from PoolTransactions
    const volumeAndFeesData = await sequelize.query<{
      timestamp: Date;
      volume: number;
      fees: number;
    }>(
      `
      SELECT 
        date_trunc('hour', "createdAt") as timestamp,
        SUM("amountUsd") as volume,
        SUM("feeUsd") as fees
      FROM "PoolTransactions"
      WHERE "pairId" = :pairId
        AND "createdAt" >= :startDate
      GROUP BY date_trunc('hour', "createdAt")
      ORDER BY timestamp ASC
      `,
      {
        replacements: {
          pairId,
          startDate: startDate.toISOString(),
        },
        type: QueryTypes.SELECT,
      },
    );

    // Create a map of timestamps to data points
    const dataMap = new Map<string, { volume: number; fees: number; tvl: number }>();

    // Initialize all timestamps with zero values
    const allTimestamps = new Set([
      ...tvlData.map(d => d.timestamp.toISOString()),
      ...volumeAndFeesData.map(d => d.timestamp.toISOString()),
    ]);

    allTimestamps.forEach(timestamp => {
      dataMap.set(timestamp, { volume: 0, fees: 0, tvl: 0 });
    });

    // Fill in TVL data
    tvlData.forEach(data => {
      const timestamp = data.timestamp.toISOString();
      const existing = dataMap.get(timestamp) || { volume: 0, fees: 0, tvl: 0 };
      dataMap.set(timestamp, { ...existing, tvl: data.tvlUsd });
    });

    // Fill in volume and fees data
    volumeAndFeesData.forEach(data => {
      const timestamp = data.timestamp.toISOString();
      const existing = dataMap.get(timestamp) || { volume: 0, fees: 0, tvl: 0 };
      dataMap.set(timestamp, {
        ...existing,
        volume: data.volume,
        fees: data.fees,
      });
    });

    // Convert map to arrays of data points
    const sortedTimestamps = Array.from(dataMap.keys()).sort();

    return {
      volume: sortedTimestamps.map(timestamp => ({
        timestamp: new Date(timestamp),
        value: dataMap.get(timestamp)?.volume ?? 0,
      })),
      tvl: sortedTimestamps.map(timestamp => ({
        timestamp: new Date(timestamp),
        value: dataMap.get(timestamp)?.tvl ?? 0,
      })),
      fees: sortedTimestamps.map(timestamp => ({
        timestamp: new Date(timestamp),
        value: dataMap.get(timestamp)?.fees ?? 0,
      })),
    };
  }
}
