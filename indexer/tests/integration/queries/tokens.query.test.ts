import { GraphQLClient } from 'graphql-request';
import { getTokensQuery } from '../builders/tokens.builder';
import { tokensFixture001 } from '../fixtures/tokens/tokens.fixture.001';
import { tokensFixture002 } from '../fixtures/tokens/tokens.fixture.002';

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

describe('Tokens', () => {
  it('#001', async () => {
    const query = getTokensQuery({
      first: 10,
      after: 'MzIxMTA1MjY=',
    });

    const data = await client.request(query);
    expect(tokensFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getTokensQuery({
      last: 10,
    });

    const data = await client.request(query);
    expect(tokensFixture002.data).toMatchObject(data);
  });
});
