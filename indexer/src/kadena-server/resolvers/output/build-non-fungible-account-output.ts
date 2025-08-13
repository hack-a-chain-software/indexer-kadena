/**
 * Builder function for transforming non-fungible token accounts into GraphQL-compatible format
 *
 * This file is responsible for preparing NFT account data from the database and blockchain
 * to be returned through the GraphQL API. It combines data from the database repository with
 * additional NFT information retrieved from the blockchain to build a complete representation
 * of an NFT account.
 */

import {
  NonFungibleAccount,
  NonFungibleAccountTransactionsConnection,
  NonFungibleAccountTransfersConnection,
} from '../../config/graphql-types';
import { INonFungibleAccount } from '../../repository/application/balance-repository';
import { NftInfo } from '../../repository/gateway/pact-gateway';

/**
 * Transforms database and blockchain NFT account data into a GraphQL-compatible format
 *
 * This function combines data from two sources:
 * 1. Account information from the database repository (INonFungibleAccount)
 * 2. NFT token details from the blockchain (NftInfo)
 *
 * It merges these sources to create a complete representation of an NFT account that
 * conforms to the NonFungibleAccount type in the GraphQL schema. The function maps
 * each NFT token in the account to its corresponding blockchain information, building
 * a comprehensive list of the account's token balances with all metadata.
 *
 * The function also adds placeholder objects for related entities that will be resolved
 * by separate field resolvers (chainAccounts and transactions).
 *
 * @param account - The NFT account data from the database repository
 * @param nftsInfo - Array of NFT token information retrieved from the blockchain
 * @returns A GraphQL-compatible NFT account object or null if account doesn't exist
 */
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
    transfers: {} as NonFungibleAccountTransfersConnection,
  };
};
