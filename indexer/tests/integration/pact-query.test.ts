import { GraphQLClient } from 'graphql-request';
import { getPactQueryBuilder } from './builders/pact-query.builder';
import { pactQueryFixture001 } from './fixtures/pact-query/pact-query.fixture.001';
import { pactQueryFixture002 } from './fixtures/pact-query/pact-query.fixture.002';
import { pactQueryFixture003 } from './fixtures/pact-query/pact-query.fixture.003';
const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('PactQuery', () => {
  it('#001', async () => {
    const query = getPactQueryBuilder({
      pactQuery: [
        {
          chainId: '1',
          code: "(coin.details (read-msg 'account))",
          data: [{ key: 'account', value: 'test' }],
        },
      ],
    });

    const data = await client.request(query);
    expect(pactQueryFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getPactQueryBuilder({
      pactQuery: [
        {
          chainId: '1',
          code: '(coin.details "test")',
        },
      ],
    });

    const data = await client.request(query);
    expect(pactQueryFixture002.data).toMatchObject(data);
  });

  it('#003', async () => {
    const query = getPactQueryBuilder({
      pactQuery: [
        {
          chainId: '1',
          code: '(describe-module "coin")',
        },
      ],
    });

    const data = await client.request(query);
    expect(pactQueryFixture003.data).toMatchObject(data);
  });
});
