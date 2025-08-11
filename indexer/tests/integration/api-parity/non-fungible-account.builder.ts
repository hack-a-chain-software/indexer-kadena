import { gql } from 'graphql-request';

export const nonFungibleAccountQueryGql = gql`
  query {
    nonFungibleAccount(
      accountName: "k:7b80749bd0c0f8dc793ffe6a0a4c75f8c74ef25008c45ca02bcc154ef00c7c31"
    ) {
      nonFungibleTokenBalances {
        accountName
        balance
        chainId
        guard {
          ... on KeysetGuard {
            keys
            predicate
          }
        }
        id
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
