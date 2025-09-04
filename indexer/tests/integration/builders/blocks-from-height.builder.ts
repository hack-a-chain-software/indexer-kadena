import { gql } from 'graphql-request';

const buildBlocksFromHeightQuery = (params: any, includeTotalCount: boolean = true): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to buildBlocksFromHeightQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
    })
    .join(', ');

  const totalCountField = includeTotalCount ? 'totalCount' : '';

  const queryGql = gql`
    query {
      blocksFromHeight(${query}) {
        ${totalCountField}
        edges {
          cursor
          node {
            chainId
            creationTime
            difficulty
            epoch
            events {
              totalCount
              pageInfo {
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
              }
              edges {
                cursor
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
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
              }
              edges {
                cursor
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

  return queryGql;
};

export const getBlocksFromHeightQuery = (params: any): string => {
  return buildBlocksFromHeightQuery(params, true);
};

export const getBlocksFromHeightWithoutTotalCountQuery = (params: any): string => {
  return buildBlocksFromHeightQuery(params, false);
};
