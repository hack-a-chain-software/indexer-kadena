export interface NetworkStatistics {
  coinsInCirculation: number;
  transactionCount: number;
}

export interface HashRateAndTotalDifficulty {
  networkHashRate: number;
  totalDifficulty: number;
}

export interface GetNodeInfo {
  apiVersion: string;
  nodeBlockDelay: number;
  networkHost: string;
  networkId: string;
  nodeChains: string[];
  numberOfChains: number;
  genesisHeights: Array<{ chainId: string; height: number }>;
  nodePackageVersion: string;
  nodeServiceDate: Date | null;
  nodeLatestBehaviorHeight: number;
}

type AllInfo = NetworkStatistics & HashRateAndTotalDifficulty & GetNodeInfo;

export default interface NetworkRepository {
  getNetworkStatistics(): Promise<NetworkStatistics>;
  getHashRateAndTotalDifficulty(chainIds: number[]): Promise<HashRateAndTotalDifficulty>;
  getNodeInfo(): Promise<GetNodeInfo>;
  getAllInfo(): Promise<AllInfo>;
}
