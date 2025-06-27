import { GraphQLClient } from 'graphql-request';
import { getBlocksFromHeightQuery } from '../builders/blocks-from-height.builder';
import { blocksFromHeightFixture001 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.001';
import { blocksFromHeightFixture002 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.002';
import { blocksFromHeightFixture003 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.003';
import { blocksFromHeightFixture004 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.004';
import { blocksFromHeightFixture005 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.005';

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

describe('Blocks from height', () => {
  it('#001', async () => {
    const query = getBlocksFromHeightQuery({ startHeight: 3000000, endHeight: 5000000 });
    const data = await client.request(query);
    expect(blocksFromHeightFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 3000000,
      endHeight: 5000000,
      chainIds: ['8'],
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture002.data).toMatchObject(data);
  });

  it('#003', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 2000000,
      endHeight: 4000000,
      after: 'NDAwMDAwMDo3NTkwNjA3MQ==',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture003.data).toMatchObject(data);
  });

  it('#004', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 2000000,
      endHeight: 4000000,
      last: 5,
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture004.data).toMatchObject(data);
  });

  it('#005', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 2000000,
      endHeight: 4000000,
      chainIds: ['8'],
      after: 'NDAwMDAwMDo4ODYzOTk0Mg==',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture005.data).toMatchObject(data);
  });
});
