import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Docker test', () => {
  it('Check if the indexer is running properly', async () => {
    const query = gql`
      query {
        lastBlockHeight
      }
    `;

    const firstData = await client.request(query);
    expect(firstData.lastBlockHeight).toBeDefined();

    // Wait for 15 seconds to ensure the indexer has processed at least a new block
    await new Promise(resolve => setTimeout(resolve, 15000));

    const secondData = await client.request(query);
    expect(secondData.lastBlockHeight).toBeDefined();

    expect(secondData.lastBlockHeight).toBeGreaterThan(firstData.lastBlockHeight);
  }, 20000);
});
