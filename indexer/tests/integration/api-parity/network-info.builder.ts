import { gql } from 'graphql-request';

export const networkInfoQueryGql = gql`
  query {
    networkInfo {
      apiVersion
      coinsInCirculation
      networkHashRate
      networkHost
      networkId
      totalDifficulty
      transactionCount
    }
  }
`;
