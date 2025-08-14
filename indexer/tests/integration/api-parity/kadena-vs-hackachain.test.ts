import { GraphQLClient } from 'graphql-request';
import { transfersQueryGql } from './transfers.builder';
import { blockQueryGql } from './block.builder';
import { transactionByRequestKeyQueryGql } from './transaction-by-request-key';
import { eventsQueryGql } from './events.builder';
import { transactionsQueryGql } from './transactions.builder';
import { lastBlockHeightQueryGql } from './last-block-height.builder';
import { fungibleAccountQueryGql } from './fungible-account.builder';
import { nonFungibleAccountQueryGql } from './non-fungible-account.builder';
import { generateHashes } from './hash-generator';
import { logoutError } from './test-error-logger';

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
});
