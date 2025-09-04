import { gql } from 'graphql-request';

export const fungibleChainAccountsByPublicKeyQueryGql = gql`
  query fungibleChainAccountsByPublicKey($publicKey: String!, $chainId: String!) {
    fungibleChainAccountsByPublicKey(publicKey: $publicKey, chainId: $chainId) {
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
`;
