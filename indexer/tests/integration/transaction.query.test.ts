import { GraphQLClient } from 'graphql-request';
import { getTransactionQuery } from './builders/transaction.builder';
import { transactionFixture001 } from './fixtures/transaction/transaction.fixture.001';
const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Transaction', () => {
  it('#001', async () => {
    const query = getTransactionQuery({
      requestKey: 'Jeva9G9yC0WKOvZPS0VamcVp5wJqOOXZW4jdlnIcE9k',
    });
    const data = await client.request(query);
    expect(transactionFixture001.data).toMatchObject(data);
  });
});
