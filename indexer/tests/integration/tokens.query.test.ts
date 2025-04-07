import { GraphQLClient } from 'graphql-request';
import { getTokensQuery } from './builders/tokens.builder';
import { tokensFixture001 } from './fixtures/tokens/tokens.fixture.001';
import { tokensFixture002 } from './fixtures/tokens/tokens.fixture.002';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Tokens', () => {
  it('#001', async () => {
    const query = getTokensQuery({
      first: 10,
      after: 'MzIxMTA1MjY=',
    });

    const data = await client.request(query);
    expect(tokensFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getTokensQuery({
      last: 10,
    });

    const data = await client.request(query);
    expect(tokensFixture002.data).toMatchObject(data);
  });
});
