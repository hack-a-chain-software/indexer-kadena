import { gql } from 'graphql-request';

export const blockQueryGql = gql`
  query block($hash: String!) {
    block(hash: $hash) {
      chainId
      creationTime
      difficulty
      epoch
      hash
      height
      id
      minerAccount {
        accountName
        # balance
        chainId
        fungibleName
        guard {
          ... on KeysetGuard {
            keys
            predicate
            raw
          }
        }
        id
      }
      neighbors {
        chainId
        hash
      }
      parent {
        chainId
      }
      payloadHash
      powHash
    }
  }
`;
