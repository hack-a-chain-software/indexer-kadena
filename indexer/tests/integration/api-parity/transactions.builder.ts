import { gql } from 'graphql-request';

export const transactionsQueryGql = gql`
  query {
    transactions(blockHash: "Qzi58vcpW97du01srIwxpwSQUPDRNBnl2EKyubP-IWw") {
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
