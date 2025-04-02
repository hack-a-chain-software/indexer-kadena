export interface NftInfo {
  version: string;
  supply: number;
  precision: number;
  uri: string;
  balance: number;
  guard: {
    keys: string[];
    predicate: string;
    raw: string;
  };
}

export type GetNftsInfoParams = Array<{ tokenId: string; chainId: string; module?: string }>;

export default interface PactGateway {
  getNftsInfo(data: GetNftsInfoParams, account: string): Promise<NftInfo[]>;
}
