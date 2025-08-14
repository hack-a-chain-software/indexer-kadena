import { gql } from 'graphql-request';

export const graphConfigurationQueryGql = gql`
  query {
    graphConfiguration {
      minimumBlockHeight
      version
    }
  }
`;
