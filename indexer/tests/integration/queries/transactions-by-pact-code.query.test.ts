import { GraphQLClient } from 'graphql-request';
import { getTransactionsByPactCodeQuery } from '../builders/transactions-by-pact-code.builders';

import { transactionsByPactCodeFixture001 } from '../fixtures/transactions-by-pact-code/transactions-by-pact-code.fixture.001';
import { transactionsByPactCodeFixture002 } from '../fixtures/transactions-by-pact-code/transactions-by-pact-code.fixture.002';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('TransactionsByPactCode', () => {
  it('#001 - code', async () => {
    const query = getTransactionsByPactCodeQuery({
      pactCode: 'burn',
      after: 'MTc1NTExMTc5NTozMTM5NDk0MTg=',
      first: 20,
    });
    const data = await client.request(query);
    expect(transactionsByPactCodeFixture001.data).toMatchObject(data);
  });

  it('#002 - exact substring order & pagination', async () => {
    const pactCode = 'coin.transfer';
    const firstQuery = getTransactionsByPactCodeQuery({ pactCode, first: 5 });
    const firstData: any = await client.request(firstQuery);
    expect(transactionsByPactCodeFixture002.data).toMatchObject(firstData);
    const endCursor = firstData.transactionsByPactCode.pageInfo.endCursor;

    const secondQuery = getTransactionsByPactCodeQuery({ pactCode, first: 5, after: endCursor });
    const secondData: any = await client.request(secondQuery);
    expect(transactionsByPactCodeFixture002.data).toMatchObject(secondData);

    // Ensure cursor movement and no overlap in IDs
    const firstIds = new Set(
      firstData.transactionsByPactCode.edges.map((e: any) => e.node.requestKey),
    );
    const secondIds = new Set(
      secondData.transactionsByPactCode.edges.map((e: any) => e.node.requestKey),
    );
    for (const id of secondIds) {
      expect(firstIds.has(id)).toBe(false);
    }
  });
});
