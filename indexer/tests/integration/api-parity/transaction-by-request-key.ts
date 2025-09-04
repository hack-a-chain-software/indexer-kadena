import { gql } from 'graphql-request';

export const transactionByRequestKeyQueryGql = gql`
  query transactionByRequestKey($requestKey: String!) {
    transaction(requestKey: $requestKey) {
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
