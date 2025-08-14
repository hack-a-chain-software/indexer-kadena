import { gql } from 'graphql-request';

export const fungibleAccountsByPublicKeyQueryGql = gql`
  query fungibleAccountsByPublicKey($publicKey: String!) {
    fungibleAccountsByPublicKey(publicKey: $publicKey) {
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
