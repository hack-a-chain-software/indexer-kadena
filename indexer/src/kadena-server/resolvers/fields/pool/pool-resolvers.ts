import { ResolverContext } from '../../../config/apollo-server-config';
import {
  Pool,
  TimeFrame,
  ChartDataPoint as GraphQLChartDataPoint,
} from '../../../config/graphql-types';

interface ChartDataPoint {
  timestamp: Date;
  value: number;
}

export const poolResolvers = {
  tvlUsd: (parent: any) => parent.poolStats?.[0]?.tvlUsd ?? 0,
  volume24hUsd: (parent: any) => parent.poolStats?.[0]?.volume24hUsd ?? 0,
  volume7dUsd: (parent: any) => parent.poolStats?.[0]?.volume7dUsd ?? 0,
  transactionCount24h: (parent: any) => parent.poolStats?.[0]?.transactionCount24h ?? 0,
  apr24h: (parent: any) => parent.poolStats?.[0]?.apr24h ?? 0,
  charts: async (
    parent: Pool,
    { timeFrame }: { timeFrame: TimeFrame },
    context: ResolverContext,
  ): Promise<{
    volume: GraphQLChartDataPoint[];
    tvl: GraphQLChartDataPoint[];
    fees: GraphQLChartDataPoint[];
  }> => {
    const charts = await context.poolRepository.getPoolCharts({
      pairId: parseInt(parent.id, 10),
      timeFrame,
    });

    const mapChartData = (data: ChartDataPoint[]): GraphQLChartDataPoint[] =>
      data.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
      }));

    return {
      volume: mapChartData(charts.volume),
      tvl: mapChartData(charts.tvl),
      fees: mapChartData(charts.fees),
    };
  },
};
