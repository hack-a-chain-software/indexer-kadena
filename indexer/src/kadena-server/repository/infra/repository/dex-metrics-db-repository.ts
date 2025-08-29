import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../../config/database';
import {
  DexMetrics,
  DexMetricsRepository,
  GetDexMetricsParams,
} from '../../application/dex-metrics-repository';
import { dexMetricsValidator } from '../schema-validator/dex-metrics-schema-validator';
const DEFAULT_PROTOCOL_ADDRESS = 'kdlaunch.kdswap-exchange';

export default class DexMetricsDbRepository implements DexMetricsRepository {
  async getDexMetrics(params: GetDexMetricsParams): Promise<DexMetrics> {
    const { startDate, endDate, protocolAddress } = params;
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || now;

    // Get total pools count
    const totalPoolsQuery = `SELECT COUNT(*) FROM "Pairs" WHERE address = $1`;
    const totalPoolsResult = await sequelize.query(totalPoolsQuery, {
      type: QueryTypes.SELECT,
      bind: protocolAddress ? [protocolAddress] : [DEFAULT_PROTOCOL_ADDRESS],
    });
    const totalPools = parseInt((totalPoolsResult[0] as any).count, 10);

    // Get current TVL
    const currentTvlQuery = `
      WITH latest_stats AS (
        SELECT DISTINCT ON (ps."pairId") 
          ps.*
        FROM "PoolStats" ps
        JOIN "Pairs" p ON p.id = ps."pairId" WHERE p.address = $1
        ORDER BY ps."pairId", ps.timestamp DESC
      )
      SELECT COALESCE(SUM(CAST(ls."tvlUsd" AS DECIMAL)), 0) as "currentTvlUsd"
      FROM latest_stats ls
    `;

    const [currentTvlResult] = await sequelize.query(currentTvlQuery, {
      type: QueryTypes.SELECT,
      bind: protocolAddress ? [protocolAddress] : [DEFAULT_PROTOCOL_ADDRESS],
    });

    // Get TVL history
    const tvlHistoryQuery = `
     SELECT
        date_trunc('day', t.timestamp) AS timestamp,
        SUM(CAST(t."tvlUsd" AS DECIMAL)) AS value
      FROM (
        SELECT
          pc."pairId",
          pc."tvlUsd",
          pc."timestamp",
          ROW_NUMBER() OVER (
            PARTITION BY pc."pairId", date_trunc('day', pc."timestamp")
            ORDER BY pc."timestamp" DESC
          ) as rn
        FROM "PoolCharts" pc
        JOIN "Pairs" p ON p.id = pc."pairId"
        WHERE pc.timestamp BETWEEN $1 AND $2
          AND p.address = $3
      ) t
      WHERE t.rn = 1
      GROUP BY date_trunc('day', t.timestamp)
      ORDER BY timestamp ASC;
    `;

    const tvlHistory = await sequelize.query(tvlHistoryQuery, {
      type: QueryTypes.SELECT,
      bind: protocolAddress
        ? [queryStartDate, queryEndDate, protocolAddress]
        : [queryStartDate, queryEndDate, DEFAULT_PROTOCOL_ADDRESS],
    });

    // Get volume history
    const volumeHistoryQuery = `
      SELECT 
        date_trunc('day', pt.timestamp) as timestamp,
        SUM(pt."amountUsd") as value
      FROM "PoolTransactions" pt
      JOIN "Pairs" p ON p.id = pt."pairId"
      WHERE pt.timestamp BETWEEN $1 AND $2
      AND p.address = $3
      GROUP BY date_trunc('day', pt.timestamp)
      ORDER BY timestamp ASC
    `;

    const volumeHistory = await sequelize.query(volumeHistoryQuery, {
      type: QueryTypes.SELECT,
      bind: protocolAddress
        ? [queryStartDate, queryEndDate, protocolAddress]
        : [queryStartDate, queryEndDate, DEFAULT_PROTOCOL_ADDRESS],
    });

    // Get total volume
    const totalVolumeQuery = `
      SELECT COALESCE(SUM(pt."amountUsd"), 0) as "totalVolumeUsd"
      FROM "PoolTransactions" pt
      JOIN "Pairs" p ON p.id = pt."pairId"
      WHERE pt.timestamp BETWEEN $1 AND $2
      AND p.address = $3
    `;

    const [totalVolumeResult] = await sequelize.query(totalVolumeQuery, {
      type: QueryTypes.SELECT,
      bind: protocolAddress
        ? [queryStartDate, queryEndDate, protocolAddress]
        : [queryStartDate, queryEndDate, DEFAULT_PROTOCOL_ADDRESS],
    });

    const result = {
      totalPools,
      currentTvlUsd: parseFloat((currentTvlResult as any).currentTvlUsd),
      tvlHistory: (tvlHistory as any[]).map(item => ({
        timestamp: item.timestamp,
        value: parseFloat(item.value),
      })),
      volumeHistory: (volumeHistory as any[]).map(item => ({
        timestamp: item.timestamp,
        value: parseFloat(item.value),
      })),
      totalVolumeUsd: parseFloat((totalVolumeResult as any).totalVolumeUsd),
    };

    return dexMetricsValidator.validate(result);
  }
}
