import {
  NonFungibleChainAccount,
  NonFungibleChainAccountTransactionsConnection,
  NonFungibleChainAccountTransfersConnection,
} from '../../config/graphql-types';
import { INonFungibleChainAccount } from '../../repository/application/balance-repository';
import { NftInfo } from '../../repository/gateway/pact-gateway';

export const buildNonFungibleChainAccount = (
  acc: INonFungibleChainAccount,
  nftsInfo: NftInfo[],
): NonFungibleChainAccount => {
  const nonFungibleTokenBalances = (nftsInfo ?? []).map((nft, index) => ({
    id: acc.nonFungibleTokenBalances[index].id,
    accountName: acc.accountName,
    chainId: acc.nonFungibleTokenBalances[index].chainId,
    tokenId: acc.nonFungibleTokenBalances[index].tokenId,
    balance: nft.balance,
    version: nft.version,
    guard: nft.guard,
    info: {
      precision: nft.precision,
      supply: nft.supply,
      uri: nft.uri,
    },
  }));

  return {
    id: acc.id,
    accountName: acc.accountName,
    chainId: acc.chainId,
    nonFungibleTokenBalances,
    transactions: {} as NonFungibleChainAccountTransactionsConnection,
    transfers: {} as NonFungibleChainAccountTransfersConnection,
  };
};
