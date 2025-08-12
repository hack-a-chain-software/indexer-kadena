import { gql } from 'graphql-request';

export const blockQueryGql = gql`
  query {
    block(hash: "iVyDpWHv4ITrvZTHLHKxjaUpydxeiHeASwcfjY1SUxk") {
      chainId
      creationTime
      difficulty
      epoch
      hash
      height
      id
      minerAccount {
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
