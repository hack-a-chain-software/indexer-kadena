import { GraphQLClient } from 'graphql-request';
import { getBlockQuery } from './builders/block.builder';
import { blockFixture001 } from './fixtures/block/block.fixture.001';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Block', () => {
  it('#001', async () => {
    const query = getBlockQuery({
      hash: 'b6prmp3VFHxMvrdwVZ_DKb8eo5moPJv3SwNA0GLp8I0',
    });

    const data = await client.request(query);
    expect(blockFixture001.data).toMatchObject(data);
  });
});
