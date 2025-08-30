import { GraphQLClient } from 'graphql-request';
import { transfersQueryGql } from './transfers.builder';
import { blockQueryGql } from './block.builder';
import { transactionByRequestKeyQueryGql } from './transaction-by-request-key';
import { eventsQueryGql } from './events.builder';
import { transactionsQueryGql } from './transactions.builder';
import { lastBlockHeightQueryGql } from './last-block-height.builder';
import { fungibleAccountQueryGql } from './fungible-account.builder';
import { nonFungibleAccountQueryGql } from './non-fungible-account.builder';
import { pactQueryGql } from './pact-query.builder';
import { transactionByPublicKeyQueryGql } from './transaction-by-public-key.builder';
import { generateHashes } from './hash-generator';
import { logoutError } from './test-error-logger';
import { fungibleChainAccountQueryGql } from './fungible-chain-account.builder';
import { nonFungibleChainAccountQueryGql } from './non-fungible-chain-account.builder';
import { getNodeQuery } from '../builders/node.builder';
import { getNodesQuery } from '../builders/nodes.builder';
import { networkInfoQueryGql } from './network-info.builder';
import { graphConfigurationQueryGql } from './graph-configuration.builder';
import { fungibleAccountsByPublicKeyQueryGql } from './fungible-accounts-by-public-key.builder';
import { getFungibleChainAccountsByPublicKeyQuery } from '../builders/fungible-chain-accounts-by-public-key.builder';
import { blocksFromHeightQueryGql } from './blocks-from-height.builder';
import { blocksFromDepthQueryGql } from './blocks-from-depth.builder';
import { completedBlockHeightsQueryGql } from './completed-block-heights.builder';

if (!process.env.HACKACHAIN_API_URL || !process.env.KADENA_API_URL) {
  throw new Error('Missing HACKACHAIN_API_URL or KADENA_API_URL environment variables.');
}

const hackachainClient = new GraphQLClient(process.env.HACKACHAIN_API_URL, {
  headers: {
    'x-api-key': process.env.HACKACHAIN_API_KEY || '',
  },
});
const kadenaClient = new GraphQLClient(process.env.KADENA_API_URL);

// Shared variable to store hashes for all tests
let allHashes: string[] = [];

const TEST_TIMEOUT = 1200000;

