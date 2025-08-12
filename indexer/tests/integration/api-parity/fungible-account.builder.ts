import { gql } from 'graphql-request';

export const fungibleAccountQueryGql = gql`
  query {
    fungibleAccount(
      accountName: "k:1dc186034e79417a93f5cf05a99874c0a3681936faaf3d5963f77b262218fe82"
    ) {
      fungibleName
      accountName
      totalBalance
      chainAccounts {
        id
        accountName
        balance
        chainId
        fungibleName
        guard {
          ... on KeysetGuard {
            keys
            predicate
            raw
          }
        }
      }
    }
  }
`;
