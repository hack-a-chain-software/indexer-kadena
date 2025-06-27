import { GraphQLClient } from 'graphql-request';
import { fungibleChainAccountFixture001 } from '../fixtures/fungible-chain-account/fungible-chain-account.fixture.001';
import { getFungibleChainAccountQuery } from '../builders/fungible-chain-account.builder';

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

describe('Fungible Chain Account', () => {
  it('#001', async () => {
    const query = getFungibleChainAccountQuery({
      accountName: '20d27f46670fba5aba26a6291a350fc72b46729af1d9776661479c4860c215da',
      chainId: '0',
      fungibleName: 'coin',
    });

    const data = await client.request(query);

    const fixtureAccount = fungibleChainAccountFixture001.data.fungibleChainAccount;

    // Compare basic properties
    expect(data.fungibleChainAccount.accountName).toBe(fixtureAccount.accountName);
    expect(data.fungibleChainAccount.chainId).toBe(fixtureAccount.chainId);
    expect(data.fungibleChainAccount.fungibleName).toBe(fixtureAccount.fungibleName);
    expect(data.fungibleChainAccount.id).toBe(fixtureAccount.id);

    // Compare guard
    expect(data.fungibleChainAccount.guard.raw).toBe(fixtureAccount.guard.raw);

    // Compare transactions in chain account
    expect(data.fungibleChainAccount.transactions.edges).toHaveLength(
      fixtureAccount.transactions.edges.length,
    );
    data.fungibleChainAccount.transactions.edges.forEach((edge: any, txIndex: number) => {
      expect(edge.node.id).toBe(fixtureAccount.transactions.edges[txIndex].node.id);
    });

    // Compare transfers in chain account
    expect(data.fungibleChainAccount.transfers.edges).toHaveLength(
      fixtureAccount.transfers.edges.length,
    );
    data.fungibleChainAccount.transfers.edges.forEach((edge: any, txIndex: number) => {
      expect(edge.node.id).toBe(fixtureAccount.transfers.edges[txIndex].node.id);
    });
  });
});
