import { gql } from 'graphql-request';

export const getTokensQuery = (params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getTokensQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      tokens(${query}) {
        edges {
          cursor
          node {
            id
            name
            chainId
          }
        }
      }
    }
  `;

  return queryGql;
};
