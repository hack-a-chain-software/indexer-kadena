import { gql } from 'graphql-request';

export const lastBlockHeightQueryGql = gql`
  query {
    lastBlockHeight
  }
`;
