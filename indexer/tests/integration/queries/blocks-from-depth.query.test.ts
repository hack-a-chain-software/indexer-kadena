import { GraphQLClient } from 'graphql-request';
import { getBlocksFromDepthQuery } from '../builders/blocks-from-depth.builder';
import { blocksFromDepthFixture001 } from '../fixtures/blocks-from-depth/blocks-from-depth.fixture.001';
import { blocksFromDepthFixture002 } from '../fixtures/blocks-from-depth/blocks-from-depth.fixture.002';

const apiKey = process.env.VPS_API_KEY;
const vpsApiUrl = process.env.API_URL;

const apiUrl = vpsApiUrl && apiKey ? vpsApiUrl : 'http://localhost:3001/graphql';

const headers: Record<string, string> = {};

// Now, this condition is simpler. We know if an apiKey exists,
// we must be targeting the apiUrl.
if (apiKey) {
  headers['X-API-Key'] = apiKey;
}

const client = new GraphQLClient(apiUrl, {
  headers,
});

describe('Blocks from depth', () => {
  it('#001', async () => {
    const query = getBlocksFromDepthQuery({ minimumDepth: 3, after: 'NTc4NTg5MDoxOQ==' });
    const data = await client.request(query);
    expect(blocksFromDepthFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getBlocksFromDepthQuery({
      minimumDepth: 5,
      chainIds: ['12', '13'],
      after: 'NTc4NTcxNDoxMg==',
    });
    const data = await client.request(query);
    expect(blocksFromDepthFixture002.data).toMatchObject(data);
  });
});
