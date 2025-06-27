import { GraphQLClient } from 'graphql-request';
import { getPactQueryBuilder } from '../builders/pact-query.builder';
import { pactQueryFixture001 } from '../fixtures/pact-query/pact-query.fixture.001';
import { pactQueryFixture002 } from '../fixtures/pact-query/pact-query.fixture.002';
import { pactQueryFixture003 } from '../fixtures/pact-query/pact-query.fixture.003';

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
