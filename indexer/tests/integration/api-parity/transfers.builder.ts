import { gql } from 'graphql-request';

export const transfersQueryGql = gql`
  query transfers($blockHash: String!) {
    transfers(blockHash: $blockHash, first: 500) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          amount
          block {
            chainId
          }
          creationTime
          id
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
