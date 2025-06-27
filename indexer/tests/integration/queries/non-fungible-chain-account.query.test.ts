import { GraphQLClient } from 'graphql-request';
import { nonFungibleChainAccountFixture001 } from '../fixtures/non-fungible-chain-account/non-fungible-chain-account.fixture.001';
import { nonFungibleChainAccountFixture002 } from '../fixtures/non-fungible-chain-account/non-fungible-chain-account.fixture.002';
import { getNonFungibleChainAccountQuery } from '../builders/non-fungible-chain-account.builder';

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

describe('Non Fungible Chain Account', () => {
  it('#001 - Marmalade V1', async () => {
    const query = getNonFungibleChainAccountQuery({
      accountName: 'k:0c6c396e78f086d1e423b2e0d12a40905b71896a397a02894645f0e04d3cda86',
      chainId: '8',
    });

    const data = await client.request(query);
    expect(nonFungibleChainAccountFixture001.data).toMatchObject(data);
  });

  it('#002 - Marmalade V2', async () => {
    const query = getNonFungibleChainAccountQuery({
      accountName: 'k:bf9ed5aebee6fcc0e308c224f095f6980ab3e7a250962f6f8d35e2cd10bb0322',
      chainId: '8',
    });

    const data = await client.request(query);
    expect(nonFungibleChainAccountFixture002.data).toMatchObject(data);
  });
});
