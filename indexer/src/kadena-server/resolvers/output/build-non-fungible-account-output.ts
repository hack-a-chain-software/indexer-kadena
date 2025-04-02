import {
  NonFungibleAccount,
  NonFungibleAccountTransactionsConnection,
} from '../../config/graphql-types';
import { INonFungibleAccount } from '../../repository/application/balance-repository';
import { NftInfo } from '../../repository/gateway/pact-gateway';

export const buildNonFungibleAccount = (
  account: INonFungibleAccount | null,
  nftsInfo: NftInfo[],
): NonFungibleAccount | null => {
  if (!account) return null;

  const nonFungibleTokenBalances = (nftsInfo ?? []).map((nft, index) => ({
    id: account.nonFungibleTokenBalances[index].id,
    accountName: account.accountName,
    chainId: account.nonFungibleTokenBalances[index].chainId,
    tokenId: account.nonFungibleTokenBalances[index].tokenId,
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
    id: account.id,
    accountName: account.accountName,
    nonFungibleTokenBalances,
    // for resolvers
    chainAccounts: [],
    transactions: {} as NonFungibleAccountTransactionsConnection,
  };
};
