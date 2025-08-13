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
import { transfersFixture009 } from '../fixtures/transfers/transfers.fixture.009';
import { transfersFixture010 } from '../fixtures/transfers/transfers.fixture.010';
import { transfersFixture011 } from '../fixtures/transfers/transfers.fixture.011';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Transfers', () => {
  it('#001 - requestKey', async () => {
    const query = getTransfersQuery({
      requestKey: 'RNxoNCcQriEZU3p_qLSiJAo7Bi-0-Oe7NkjkPFOKr70',
    });

    const data = await client.request(query);
    expect(transfersFixture001.data).toMatchObject(data);
  });

  it('#002 - blockHash', async () => {
    const query = getTransfersQueryTwo({
      blockHash: 'OT7c7X4Mql24dslm4Hvsc5tyKrjjxPDImyopqlRJKiQ',
    });

    const data = await client.request(query);
    expect(transfersFixture002.data).toMatchObject(data);
  });

  it('#003 - accountName + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:684630cdf2d1107a459a6c6004b74cd4f4437e746e6f2192c55981c2fc524fd5',
      after: 'MTc1NDY1ODMzMTozNzg1OTQ0NTQ=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture003.data).toMatchObject(data);
  });

  it('#004 - chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      chainId: '19',
      after: 'MTc1NDY3NTU1MjozNzg2NTY4MTU=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture004.data).toMatchObject(data);
  });

  it('#005 - accountName + chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:684630cdf2d1107a459a6c6004b74cd4f4437e746e6f2192c55981c2fc524fd5',
      chainId: '0',
      after: 'MTc1NDY0MzMxNTozNzg1Mzk2NDI=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture005.data).toMatchObject(data);
  });

  it('#006 - accountName + fungibleName + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'free.crankk01',
      after: 'MTc1MjQ0NDIwNzo5NTU3MzA3OA==',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture006.data).toMatchObject(data);
  });

  it('#007 - fungibleName + chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      fungibleName: 'free.crankk01',
      chainId: '0',
      after: 'MTc1NDY3ODA1ODozNzg2NjU5MzE=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture007.data).toMatchObject(data);
  });

  it('#008 - accountName + fungibleName + chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      after: 'MTcxMzMzODgxNjo1NTg1MzQ4Mg==',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture008.data).toMatchObject(data);
  });

  it('#009 - accountName + fungibleName + chainId + last', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      last: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture009.data).toMatchObject(data);
  });

  it('#010 - accountName + fungibleName + chainId + before + last', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      before: 'MTcxMTA4Njk5OTo1NjczMzcxOQ==',
      last: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture010.data).toMatchObject(data);
  });

  it('#011 - accountName + isNFT + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:ef4a368a2d66e50ae885e981cd6e139a0bcb8b469e5ad18ebc55a477dbdefdec',
      isNFT: true,
      after: 'MTczOTA0ODQ0MjozNjg1OTYw',
      first: 5,
    });

    const data = await client.request(query);
    expect(transfersFixture011.data).toMatchObject(data);
  });

  it('#012 - isNFT + fungibleName', async () => {
    const query = getTransfersQueryTwo({
      isNFT: true,
      fungibleName: 'k:ef4a368a2d66e50ae885e981cd6e139a0bcb8b469e5ad18ebc55a477dbdefdec',
    });

    await expect(client.request(query)).rejects.toMatchObject({
      response: {
        errors: [
          expect.objectContaining({ message: 'isNFT and fungibleName cannot be used together' }),
        ],
      },
    });
  });
});
