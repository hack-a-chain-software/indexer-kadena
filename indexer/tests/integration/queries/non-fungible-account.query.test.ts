import { GraphQLClient } from 'graphql-request';
import { nonFungibleAccountFixture001 } from '../fixtures/non-fungible-account/non-fungible-account.fixture.001';
import { nonFungibleAccountFixture002 } from '../fixtures/non-fungible-account/non-fungible-account.fixture.002';
import { getNonFungibleAccountQuery } from '../builders/non-fungible-account.builder';

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

describe('Non Fungible Account', () => {
  it('#001 - Marmalade V1', async () => {
    const query = getNonFungibleAccountQuery({
      accountName: 'k:0238f1b76b74a32ba6ce84dc1069ce18fcc24ec1fc9f3a5492ca7b25e16f3d47',
    });

    const data = await client.request(query);
    expect(nonFungibleAccountFixture001.data).toMatchObject(data);
  });

  it('#002 - Marmalade V2', async () => {
    const query = getNonFungibleAccountQuery({
      accountName: 'k:7b80749bd0c0f8dc793ffe6a0a4c75f8c74ef25008c45ca02bcc154ef00c7c31',
    });

    const data = await client.request(query);
    expect(nonFungibleAccountFixture002.data).toMatchObject(data);
  });
});
