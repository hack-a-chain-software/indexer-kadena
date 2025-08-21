import { gql } from 'graphql-request';

export const getTransactionsByPactCodeQuery = (params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getTransactionsByPactCodeQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      transactionsByPactCode(${query}) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        edges {
          cursor
          node {
            creationTime
            requestKey
            chainId
            height
            canonical
            gas
            gasLimit
            gasPrice
            sender
          }
        }
      }
    }
  `;

  return queryGql;
};
