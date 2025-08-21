import { GraphQLClient } from 'graphql-request';
import { getTransactionsByPactCodeQuery } from '../builders/transactions-by-pact-code.builders';

import { transactionsByPactCodeFixture001 } from '../fixtures/transactions-by-pact-code/transactions-by-pact-code.fixture.001';

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
});
