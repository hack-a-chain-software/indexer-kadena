import { gql } from 'graphql-request';

export const completedBlockHeightsQueryGql = gql`
  query completedBlockHeights($completedHeights: Boolean) {
    completedBlockHeights(completedHeights: $completedHeights, first: 20) {
      edges {
        node {
          chainId
          creationTime
          difficulty
          hash
          epoch
          events {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              node {
                chainId
                height
                id
                moduleName
                name
                orderIndex
                parameters
                parameterText
                qualifiedName
                requestKey
              }
            }
          }
          flags
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
          nonce
          parent {
            chainId
          }
          payloadHash
          powHash
          target
          transactions {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              node {
                id
              }
            }
          }
          weight
        }
      }
    }
  }
`;
