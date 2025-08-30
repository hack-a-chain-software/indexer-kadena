import { gql } from 'graphql-request';

export const nonFungibleChainAccountQueryGql = gql`
  query nonFungibleChainAccount($accountName: String!, $chainId: String!) {
    nonFungibleChainAccount(accountName: $accountName, chainId: $chainId) {
      id
      accountName
      nonFungibleTokenBalances {
        id
        accountName
        chainId
        guard {
          ... on KeysetGuard {
            keys
            predicate
          }
        }
        info {
          precision
          supply
          uri
        }
        tokenId
        version
      }
    }
  }
`;
