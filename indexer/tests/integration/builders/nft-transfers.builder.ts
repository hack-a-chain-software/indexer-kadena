import { gql } from 'graphql-request';

export const getNftTransfersQuery = (params: any): string => {
  if (Object.keys(params).length === 0) {
    throw new Error('No parameters provided to getNftTransfersQuery.');
  }

  const query = Object.entries(params)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`)
    .join(', ');

  const queryGql = gql`
    query {
      transfers(${query}) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        edges {
          cursor
          node {
            amount
            block {
              chainId
            }
            creationTime
            crossChainTransfer {
              id
            }
            id
            tokenId
            moduleHash
            moduleName
            orderIndex
            receiverAccount
            requestKey
            senderAccount
            transaction {
              id
            }
          }
        }
      }
    }
  `;

  return queryGql;
};
