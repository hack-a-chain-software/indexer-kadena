import { gql } from 'graphql-request';

export const getTransactionQuery = (params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getTransactionQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      transaction(${query}) {
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

  return queryGql;
};
