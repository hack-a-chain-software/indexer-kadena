import { GraphQLClient } from 'graphql-request';
import { getTransfersQuery, getTransfersQueryTwo } from '../builders/transfers.builder';
import { getNftTransfersQuery } from '../builders/nft-transfers.builder';
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
import { transfersFixture012 } from '../fixtures/transfers/transfers.fixture.012';
import { transfersFixture013 } from '../fixtures/transfers/transfers.fixture.013';
import { transfersFixture014 } from '../fixtures/transfers/transfers.fixture.014';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Transfers', () => {
  it('requestKey', async () => {
    const query = getTransfersQuery({
      requestKey: 'RNxoNCcQriEZU3p_qLSiJAo7Bi-0-Oe7NkjkPFOKr70',
    });

    const data = await client.request(query);
    expect(transfersFixture001.data).toMatchObject(data);
  });

  it('blockHash', async () => {
    const query = getTransfersQueryTwo({
      blockHash: 'OT7c7X4Mql24dslm4Hvsc5tyKrjjxPDImyopqlRJKiQ',
    });

    const data = await client.request(query);
    expect(transfersFixture002.data).toMatchObject(data);
  });

  it('accountName + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:684630cdf2d1107a459a6c6004b74cd4f4437e746e6f2192c55981c2fc524fd5',
      after: 'MTc1NjEyNjI0NDozODQ5ODk0MjE=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture003.data).toMatchObject(data);
  });

  it('chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      chainId: '19',
      after: 'MTc1NjEzNTc1MTozODUwMjM3NTM=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture004.data).toMatchObject(data);
  });

  it('accountName + chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:684630cdf2d1107a459a6c6004b74cd4f4437e746e6f2192c55981c2fc524fd5',
      chainId: '0',
      after: 'MTc1NjEyNjI0NDozODQ5ODk0MjE=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture005.data).toMatchObject(data);
  });

  it('accountName + fungibleName + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'free.crankk01',
      after: 'MTc1NTA0ODYxNTozODAwODg0NDI=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture006.data).toMatchObject(data);
  });

  it('fungibleName + chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      fungibleName: 'free.crankk01',
      chainId: '0',
      after: 'MTc1NjEzNjE2MjozODUwMjUwODU=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture007.data).toMatchObject(data);
  });

  it('accountName + fungibleName + chainId + after + first', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      after: 'MTcxNTMzODU2Njo1NDkwOTU4OQ==',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture008.data).toMatchObject(data);
  });

  it('accountName + fungibleName + chainId + last + before', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      last: 25,
      before: 'MTcwODIwMDA5MDo1NzQ5MzU3Mw==',
    });

    const data = await client.request(query);
    expect(transfersFixture009.data).toMatchObject(data);
  });

  it('accountName + fungibleName + chainId + last', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:912da3f72ba0e48a1c7a2ad40b554541a382473284627861ebfa3affeaadbe5e',
      fungibleName: 'coin',
      chainId: '19',
      last: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture010.data).toMatchObject(data);
  });

  it('accountName + isNFT + after + first', async () => {
    const query = getNftTransfersQuery({
      accountName: 'k:ef4a368a2d66e50ae885e981cd6e139a0bcb8b469e5ad18ebc55a477dbdefdec',
      isNFT: true,
      after: 'MTc1NDAwMDA3MTozODM1NDU4MzE=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture011.data).toMatchObject(data);
  });

  it('isNFT + after + first', async () => {
    const query = getNftTransfersQuery({
      isNFT: true,
      after: 'MTc1NTQ0NDgyNDozODM3NTkxNTY=',
      first: 25,
    });

    const data = await client.request(query);
    expect(transfersFixture012.data).toMatchObject(data);
  });

  it('isNFT + fungibleName', async () => {
    const query = getNftTransfersQuery({
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

  it('accountName + first + after (many transfers)', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:c903a4ae7cbd4ddbc0350d40562da52a0a770a5b1fb0e3d9882b22c8c7b63bcc',
      after: 'MTc1NjEyNjY1MzozODQ5OTA3NjI=',
      first: 20,
    });

    const data = await client.request(query);
    expect(transfersFixture013.data).toMatchObject(data);
  });

  it('accountName + last + before (many transfers)', async () => {
    const query = getTransfersQueryTwo({
      accountName: 'k:c903a4ae7cbd4ddbc0350d40562da52a0a770a5b1fb0e3d9882b22c8c7b63bcc',
      last: 20,
      before: 'MTY4MTY0OTgzNDozNTM4NzA1ODU=',
    });

    const data = await client.request(query);
    expect(transfersFixture014.data).toMatchObject(data);
  });
});
