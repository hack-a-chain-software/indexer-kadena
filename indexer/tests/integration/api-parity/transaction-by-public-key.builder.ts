import { gql } from 'graphql-request';

export const transactionByPublicKeyQueryGql = gql`
  query transactionByPublicKey($publicKey: String!) {
    transactionsByPublicKey(publicKey: $publicKey, first: 50) {
      edges {
        node {
          cmd {
            meta {
              chainId
              creationTime
              gasLimit
              gasPrice
              sender
              ttl
            }
            networkId
            nonce
            payload {
              ... on ExecutionPayload {
                code
                data
              }
            }
            signers {
              address
              clist {
                args
                name
              }
              id
              orderIndex
              pubkey
              scheme
            }
          }
          hash
          id
          result {
            ... on TransactionResult {
              badResult
              block {
                id
              }
              continuation
              eventCount
              # events {
              #   pageInfo {
              #     endCursor
              #     hasNextPage
              #     hasPreviousPage
              #     startCursor
              #   }
              #   edges {
              #     node {
              #       id
              #     }
              #   }
              # }
              gas
              goodResult
              logs
              transactionId
              transfers {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
          sigs {
            sig
          }
        }
      }
    }
  }
`;
