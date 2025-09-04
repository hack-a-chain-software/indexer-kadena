import { gql } from 'graphql-request';

export const pactQueryGql = gql`
  query pactQuery($pactQueries: [PactQuery!]!) {
    pactQuery(pactQuery: $pactQueries) {
      chainId
      code
      error
      result
      status
    }
  }
`;
