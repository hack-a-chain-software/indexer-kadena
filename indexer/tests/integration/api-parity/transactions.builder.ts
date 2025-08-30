import { gql } from 'graphql-request';

export const transactionsQueryGql = gql`
  query transactions($blockHash: String!) {
    transactions(blockHash: $blockHash, first: 500) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          hash
          cmd {
            meta {
              sender
            }
            payload {
              ... on ExecutionPayload {
                code
              }
            }
          }
          result {
            ... on TransactionResult {
              badResult
              goodResult
              continuation
            }
          }
        }
      }
    }
  }
`;
