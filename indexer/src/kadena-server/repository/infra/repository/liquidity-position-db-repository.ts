import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../../../../config/database';
import LiquidityBalance from '../../../../models/liquidity-balance';
import Pair from '../../../../models/pair';
import Token from '../../../../models/token';
import PoolStats from '../../../../models/pool-stats';
import { getPageInfo, getPaginationParams } from '../../pagination';
import {
  GetLiquidityPositionsParams,
  LiquidityPosition,
  LiquidityPositionsConnection,
} from '../../application/liquidity-position-repository';

export default class LiquidityPositionDbRepository {
  async getLiquidityPositions(
    params: GetLiquidityPositionsParams,
  ): Promise<LiquidityPositionsConnection> {
    const { walletAddress, first, after, last, before, orderBy } = params;
    const pagination = getPaginationParams({ after, before, first, last });

    // Get the latest stats for each pool
    const latestStats = await PoolStats.findAll({
      attributes: ['pairId', [sequelize.fn('MAX', sequelize.col('timestamp')), 'maxTimestamp']],
      group: ['pairId'],
    });

    const pairIds = latestStats.map(stat => stat.pairId);

    // If no pairIds, return empty result
    if (pairIds.length === 0) {
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };
    }

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

    // Build order by clause
    const orderByMap: Record<string, [string, string]> = {
      VALUE_USD_ASC: [
        '(CAST(lb.liquidity AS DECIMAL) / CAST(p."totalSupply" AS DECIMAL)) * CAST(ls."tvlUsd" AS DECIMAL)',
        'ASC',
      ],
      VALUE_USD_DESC: [
        '(CAST(lb.liquidity AS DECIMAL) / CAST(p."totalSupply" AS DECIMAL)) * CAST(ls."tvlUsd" AS DECIMAL)',
        'DESC',
      ],
      LIQUIDITY_ASC: ['lb.liquidity', 'ASC'],
      LIQUIDITY_DESC: ['lb.liquidity', 'DESC'],
      APR_ASC: ['ls."apr24h"', 'ASC'],
      APR_DESC: ['ls."apr24h"', 'DESC'],
    };

    const [orderField, orderDirection] = orderByMap[orderBy || 'VALUE_USD_DESC'];

    // Query to get positions with pool and token information
    let query = `
      WITH latest_stats AS (
        SELECT DISTINCT ON (ps."pairId") 
          ps.*
        FROM "PoolStats" ps
        WHERE ps."pairId" IN (${pairIds.join(',')})
        ORDER BY ps."pairId", ps.timestamp DESC
      )
      SELECT 
        lb.id,
        lb."pairId",
        lb.liquidity,
        lb."walletAddress",
        lb."createdAt",
        lb."updatedAt",
        p.id as "pairId",
        p.key as "pairKey",
        t0.id as "token0Id",
        t0.name as "token0Name",
        t1.id as "token1Id",
        t1.name as "token1Name",
        ls."tvlUsd",
        COALESCE(ls."apr24h", 0) as "apr24h",
        (CAST(lb.liquidity AS DECIMAL) / CAST(p."totalSupply" AS DECIMAL)) * CAST(ls."tvlUsd" AS DECIMAL) as "valueUsd"
      FROM "LiquidityBalances" lb
      JOIN "Pairs" p ON lb."pairId" = p.id
      JOIN "Tokens" t0 ON p."token0Id" = t0.id
      JOIN "Tokens" t1 ON p."token1Id" = t1.id
      JOIN latest_stats ls ON p.id = ls."pairId"
      WHERE lb."walletAddress" = $1
    `;

    const queryParams: any[] = [walletAddress];
    let paramIndex = 2;

    if (pagination.after) {
      query += ` AND lb.id ${pagination.order === 'DESC' ? '<' : '>'} $${paramIndex}`;
      queryParams.push(pagination.after);
      paramIndex++;
    }

    if (pagination.before) {
      query += ` AND lb.id ${pagination.order === 'DESC' ? '>' : '<'} $${paramIndex}`;
      queryParams.push(pagination.before);
      paramIndex++;
    }

    // First order by the requested field, then by id for consistent pagination
    query += ` ORDER BY ${orderField} ${orderDirection}, lb.id ${pagination.order} LIMIT $${paramIndex}`;
    queryParams.push(pagination.limit);

    const positions = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      bind: queryParams,
    });

    const edges = (positions as any[]).map(position => ({
      cursor: Buffer.from(position.id.toString()).toString('base64'),
      node: {
        id: position.id.toString(),
        pairId: position.pairId,
        liquidity: position.liquidity,
        walletAddress: position.walletAddress,
        valueUsd: position.valueUsd,
        apr24h: position.apr24h,
        pair: {
          id: position.pairId.toString(),
          token0: {
            id: position.token0Id.toString(),
            name: position.token0Name,
            chainId: '0',
          },
          token1: {
            id: position.token1Id.toString(),
            name: position.token1Name,
            chainId: '0',
          },
        },
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
      } as LiquidityPosition,
    }));

    const totalCount = await LiquidityBalance.count({
      where: {
        walletAddress,
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
}
