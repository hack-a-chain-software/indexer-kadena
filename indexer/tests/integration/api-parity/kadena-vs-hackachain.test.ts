import { GraphQLClient } from 'graphql-request';
import { transfersQueryGql } from './transfers.builder';
import { blockQueryGql } from './block.builder';
import { transactionByRequestKeyQueryGql } from './transaction-by-request-key';
import { eventsQueryGql } from './events.builder';
import { transactionsQueryGql } from './transactions.builder';
import { lastBlockHeightQueryGql } from './last-block-height.builder';
import { fungibleAccountQueryGql } from './fungible-account.builder';
import { nonFungibleAccountQueryGql } from './non-fungible-account.builder';

const hackachainClient = new GraphQLClient('http://localhost:3001/graphql');
const kadenaClient = new GraphQLClient('https://graph.kadena.network/graphql');

describe('Transactions', () => {
  it('#001 - block', async () => {
    const hackachainData = await hackachainClient.request(blockQueryGql);
    const kadenaData = await kadenaClient.request(blockQueryGql);

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#002 - transactions', async () => {
    const hackachainData = await hackachainClient.request(transactionsQueryGql);
    hackachainData.transactions.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

    const kadenaData = await kadenaClient.request(transactionsQueryGql);
    kadenaData.transactions.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#003 - transfers', async () => {
    const hackachainData = await hackachainClient.request(transfersQueryGql);
    hackachainData.transfers.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

    const kadenaData = await kadenaClient.request(transfersQueryGql);
    kadenaData.transfers.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

    const kadenaData2 = {
      transfers: {
        edges: hackachainData.transfers.edges.map((edge: any) => ({
          node: {
            ...edge.node,
            amount: edge.node.amount.toString(),
          },
        })),
      },
    };

    expect(hackachainData).toMatchObject(kadenaData2);
  });

  it('#004 - transaction', async () => {
    const hackachainData = await hackachainClient.request(transactionByRequestKeyQueryGql);
    const kadenaData = await kadenaClient.request(transactionByRequestKeyQueryGql);
    expect(hackachainData).toMatchObject(kadenaData);
  });

  it('#005 - events', async () => {
    const hackachainData = await hackachainClient.request(eventsQueryGql);
    hackachainData.events.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

    const kadenaData = await kadenaClient.request(eventsQueryGql);
    kadenaData.events.edges.sort((a: any, b: any) => a.node.id.localeCompare(b.node.id));

    expect(hackachainData).toMatchObject(kadenaData);
  });

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
