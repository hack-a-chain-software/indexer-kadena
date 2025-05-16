import { QueryTypes } from 'sequelize';
import { sequelize } from '../../../../config/database';
import Pair from '../../../../models/pair';
import {
  DexMetrics,
  DexMetricsRepository,
  GetDexMetricsParams,
} from '../../application/dex-metrics-repository';
import { dexMetricsValidator } from '../schema-validator/dex-metrics-schema-validator';

export default class DexMetricsDbRepository implements DexMetricsRepository {
  async getDexMetrics(params: GetDexMetricsParams): Promise<DexMetrics> {
    const { startDate, endDate } = params;
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const queryStartDate = startDate || defaultStartDate;
    const queryEndDate = endDate || now;

    // Get total pools count
    const totalPools = await Pair.count();

    // Get current TVL
    const currentTvlQuery = `
      WITH latest_stats AS (
        SELECT DISTINCT ON (ps."pairId") 
          ps.*
        FROM "PoolStats" ps
        ORDER BY ps."pairId", ps.timestamp DESC
      )
      SELECT COALESCE(SUM(CAST(ls."tvlUsd" AS DECIMAL)), 0) as "currentTvlUsd"
      FROM latest_stats ls
    `;

    const [currentTvlResult] = await sequelize.query(currentTvlQuery, {
      type: QueryTypes.SELECT,
    });

    // Get TVL history
    const tvlHistoryQuery = `
      SELECT 
        date_trunc('day', timestamp) as timestamp,
        SUM(CAST("tvlUsd" AS DECIMAL)) as value
      FROM "PoolCharts"
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY date_trunc('day', timestamp)
      ORDER BY timestamp ASC
    `;

    const tvlHistory = await sequelize.query(tvlHistoryQuery, {
      type: QueryTypes.SELECT,
      bind: [queryStartDate, queryEndDate],
    });

    // Get volume history
    const volumeHistoryQuery = `
      SELECT 
        date_trunc('day', timestamp) as timestamp,
        SUM("amountUsd") as value
      FROM "PoolTransactions"
      WHERE timestamp BETWEEN $1 AND $2
      GROUP BY date_trunc('day', timestamp)
      ORDER BY timestamp ASC
    `;

    const volumeHistory = await sequelize.query(volumeHistoryQuery, {
      type: QueryTypes.SELECT,
      bind: [queryStartDate, queryEndDate],
    });

    // Get total volume
    const totalVolumeQuery = `
      SELECT COALESCE(SUM("amountUsd"), 0) as "totalVolumeUsd"
      FROM "PoolTransactions"
      WHERE timestamp BETWEEN $1 AND $2
    `;

    const [totalVolumeResult] = await sequelize.query(totalVolumeQuery, {
      type: QueryTypes.SELECT,
      bind: [queryStartDate, queryEndDate],
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
