import { gql } from 'graphql-request';

export const eventsQueryGql = gql`
  query events($blockHash: String!) {
    events(blockHash: $blockHash, qualifiedEventName: "free.crankk01.TRANSFER", first: 500) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
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
