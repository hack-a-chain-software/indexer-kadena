import { GraphQLClient } from 'graphql-request';
import { getNodesQuery } from '../builders/nodes.builder';
import { nodesFixture001 } from '../fixtures/nodes/nodes.fixture.001';

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

describe('Nodes', () => {
  it('#001 - Block and Transfer', async () => {
    const query = getNodesQuery({
      ids: [
        'QmxvY2s6T0txV3psalZXZll6SkdVaEtIMlBBUUo1M2VIMjRNdUd0TC13Sl82bGxWbw==',
        'VHJhbnNmZXI6WyJzNUp3ckxJeUVkQ00tdUJRTFN6RGxJeG9RSld4RkV3UDVOcHN4ekdESEVzIiwiMCIsIjQiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwiT1ZzRFJzQkN0MzZkME1fWjA1ZG5fQ2UxcGVDUUYwY3JnOTloYkI5X1FYVSJd',
      ],
    });

    const data = await client.request(query);
    expect(nodesFixture001.data).toMatchObject(data);
  });
});
