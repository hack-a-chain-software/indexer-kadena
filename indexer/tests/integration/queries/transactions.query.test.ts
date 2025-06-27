import { GraphQLClient } from 'graphql-request';
import { getTransactionsQuery } from '../builders/transactions.builders';
import { transactionsFixture001 } from '../fixtures/transactions/transactions.fixture.001';
import { transactionsFixture002 } from '../fixtures/transactions/transactions.fixture.002';
import { transactionsFixture003 } from '../fixtures/transactions/transactions.fixture.003';
import { transactionsFixture004 } from '../fixtures/transactions/transactions.fixture.004';
import { transactionsFixture005 } from '../fixtures/transactions/transactions.fixture.005';
import { transactionsFixture006 } from '../fixtures/transactions/transactions.fixture.006';
import { transactionsFixture007 } from '../fixtures/transactions/transactions.fixture.007';
import { transactionsFixture008 } from '../fixtures/transactions/transactions.fixture.008';
import { transactionsFixture009 } from '../fixtures/transactions/transactions.fixture.009';
import { transactionsFixture010 } from '../fixtures/transactions/transactions.fixture.010';

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

describe('Transactions', () => {
  // ********* blockHash *********
  it('#001', async () => {
    const query = getTransactionsQuery({
      blockHash: 'Qzi58vcpW97du01srIwxpwSQUPDRNBnl2EKyubP-IWw',
    });

    const data = await client.request(query);
    expect(transactionsFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getTransactionsQuery({
      blockHash: 'FHD2hEpBYmS7CR8l1B6bhrVM3dvK_L1yz9uKKXPADUQ',
      after: 'MTc0MTgyMDEyMw==',
      first: 6,
    });
    const data = await client.request(query);
    expect(transactionsFixture002.data).toMatchObject(data);
  });

  it('#003', async () => {
    const query = getTransactionsQuery({
      blockHash: 'FHD2hEpBYmS7CR8l1B6bhrVM3dvK_L1yz9uKKXPADUQ',
      last: 5,
    });
    const data = await client.request(query);
    expect(transactionsFixture003.data).toMatchObject(data);
  });

  // ********* requestKey *********
  it('#004', async () => {
    const query = getTransactionsQuery({
      requestKey: 'qGkfYlAZfm0jjmRBA1spBcPQrYZlYWCikN2JQhUFMIQ',
    });
    const data = await client.request(query);
    expect(transactionsFixture004.data).toMatchObject(data);
  });

  it('#005 - accountName', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:f14e8800ca34faedd4d09082d481b53588fcf74e2409da50d292255963e41ac4',
      after: 'MTc0Mzc0MTA2NQ==',
      first: 6,
    });
    const data = await client.request(query);
    expect(transactionsFixture005.data).toMatchObject(data);
  });

  it('#006 - accountName + chainId', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:f14e8800ca34faedd4d09082d481b53588fcf74e2409da50d292255963e41ac4',
      chainId: '19',
      after: 'MTc0MzkyMDQxMw==',
      first: 6,
    });
    const data = await client.request(query);
    expect(transactionsFixture006.data).toMatchObject(data);
  });

  it('#007 - accountName + fungibleName', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:d7a4c1573e16d5bd3362b616c29c427b9c1c722371426e2e12e4571dc2f7ae62',
      fungibleName: 'coin',
      after: 'MTc0NDAyNjE2OQ==',
      first: 6,
    });

    const data = await client.request(query);
    expect(transactionsFixture007.data).toMatchObject(data);
  });

  it('#008 - accountName + maxHeight', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:930cc2b0390bc524f85fd148b9e6638862f151dfb2dc8cef62256dc1fc918988',
      maxHeight: 5500000,
      after: 'MTczNzM3OTIwNQ==',
      first: 6,
    });

    const data = await client.request(query);
    expect(transactionsFixture008.data).toMatchObject(data);
  });

  it('#009 - accountName + minHeight', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:21a68c1c2027c9f721ac9a211c8aec79ad37fcfc079a68f578cc999e3a46fc53',
      minHeight: 4000000,
      after: 'MTczNzAxMDI3OQ==',
      first: 6,
    });

    const data = await client.request(query);
    expect(transactionsFixture009.data).toMatchObject(data);
  });

  it('#010 - coin + minimumDepth', async () => {
    const query = getTransactionsQuery({
      fungibleName: 'coin',
      minimumDepth: 10,
      after: 'MTc0NjQ3MzUyMg==',
    });

    const data = await client.request(query);
    expect(transactionsFixture010.data).toMatchObject(data);
  });
});
