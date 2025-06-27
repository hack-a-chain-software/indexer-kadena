import { GraphQLClient } from 'graphql-request';
import { fungibleChainAccountsByPublicKeyFixture001 } from '../fixtures/fungible-chain-accounts-by-public-key/fungible-chain-accounts-by-public-key.fixture.001';
import { getFungibleChainAccountsByPublicKeyQuery } from '../builders/fungible-chain-accounts-by-public-key.builder';

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

describe('Fungible Chain Accounts By Public Key', () => {
  it('#001', async () => {
    const query = getFungibleChainAccountsByPublicKeyQuery({
      publicKey: '20d27f46670fba5aba26a6291a350fc72b46729af1d9776661479c4860c215da',
      chainId: '0',
    });

    const data = await client.request(query);

    // Compare static properties of fungibleChainAccounts
    expect(data.fungibleChainAccountsByPublicKey).toHaveLength(
      fungibleChainAccountsByPublicKeyFixture001.data.fungibleChainAccountsByPublicKey.length,
    );

    data.fungibleChainAccountsByPublicKey.forEach((chainAccount: any, index: number) => {
      const fixtureChainAccount =
        fungibleChainAccountsByPublicKeyFixture001.data.fungibleChainAccountsByPublicKey[index];

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
      expect(chainAccount.transfers.edges).toHaveLength(fixtureChainAccount.transfers.edges.length);
      chainAccount.transfers.edges.forEach((edge: any, txIndex: number) => {
        expect(edge.node.id).toBe(fixtureChainAccount.transfers.edges[txIndex].node.id);
      });
    });
  });
});
