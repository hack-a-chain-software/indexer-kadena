import { GraphQLClient } from 'graphql-request';
import { getFungibleAccountsByPublicKeyQuery } from '../builders/fungible-accounts-by-public-key.builder';
import { fungibleAccountsByPublicKeyFixture001 } from '../fixtures/fungible-accounts-by-public-key/fungible-accounts-by-public-key.fixture.001';

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

describe('Fungible Accounts By Public Key', () => {
  it('#001', async () => {
    const query = getFungibleAccountsByPublicKeyQuery({
      publicKey: '20d27f46670fba5aba26a6291a350fc72b46729af1d9776661479c4860c215da',
    });

    const data = await client.request(query);

    // Compare static properties of fungibleAccounts
    expect(data.fungibleAccountsByPublicKey).toHaveLength(
      fungibleAccountsByPublicKeyFixture001.data.fungibleAccountsByPublicKey.length,
    );

    data.fungibleAccountsByPublicKey.forEach((account: any, index: number) => {
      const fixtureAccount =
        fungibleAccountsByPublicKeyFixture001.data.fungibleAccountsByPublicKey[index];

      // Compare basic properties
      expect(account.accountName).toBe(fixtureAccount.accountName);
      expect(account.fungibleName).toBe(fixtureAccount.fungibleName);
      expect(account.id).toBe(fixtureAccount.id);

      // Compare transactions
      expect(account.transactions.edges).toHaveLength(fixtureAccount.transactions.edges.length);
      account.transactions.edges.forEach((edge: any, txIndex: number) => {
        expect(edge.node.id).toBe(fixtureAccount.transactions.edges[txIndex].node.id);
      });

      // Compare transfers
      expect(account.transfers.edges).toHaveLength(fixtureAccount.transfers.edges.length);
      account.transfers.edges.forEach((edge: any, txIndex: number) => {
        expect(edge.node.id).toBe(fixtureAccount.transfers.edges[txIndex].node.id);
      });

      // Compare chainAccounts (excluding balance)
      expect(account.chainAccounts).toHaveLength(fixtureAccount.chainAccounts.length);
      account.chainAccounts.forEach((chainAccount: any, chainIndex: number) => {
        const fixtureChainAccount = fixtureAccount.chainAccounts[chainIndex];

        // Compare basic properties
        expect(chainAccount.accountName).toBe(fixtureChainAccount.accountName);
        expect(chainAccount.chainId).toBe(fixtureChainAccount.chainId);
        expect(chainAccount.fungibleName).toBe(fixtureChainAccount.fungibleName);
        expect(chainAccount.id).toBe(fixtureChainAccount.id);

        // Compare guard
        expect(chainAccount.guard.raw).toBe(fixtureChainAccount.guard.raw);

        // Compare transactions in chain account
        expect(chainAccount.transactions.edges).toHaveLength(
          fixtureChainAccount.transactions.edges.length,
        );
        chainAccount.transactions.edges.forEach((edge: any, txIndex: number) => {
          expect(edge.node.id).toBe(fixtureChainAccount.transactions.edges[txIndex].node.id);
        });

        // Compare transfers in chain account
        expect(chainAccount.transfers.edges).toHaveLength(
          fixtureChainAccount.transfers.edges.length,
        );
        chainAccount.transfers.edges.forEach((edge: any, txIndex: number) => {
          expect(edge.node.id).toBe(fixtureChainAccount.transfers.edges[txIndex].node.id);
        });
      });

      // Validate balances
      const sumOfChainBalances = account.chainAccounts.reduce(
        (sum: number, chainAccount: any) => sum + chainAccount.balance,
        0,
      );
      expect(sumOfChainBalances).toBe(account.totalBalance);
    });
  });
});
