import { GraphQLClient } from 'graphql-request';
import { getGraphConfigurationQuery } from '../builders/graph-configuration.builder';
import { graphConfigurationFixture001 } from '../fixtures/graph-configuration/graph-configuration.fixture.001';

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

describe('Graph Configuration', () => {
  it('#001', async () => {
    const query = getGraphConfigurationQuery();
    const data = await client.request(query);

    expect(graphConfigurationFixture001.data).toMatchObject(data);
  });
});
