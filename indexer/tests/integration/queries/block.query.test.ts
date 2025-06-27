import { GraphQLClient } from 'graphql-request';
import { getBlockQuery } from '../builders/block.builder';
import { blockFixture001 } from '../fixtures/block/block.fixture.001';

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

describe('Block', () => {
  it('#001', async () => {
    const query = getBlockQuery({
      hash: 'b6prmp3VFHxMvrdwVZ_DKb8eo5moPJv3SwNA0GLp8I0',
    });

    const data = await client.request(query);
    expect(blockFixture001.data).toMatchObject(data);
  });
});
