import { gql } from 'graphql-request';

export const eventsQueryGql = gql`
  query {
    events(
      blockHash: "Qzi58vcpW97du01srIwxpwSQUPDRNBnl2EKyubP-IWw"
      qualifiedEventName: "free.crankk01.TRANSFER"
    ) {
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
