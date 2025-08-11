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
import { transactionsFixture011 } from '../fixtures/transactions/transactions.fixture.011';
import { transactionsFixture012 } from '../fixtures/transactions/transactions.fixture.012';
import { transactionsFixture013 } from '../fixtures/transactions/transactions.fixture.013';
import { transactionsFixture014 } from '../fixtures/transactions/transactions.fixture.014';
import { transactionsFixture015 } from '../fixtures/transactions/transactions.fixture.015';
import { transactionsFixture016 } from '../fixtures/transactions/transactions.fixture.016';
import { transactionsFixture017 } from '../fixtures/transactions/transactions.fixture.017';
import { transactionsFixture018 } from '../fixtures/transactions/transactions.fixture.018';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Transactions', () => {
  it('#001 - blockHash + isCoinbase', async () => {
    const query = getTransactionsQuery({
      blockHash: 'Qzi58vcpW97du01srIwxpwSQUPDRNBnl2EKyubP-IWw',
      isCoinbase: true,
    });

    const data = await client.request(query);
    expect(transactionsFixture001.data).toMatchObject(data);
  });

  it('#002 - blockHash + after + first', async () => {
    const query = getTransactionsQuery({
      blockHash: 'FHD2hEpBYmS7CR8l1B6bhrVM3dvK_L1yz9uKKXPADUQ',
      after: 'MTc0MTgyMDExNDo0MDA3MzU0Mw==',
      first: 10,
    });
    const data = await client.request(query);
    expect(transactionsFixture002.data).toMatchObject(data);
  });

  it('#003 - blockHash + last', async () => {
    const query = getTransactionsQuery({
      blockHash: 'FHD2hEpBYmS7CR8l1B6bhrVM3dvK_L1yz9uKKXPADUQ',
      last: 10,
    });
    const data = await client.request(query);
    expect(transactionsFixture003.data).toMatchObject(data);
  });

  it('#004 - requestKey', async () => {
    const query = getTransactionsQuery({
      requestKey: 'qGkfYlAZfm0jjmRBA1spBcPQrYZlYWCikN2JQhUFMIQ',
    });
    const data = await client.request(query);
    expect(transactionsFixture004.data).toMatchObject(data);
  });

  it('#005 - accountName + first + after', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:f14e8800ca34faedd4d09082d481b53588fcf74e2409da50d292255963e41ac4',
      after: 'MTc1MTA1NDY2MjozMjQwMzM4Ng==',
      first: 25,
    });
    const data = await client.request(query);
    expect(transactionsFixture005.data).toMatchObject(data);
  });

  it('#006 - accountName + chainId + first', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:f14e8800ca34faedd4d09082d481b53588fcf74e2409da50d292255963e41ac4',
      chainId: '19',
      after: 'MTc1MTA1NDY2MjozMjQwMzM4Ng==',
      first: 25,
    });
    const data = await client.request(query);
    expect(transactionsFixture006.data).toMatchObject(data);
  });

  it('#007 - accountName + fungibleName', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:d7a4c1573e16d5bd3362b616c29c427b9c1c722371426e2e12e4571dc2f7ae62',
      fungibleName: 'coin',
      after: 'MTc1Mzk3NTQyMDo5OTQ0MTc2Ng==',
      first: 25,
    });

    const data = await client.request(query);
    expect(transactionsFixture007.data).toMatchObject(data);
  });

  it('#008 - accountName + maxHeight', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:930cc2b0390bc524f85fd148b9e6638862f151dfb2dc8cef62256dc1fc918988',
      maxHeight: 5500000,
      after: 'MTczNTI1NTczMTo0NDY3NDM4Mg==',
      first: 25,
    });

    const data = await client.request(query);
    expect(transactionsFixture008.data).toMatchObject(data);
  });

  it('#009 - accountName + minHeight', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:21a68c1c2027c9f721ac9a211c8aec79ad37fcfc079a68f578cc999e3a46fc53',
      minHeight: 4000000,
      after: 'MTczNjY4MDg0ODoxNDczNjczMjI=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transactionsFixture009.data).toMatchObject(data);
  });

  it('#010 - accountName + chainId + last', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:21a68c1c2027c9f721ac9a211c8aec79ad37fcfc079a68f578cc999e3a46fc53',
      chainId: '0',
      last: 25,
    });
    const data = await client.request(query);
    expect(transactionsFixture010.data).toMatchObject(data);
  });

  it('#011 - accountName + chainId + last + before', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:21a68c1c2027c9f721ac9a211c8aec79ad37fcfc079a68f578cc999e3a46fc53',
      chainId: '0',
      last: 25,
      before: 'MTcwNTQ2OTcwNjoyMzY5ODg2ODg=',
    });
    const data = await client.request(query);
    expect(transactionsFixture011.data).toMatchObject(data);
  });

  it('#011 - accountName + chainId + last + before', async () => {
    const query = getTransactionsQuery({
      accountName: 'k:21a68c1c2027c9f721ac9a211c8aec79ad37fcfc079a68f578cc999e3a46fc53',
      chainId: '0',
      last: 25,
      before: 'MTcwNTQ2OTcwNjoyMzY5ODg2ODg=',
    });
    const data = await client.request(query);
    expect(transactionsFixture011.data).toMatchObject(data);
  });

  it('#012 - chainId + first + after', async () => {
    const query = getTransactionsQuery({
      chainId: '0',
      first: 25,
      after: 'MTc1NDkxNjQ4MzozMTM0MTE5NTc=',
    });
    const data = await client.request(query);
    expect(transactionsFixture012.data).toMatchObject(data);
  });

  it('#013 - chainId + last', async () => {
    const query = getTransactionsQuery({
      chainId: '19',
      last: 25,
    });
    const data = await client.request(query);
    expect(transactionsFixture013.data).toMatchObject(data);
  });

  it('#014 - chainId + last + before', async () => {
    const query = getTransactionsQuery({
      chainId: '19',
      last: 25,
      before: 'MTU5ODM5NDY4ODo3NjE0Mjc4NQ==',
    });
    const data = await client.request(query);
    expect(transactionsFixture014.data).toMatchObject(data);
  });

  it('#015 - first + after', async () => {
    const query = getTransactionsQuery({
      first: 25,
      after: 'MTc1NDkyMzExOTozMTM0MjgxODU=',
    });
    const data = await client.request(query);
    expect(transactionsFixture015.data).toMatchObject(data);
  });

  it('#016 - last', async () => {
    const query = getTransactionsQuery({
      last: 25,
    });
    const data = await client.request(query);
    expect(transactionsFixture016.data).toMatchObject(data);
  });

  it('#017 - last + before', async () => {
    const query = getTransactionsQuery({
      last: 25,
      before: 'MDozODAxMDY5Nw==',
    });
    const data = await client.request(query);
    expect(transactionsFixture017.data).toMatchObject(data);
  });

  it('#018 - chainId + minHeight + maxHeight', async () => {
    const query = getTransactionsQuery({
      chainId: '0',
      minHeight: 5000000,
      maxHeight: 5500000,
    });
    const data = await client.request(query);
    expect(transactionsFixture018.data).toMatchObject(data);
  });
});
