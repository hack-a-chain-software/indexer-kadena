import { FungibleAccount, FungibleChainAccount, PageInfo, Token } from '../../config/graphql-types';
import { PaginationsParams } from '../pagination';
import { ConnectionEdge } from '../types';

export interface INonFungibleTokenBalance {
  id: string;
  accountName: string;
  balance: number;
  chainId: string;
  tokenId: string;
  module: string;
}

export interface INonFungibleAccount {
  id: string;
  accountName: string;
  chainAccounts: INonFungibleChainAccount[];
  nonFungibleTokenBalances: Array<INonFungibleTokenBalance>;
}

export interface INonFungibleChainAccount {
  accountName: string;
  chainId: string;
  id: string;
  nonFungibleTokenBalances: Array<INonFungibleTokenBalance>;
}

export type FungibleAccountOutput = Omit<
  FungibleAccount,
  'chainAccounts' | 'transactions' | 'transfers'
>;

export type FungibleChainAccountOutput = Omit<FungibleChainAccount, 'transactions' | 'transfers'>;

export type TokenOutput = Token;

export interface GetTokensParams extends PaginationsParams {}

export default interface BalanceRepository {
  getAccountInfo(accountName: string, fungibleName?: string | null): Promise<FungibleAccountOutput>;

  getChainsAccountInfo(
    accountName: string,
    fungibleName: string,
    chainIds?: string[],
  ): Promise<FungibleChainAccountOutput[]>;

  getAccountsByPublicKey(publicKey: string, fungibleName: string): Promise<FungibleAccountOutput[]>;

  getChainAccountsByPublicKey(
    publicKey: string,
    fungibleName: string,
    chainId: string,
  ): Promise<FungibleChainAccountOutput[]>;

  getNonFungibleAccountInfo(accountName: string): Promise<INonFungibleAccount | null>;

  getNonFungibleChainAccountInfo(
    accountName: string,
    chainId: string,
  ): Promise<INonFungibleChainAccount | null>;

  getNonFungibleChainAccountsInfo(accountName: string): Promise<INonFungibleChainAccount[]>;

  getNonFungibleTokenBalance(
    accountName: string,
    chainId: string,
    tokenId: string,
  ): Promise<INonFungibleTokenBalance | null>;

  getTokens(params: GetTokensParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<TokenOutput>[];
  }>;

  /** methods below use balance from node */
  getAccountInfo_NODE(
    accountName: string,
    fungibleName?: string | null,
  ): Promise<FungibleAccountOutput>;

  getChainsAccountInfo_NODE(
    accountName: string,
    fungibleName: string,
    chainIds?: string[],
  ): Promise<FungibleChainAccountOutput[]>;

  getAccountsByPublicKey_NODE(
    publicKey: string,
    fungibleName: string,
  ): Promise<FungibleAccountOutput[]>;

  getChainAccountsByPublicKey_NODE(
    publicKey: string,
    fungibleName: string,
    chainId: string,
  ): Promise<FungibleChainAccountOutput[]>;
}
