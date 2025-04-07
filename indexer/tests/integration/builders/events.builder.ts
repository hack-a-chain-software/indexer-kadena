import { gql } from 'graphql-request';

export const getEventsQuery = (params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getEventsQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      events(${query}) {
        edges {
          cursor
          node {
            id
            chainId
            height
            moduleName
            moduleName
            name
            orderIndex
            parameters
            qualifiedName
            requestKey
          }
        }
      }
    }
  `;

  return queryGql;
};
