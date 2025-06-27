import { GraphQLClient } from 'graphql-request';
import { getTransfersQuery, getTransfersQueryTwo } from '../builders/transfers.builder';
import { transfersFixture001 } from '../fixtures/transfers/transfers.fixture.001';
import { transfersFixture002 } from '../fixtures/transfers/transfers.fixture.002';
import { transfersFixture003 } from '../fixtures/transfers/transfers.fixture.003';
import { transfersFixture004 } from '../fixtures/transfers/transfers.fixture.004';
import { transfersFixture005 } from '../fixtures/transfers/transfers.fixture.005';
import { transfersFixture006 } from '../fixtures/transfers/transfers.fixture.006';
import { transfersFixture007 } from '../fixtures/transfers/transfers.fixture.007';
import { transfersFixture008 } from '../fixtures/transfers/transfers.fixture.008';

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

describe('Transfers', () => {
  it('#001', async () => {
    const query = getTransfersQuery({
      requestKey: 'RNxoNCcQriEZU3p_qLSiJAo7Bi-0-Oe7NkjkPFOKr70',
    });

    const data = await client.request(query);
    expect(transfersFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getTransfersQueryTwo({
      blockHash: 'OT7c7X4Mql24dslm4Hvsc5tyKrjjxPDImyopqlRJKiQ',
    });

    const data = await client.request(query);
    expect(transfersFixture002.data).toMatchObject(data);
  });

  it('#003', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:684630cdf2d1107a459a6c6004b74cd4f4437e746e6f2192c55981c2fc524fd5',
      after: 'MjIyODc3OTg3',
      first: 6,
    });

    const data = await client.request(query);
    expect(transfersFixture003.data).toMatchObject(data);
  });

  it('#004', async () => {
    const query = getTransfersQueryTwo({
      chainId: '19',
      after: 'MzM0MzgxMDMx',
      first: 6,
    });

    const data = await client.request(query);
    expect(transfersFixture004.data).toMatchObject(data);
  });

  it('#005', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:684630cdf2d1107a459a6c6004b74cd4f4437e746e6f2192c55981c2fc524fd5',
      chainId: '0',
      after: 'MzM0MzgxMjc5',
      first: 6,
    });

    const data = await client.request(query);
    expect(transfersFixture005.data).toMatchObject(data);
  });

  it('#006', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'free.crankk01',
      after: 'MzM0MzQwNTMy',
      first: 6,
    });

    const data = await client.request(query);
    expect(transfersFixture006.data).toMatchObject(data);
  });

  it('#007', async () => {
    const query = getTransfersQueryTwo({
      fungibleName: 'free.crankk01',
      chainId: '0',
      after: 'MzM0MzgyMDU0',
      first: 6,
    });

    const data = await client.request(query);
    expect(transfersFixture007.data).toMatchObject(data);
  });

  it('#008', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      after: 'ODQxMTU3NQ==',
      first: 6,
    });

    const data = await client.request(query);
    expect(transfersFixture008.data).toMatchObject(data);
  });
});
