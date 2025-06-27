import { GraphQLClient } from 'graphql-request';
import { getFungibleAccountQuery } from '../builders/fungible-account.builder';
import { fungibleAccountFixture001 } from '../fixtures/fungible-account/fungible-account.fixture.001';

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

describe('Fungible Account', () => {
  it('#001', async () => {
    const query = getFungibleAccountQuery({
      accountName: '20d27f46670fba5aba26a6291a350fc72b46729af1d9776661479c4860c215da',
      fungibleName: 'coin',
    });

    const data = await client.request(query);
    console.log(JSON.stringify(data, null, 2));

    // Compare static properties of fungibleAccount
    expect(data.fungibleAccount.accountName).toBe(
      fungibleAccountFixture001.data.fungibleAccount.accountName,
    );
    expect(data.fungibleAccount.fungibleName).toBe(
      fungibleAccountFixture001.data.fungibleAccount.fungibleName,
    );
    expect(data.fungibleAccount.id).toBe(fungibleAccountFixture001.data.fungibleAccount.id);

    // Compare transactions
    expect(data.fungibleAccount.transactions.edges).toHaveLength(
      fungibleAccountFixture001.data.fungibleAccount.transactions.edges.length,
    );
    data.fungibleAccount.transactions.edges.forEach((edge: any, index: number) => {
      expect(edge.node.id).toBe(
        fungibleAccountFixture001.data.fungibleAccount.transactions.edges[index].node.id,
      );
    });

    // Compare transfers
    expect(data.fungibleAccount.transfers.edges).toHaveLength(
      fungibleAccountFixture001.data.fungibleAccount.transfers.edges.length,
    );
    data.fungibleAccount.transfers.edges.forEach((edge: any, index: number) => {
      expect(edge.node.id).toBe(
        fungibleAccountFixture001.data.fungibleAccount.transfers.edges[index].node.id,
      );
    });

    // Compare chainAccounts (excluding balance)
    expect(data.fungibleAccount.chainAccounts).toHaveLength(
      fungibleAccountFixture001.data.fungibleAccount.chainAccounts.length,
    );
    data.fungibleAccount.chainAccounts.forEach((account: any, index: number) => {
      const fixtureAccount = fungibleAccountFixture001.data.fungibleAccount.chainAccounts[index];

      // Compare basic properties
      expect(account.accountName).toBe(fixtureAccount.accountName);
      expect(account.chainId).toBe(fixtureAccount.chainId);
      expect(account.fungibleName).toBe(fixtureAccount.fungibleName);
      expect(account.id).toBe(fixtureAccount.id);

      // Compare guard
      expect(account.guard.raw).toBe(fixtureAccount.guard.raw);

      // Compare transactions in chain account
      expect(account.transactions.edges).toHaveLength(fixtureAccount.transactions.edges.length);
      account.transactions.edges.forEach((edge: any, txIndex: number) => {
        expect(edge.node.id).toBe(fixtureAccount.transactions.edges[txIndex].node.id);
      });

      // Compare transfers in chain account
      expect(account.transfers.edges).toHaveLength(fixtureAccount.transfers.edges.length);
      account.transfers.edges.forEach((edge: any, txIndex: number) => {
        expect(edge.node.id).toBe(fixtureAccount.transfers.edges[txIndex].node.id);
      });
    });

    // Validate balances
    const sumOfChainBalances = data.fungibleAccount.chainAccounts.reduce(
      (sum: number, account: any) => sum + account.balance,
      0,
    );
    expect(sumOfChainBalances).toBe(data.fungibleAccount.totalBalance);
  });
});
