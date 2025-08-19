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

export interface CountersOfEachChain {
  chainId: string;
  blocksCount: number;
  transactionCount: number;
  totalGasUsed: string;
}

type AllInfo = NetworkStatistics &
  HashRateAndTotalDifficulty &
  GetNodeInfo & {
    countersOfEachChain: CountersOfEachChain[];
  };

export type CurrentChainHeights = Record<string, number>;

export default interface NetworkRepository {
  getNetworkStatistics(): Promise<NetworkStatistics>;
  getHashRateAndTotalDifficulty(chainIds: number[]): Promise<HashRateAndTotalDifficulty>;
  getNodeInfo(): Promise<GetNodeInfo>;
  getAllInfo(): Promise<AllInfo>;
  getCurrentChainHeights(): Promise<CurrentChainHeights>;
  getCountersOfEachChain(): Promise<CountersOfEachChain[]>;
}
