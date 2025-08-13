import { gql } from 'graphql-request';

export const transfersQueryGql = gql`
  query {
    transfers(blockHash: "OT7c7X4Mql24dslm4Hvsc5tyKrjjxPDImyopqlRJKiQ", first: 25) {
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
