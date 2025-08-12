import { gql } from 'graphql-request';

export const transactionByRequestKeyQueryGql = gql`
  query {
    transaction(requestKey: "Jeva9G9yC0WKOvZPS0VamcVp5wJqOOXZW4jdlnIcE9k") {
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
`;
