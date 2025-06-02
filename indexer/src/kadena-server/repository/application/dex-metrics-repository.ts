export interface GetDexMetricsParams {
  startDate?: Date | null;
  endDate?: Date | null;
  protocolAddress?: string | null;
}

export interface DexMetrics {
  totalPools: number;
  currentTvlUsd: number;
  tvlHistory: Array<{
    timestamp: Date;
    value: number;
  }>;
  volumeHistory: Array<{
    timestamp: Date;
    value: number;
  }>;
  totalVolumeUsd: number;
}

export interface DexMetricsRepository {
  getDexMetrics(params: GetDexMetricsParams): Promise<DexMetrics>;
}