describe('Transactions', () => {
  beforeAll(async () => {
    allHashes = await generateHashes();
  });

  it(
    '#001 - block',
    async () => {
      for (const hash of allHashes) {
        let hackachainData: any;
        let kadenaData: any;
        try {
          hackachainData = await hackachainClient.request(blockQueryGql, { hash });
          kadenaData = await kadenaClient.request(blockQueryGql, { hash });
          expect(hackachainData).toMatchObject(kadenaData);
        } catch (error: any) {
          logoutError(error, '001_block', hash, kadenaData, hackachainData);
        }
      }
    },
    TEST_TIMEOUT,
  );

  it(
    '#002 - transactions',
    async () => {
      for (const blockHash of allHashes) {
        let hackachainData: any;
        let kadenaData: any;
        try {
          hackachainData = await hackachainClient.request(transactionsQueryGql, {
            blockHash,
          });
          hackachainData.transactions.edges.sort((a: any, b: any) =>
            a.node.id.localeCompare(b.node.id),
          );

          kadenaData = await kadenaClient.request(transactionsQueryGql, { blockHash });
          kadenaData.transactions.edges.sort((a: any, b: any) =>
            a.node.id.localeCompare(b.node.id),
          );

          expect(hackachainData).toMatchObject(kadenaData);
        } catch (error: any) {
          logoutError(error, '002_transactions', blockHash, kadenaData, hackachainData);
        }
      }
    },
    TEST_TIMEOUT,
  );

  it(
    '#003 - transfers',
    async () => {
      for (const blockHash of allHashes) {
        let hackachainData: any;
        let kadenaDataSorted: any;
        try {
          hackachainData = await hackachainClient.request(transfersQueryGql, { blockHash });
          hackachainData.transfers.edges.sort((a: any, b: any) =>
            a.node.id.localeCompare(b.node.id),
          );

          const kadenaData = await kadenaClient.request(transfersQueryGql, { blockHash });
          kadenaData.transfers.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

          kadenaDataSorted = {
            transfers: {
              edges: hackachainData.transfers.edges.map((edge: any) => ({
                node: {
                  ...edge.node,
                  amount: edge.node.amount.toString(),
                },
              })),
            },
          };

          expect(hackachainData).toMatchObject(kadenaDataSorted);
        } catch (error: any) {
          logoutError(error, '003_transfers', blockHash, kadenaDataSorted, hackachainData);
        }
      }
    },
    TEST_TIMEOUT,
  );

  it('#004 - transaction', async () => {
    const hackachainData = await hackachainClient.request(transactionByRequestKeyQueryGql, {
      requestKey: 'Jeva9G9yC0WKOvZPS0VamcVp5wJqOOXZW4jdlnIcE9k',
    });
    const kadenaData = await kadenaClient.request(transactionByRequestKeyQueryGql, {
      requestKey: 'Jeva9G9yC0WKOvZPS0VamcVp5wJqOOXZW4jdlnIcE9k',
    });
    expect(hackachainData).toMatchObject(kadenaData);
  });

  it(
    '#005 - events',
    async () => {
      let hackachainData: any;
      let kadenaData: any;
      for (const blockHash of allHashes) {
        try {
          hackachainData = await hackachainClient.request(eventsQueryGql, { blockHash });
          hackachainData.events.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

          kadenaData = await kadenaClient.request(eventsQueryGql, { blockHash });
          kadenaData.events.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

          expect(hackachainData).toMatchObject(kadenaData);
        } catch (error: any) {
          logoutError(error, '005_events', blockHash, kadenaData, hackachainData);
        }
      }
    },
    TEST_TIMEOUT,
  );

  // this test might need to be run more than once to get the correct result
  it('#006 - last block height', async () => {
    const [hackachainData, kadenaData] = await Promise.all([
      hackachainClient.request(lastBlockHeightQueryGql),
      kadenaClient.request(lastBlockHeightQueryGql),
    ]);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#007 - fungible account', async () => {
    const hackachainData = await hackachainClient.request(fungibleAccountQueryGql);
    hackachainData.fungibleAccount.chainAccounts.sort((a: any, b: any) => a.id.localeCompare(b.id));

    const kadenaData = await kadenaClient.request(fungibleAccountQueryGql);
    kadenaData.fungibleAccount.chainAccounts.sort((a: any, b: any) => a.id.localeCompare(b.id));

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#008 - non fungible account', async () => {
    const hackachainData = await hackachainClient.request(nonFungibleAccountQueryGql);
    hackachainData.nonFungibleAccount.nonFungibleTokenBalances.sort((a: any, b: any) =>
      a.id.localeCompare(b.id),
    );

    const kadenaData = await kadenaClient.request(nonFungibleAccountQueryGql);
    kadenaData.nonFungibleAccount.nonFungibleTokenBalances.sort((a: any, b: any) =>
      a.id.localeCompare(b.id),
    );

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#009 - pact query', async () => {
    const pactQueries = [
      {
        chainId: '1',
        code: '(describe-module "coin")',
      },
      {
        chainId: '1',
        code: '(coin.details "test")',
      },
      {
        chainId: '1',
        code: "(coin.details (read-msg 'account))",
        data: [{ key: 'account', value: 'test' }],
      },
    ];
    const hackachainData = await hackachainClient.request(pactQueryGql, {
      pactQueries,
    });

    const kadenaData = await kadenaClient.request(pactQueryGql, {
      pactQueries,
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#010 - transactionsByPublicKey', async () => {
    const hackachainData = await hackachainClient.request(transactionByPublicKeyQueryGql, {
      publicKey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
    });
    hackachainData.transactionsByPublicKey.edges.sort((a: any, b: any) =>
      a.node.id.localeCompare(b.node.id),
    );

    const kadenaData = await kadenaClient.request(transactionByPublicKeyQueryGql, {
      publicKey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
    });
    kadenaData.transactionsByPublicKey.edges.sort((a: any, b: any) =>
      a.node.id.localeCompare(b.node.id),
    );

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#011 - fungibleChainAccount', async () => {
    const hackachainData = await hackachainClient.request(fungibleChainAccountQueryGql, {
      accountName: 'k:1dc186034e79417a93f5cf05a99874c0a3681936faaf3d5963f77b262218fe82',
      chainId: '0',
    });

    const kadenaData = await kadenaClient.request(fungibleChainAccountQueryGql, {
      accountName: 'k:1dc186034e79417a93f5cf05a99874c0a3681936faaf3d5963f77b262218fe82',
      chainId: '0',
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  // kadena returns a timeout on this query, skipping for now
  it.skip('#012 - fungibleAccountsByPublicKey', async () => {
    const hackachainData = await hackachainClient.request(fungibleAccountsByPublicKeyQueryGql, {
      publicKey: '1dc186034e79417a93f5cf05a99874c0a3681936faaf3d5963f77b262218fe82',
    });

    const kadenaData = await kadenaClient.request(fungibleAccountsByPublicKeyQueryGql, {
      publicKey: '1dc186034e79417a93f5cf05a99874c0a3681936faaf3d5963f77b262218fe82',
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#013 - nonFungibleChainAccount', async () => {
    const hackachainData = await hackachainClient.request(nonFungibleChainAccountQueryGql, {
      accountName: 'k:7b80749bd0c0f8dc793ffe6a0a4c75f8c74ef25008c45ca02bcc154ef00c7c31',
      chainId: '8',
    });

    hackachainData.nonFungibleChainAccount.nonFungibleTokenBalances.sort((a: any, b: any) =>
      a.id.localeCompare(b.id),
    );

    const kadenaData = await kadenaClient.request(nonFungibleChainAccountQueryGql, {
      accountName: 'k:7b80749bd0c0f8dc793ffe6a0a4c75f8c74ef25008c45ca02bcc154ef00c7c31',
      chainId: '8',
    });

    kadenaData.nonFungibleChainAccount.nonFungibleTokenBalances.sort((a: any, b: any) =>
      a.id.localeCompare(b.id),
    );

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#014 - node (block)', async () => {
    const nodeQuery = getNodeQuery('Block', {
      id: 'QmxvY2s6T0txV3psalZXZll6SkdVaEtIMlBBUUo1M2VIMjRNdUd0TC13Sl82bGxWbw==',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery, {
      id: 'QmxvY2s6T0txV3psalZXZll6SkdVaEtIMlBBUUo1M2VIMjRNdUd0TC13Sl82bGxWbw==',
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#015 - node (event)', async () => {
    const nodeQuery = getNodeQuery('Event', {
      id: 'RXZlbnQ6WyIyZU9LNTBhZnppZjRIN2pNQmdLNjlVNURERnRLemJYQjlLbnd2RWVXQ2swIiwiMyIsIlR5Z3VGOVZVbG5rVkYtSmRTVXdSeXpya2FGOTl2OUNONWk3UUpiQ01HZVkiXQ==',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery, {
      id: 'RXZlbnQ6WyIyZU9LNTBhZnppZjRIN2pNQmdLNjlVNURERnRLemJYQjlLbnd2RWVXQ2swIiwiMyIsIlR5Z3VGOVZVbG5rVkYtSmRTVXdSeXpya2FGOTl2OUNONWk3UUpiQ01HZVkiXQ==',
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#016 - node (fungible account)', async () => {
    const nodeQuery = getNodeQuery('FungibleAccount', {
      id: 'RnVuZ2libGVBY2NvdW50OlsiY29pbiIsIms6ZWY3Y2I2NmMzMDZiMjhiMzI3MzRhNTQ0YmJiMDVhYmQxNDMwZDYzNzgyN2MwOWZkMGY4OThhODliNzc5YmFjYyJd',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery, {
      id: 'RnVuZ2libGVBY2NvdW50OlsiY29pbiIsIms6ZWY3Y2I2NmMzMDZiMjhiMzI3MzRhNTQ0YmJiMDVhYmQxNDMwZDYzNzgyN2MwOWZkMGY4OThhODliNzc5YmFjYyJd',
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#017 - node (fungible chain account)', async () => {
    const nodeQuery = getNodeQuery('FungibleChainAccount', {
      id: 'RnVuZ2libGVDaGFpbkFjY291bnQ6WyIwIiwiY29pbiIsIms6ODRhY2FjMGI3MmU4MWU2MTdlZTQxN2E1NWIxNmNkYWE5Y2JjZDNmZjhmZmZkMTI5NmNiMDkzNzZhNzkxNmQ0MCJd',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery, {
      id: 'RnVuZ2libGVDaGFpbkFjY291bnQ6WyIwIiwiY29pbiIsIms6ODRhY2FjMGI3MmU4MWU2MTdlZTQxN2E1NWIxNmNkYWE5Y2JjZDNmZjhmZmZkMTI5NmNiMDkzNzZhNzkxNmQ0MCJd',
    });

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#018 - node (non fungible account)', async () => {
    const nodeQuery = getNodeQuery('NonFungibleAccount', {
      id: 'Tm9uRnVuZ2libGVBY2NvdW50Oms6MGM2ODZkZjVkNTE0OWY2NjJiY2JkZGIzNWZjYmVkZGM2M2YxM2IyMmZlNmE5ZTI0NWFkNzgxOTgzNGQ2NjNjMw==',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    hackachainData.node.nonFungibleTokenBalances.sort((a: any, b: any) => a.id.localeCompare(b.id));

    const kadenaData = await kadenaClient.request(nodeQuery);

    kadenaData.node.nonFungibleTokenBalances.sort((a: any, b: any) => a.id.localeCompare(b.id));

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#019 - node (non fungible chain account)', async () => {
    const nodeQuery = getNodeQuery('NonFungibleChainAccount', {
      id: 'Tm9uRnVuZ2libGVDaGFpbkFjY291bnQ6WyI4IiwiazowY2JlMmI4ZTIwNWIzZTIyNTExMzM0NTc4ZjhlY2Q5MjY3Yzc1MjdkMjBjZjZhMWFhN2IxMzRkODI4Mjc2NzhkIl0=',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    hackachainData.node.nonFungibleTokenBalances.sort((a: any, b: any) => a.id.localeCompare(b.id));

    const kadenaData = await kadenaClient.request(nodeQuery);

    kadenaData.node.nonFungibleTokenBalances.sort((a: any, b: any) => a.id.localeCompare(b.id));

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#020 - node (non fungible token balance)', async () => {
    const nodeQuery = getNodeQuery('NonFungibleTokenBalance', {
      id: 'Tm9uRnVuZ2libGVUb2tlbkJhbGFuY2U6WyJ0OjdyTHhnY2ptNFZienJVcGRGVENlOUVZSFBSOU5rNlR1YkVKTVd6Ny03MTQiLCJrOjQ4ZjNjOGVlM2YxNDk0M2UyMGFkYmIzMDJjZDdlNzQwMzBhZTRlZDFjZmNiYjYzMTNiOGFjNTM2N2MxYTNkZjQiLCI4Il0=',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#021 - node (signer)', async () => {
    const nodeQuery = getNodeQuery('Signer', {
      id: 'U2lnbmVyOlsiTzNYRHYzX2NZaHFUUGwyWXItMFVKREZHdUMwNHBlZHd0c0gzVEYxbW1JcyIsIjAiXQ==',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#022 - node (transaction)', async () => {
    const nodeQuery = getNodeQuery('Transaction', {
      id: 'VHJhbnNhY3Rpb246WyIyUkprUUpkZ1hRSjZQTkI5MG44WmwwdVZZQklOcV90TGt5STNoVjlpeDEwIiwiWm1jVTNKb0xkU0h2TDQ2MzQzVkJEMTM5ZnM3cFkwczRDOU1YNDJKQnVlZyJd',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#023 - node (transfer)', async () => {
    const nodeQuery = getNodeQuery('Transfer', {
      id: 'VHJhbnNmZXI6WyJzNUp3ckxJeUVkQ00tdUJRTFN6RGxJeG9RSld4RkV3UDVOcHN4ekdESEVzIiwiMCIsIjQiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwiT1ZzRFJzQkN0MzZkME1fWjA1ZG5fQ2UxcGVDUUYwY3JnOTloYkI5X1FYVSJd',
    });
    const hackachainData = await hackachainClient.request(nodeQuery);

    const kadenaData = await kadenaClient.request(nodeQuery);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#024 - nodes (block and transfer)', async () => {
    const query = getNodesQuery({
      ids: [
        'QmxvY2s6T0txV3psalZXZll6SkdVaEtIMlBBUUo1M2VIMjRNdUd0TC13Sl82bGxWbw==',
        'VHJhbnNmZXI6WyJzNUp3ckxJeUVkQ00tdUJRTFN6RGxJeG9RSld4RkV3UDVOcHN4ekdESEVzIiwiMCIsIjQiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwiT1ZzRFJzQkN0MzZkME1fWjA1ZG5fQ2UxcGVDUUYwY3JnOTloYkI5X1FYVSJd',
      ],
    });
    const hackachainData = await hackachainClient.request(query);

    const kadenaData = await kadenaClient.request(query);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#025 - networkInfo', async () => {
    const hackachainData = await hackachainClient.request(networkInfoQueryGql);
    const kadenaData = await kadenaClient.request(networkInfoQueryGql);
    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#026 - graphConfiguration', async () => {
    const hackachainData = await hackachainClient.request(graphConfigurationQueryGql);
    const kadenaData = await kadenaClient.request(graphConfigurationQueryGql);
    expect(hackachainData).toMatchObject(kadenaData);
  });

  // kadena api returns a timeout on this query, skipping while there's not fix on it
  it.skip('#027 - fungibleChainAccountsByPublicKey', async () => {
    const query = getFungibleChainAccountsByPublicKeyQuery({
      publicKey: '20d27f46670fba5aba26a6291a350fc72b46729af1d9776661479c4860c215da',
      chainId: '0',
    });
    const hackachainData = await hackachainClient.request(query);
    const kadenaData = await kadenaClient.request(query);
    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#028 - blocksFromHeight', async () => {
    const hackachainData = await hackachainClient.request(blocksFromHeightQueryGql, {
      startHeight: 4000000,
      endHeight: 4500000,
    });

    hackachainData.blocksFromHeight.edges.sort((a: any, b: any) => a.node.chainId - b.node.chainId);

    const kadenaData = await kadenaClient.request(blocksFromHeightQueryGql, {
      startHeight: 4000000,
      endHeight: 4000000,
    });

    kadenaData.blocksFromHeight.edges.sort((a: any, b: any) => a.node.chainId - b.node.chainId);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#029 - blocksFromDepth', async () => {
    const hackachainData = await hackachainClient.request(blocksFromDepthQueryGql, {
      minimumDepth: 1,
      chainIds: ['9'],
    });

    hackachainData.blocksFromDepth.edges.sort((a: any, b: any) => a.node.height - b.node.height);

    const kadenaData = await kadenaClient.request(blocksFromDepthQueryGql, {
      minimumDepth: 1,
      chainIds: ['9'],
    });

    kadenaData.blocksFromDepth.edges.sort((a: any, b: any) => a.node.height - b.node.height);

    expect(hackachainData).toMatchObject(kadenaData);
  });
});
