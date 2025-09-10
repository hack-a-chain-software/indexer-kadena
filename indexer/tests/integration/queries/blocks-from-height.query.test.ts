import { GraphQLClient } from 'graphql-request';
import {
  getBlocksFromHeightQuery,
  getBlocksFromHeightWithoutTotalCountQuery,
} from '../builders/blocks-from-height.builder';
import { blocksFromHeightFixture001 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.001';
import { blocksFromHeightFixture002 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.002';
import { blocksFromHeightFixture004 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.004';
import { blocksFromHeightFixture005 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.005';
import { blocksFromHeightFixture006 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.006';
import { blocksFromHeightFixture007 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.007';
import { blocksFromHeightFixture008 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.008';
import { blocksFromHeightFixture009 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.009';
import { blocksFromHeightFixture010 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.010';
import { blocksFromHeightFixture011 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.011';
import { blocksFromHeightFixture012 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.012';
import { blocksFromHeightFixture013 } from '../fixtures/blocks-from-height/blocks-from-height.fixture.013';
const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Blocks from height', () => {
  it('startHeight', async () => {
    const query = getBlocksFromHeightWithoutTotalCountQuery({ startHeight: 6000000, first: 25 });
    const data = await client.request(query);
    expect(blocksFromHeightFixture001.data).toMatchObject(data);
  });

  it('startHeight + after', async () => {
    const query = getBlocksFromHeightWithoutTotalCountQuery({
      startHeight: 6000000,
      first: 25,
      after: 'NjAwMDAwMToyNjk1MTU=',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture002.data).toMatchObject(data);
  });

  it('startHeight + last + before', async () => {
    const query = getBlocksFromHeightWithoutTotalCountQuery({
      startHeight: 6000000,
      last: 25,
      before: 'NjE0MTQ2MDoxMTQzMTIyMzY=',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture004.data).toMatchObject(data);
  });

  it('startHeight + endHeight', async () => {
    const query = getBlocksFromHeightQuery({ startHeight: 3000000, endHeight: 5000000, first: 25 });
    const data = await client.request(query);
    expect(blocksFromHeightFixture005.data).toMatchObject(data);
  });

  it('startHeight + endHeight + after', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 3000000,
      endHeight: 5000000,
      first: 25,
      after: 'MzAwMDAwMToxNDYxMjIxNQ==',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture006.data).toMatchObject(data);
  });

  it('startHeight + endHeight + last', async () => {
    const query = getBlocksFromHeightQuery({ startHeight: 3000000, endHeight: 5000000, last: 25 });
    const data = await client.request(query);
    expect(blocksFromHeightFixture007.data).toMatchObject(data);
  });

  it('startHeight + endHeight + last + before', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 3000000,
      endHeight: 5000000,
      last: 25,
      before: 'NDk5OTk5OTo4NzgyMzkyNQ==',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture008.data).toMatchObject(data);
  });

  it('startHeight + endHeight + chainId (8)', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 1000000,
      endHeight: 3000000,
      first: 25,
      chainIds: ['8'],
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture009.data).toMatchObject(data);
  });

  it('startHeight + endHeight + chainIds (0, 15)', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 50000,
      endHeight: 4000000,
      first: 25,
      chainIds: ['0', '15'],
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture010.data).toMatchObject(data);
  });

  it('startHeight + endHeight + chainIds (0, 15) + after', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 50000,
      endHeight: 4000000,
      chainIds: ['0', '15'],
      first: 25,
      after: 'NTAwMjM6MTEyNTMxNzU1',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture011.data).toMatchObject(data);
  });

  it('startHeight + endHeight + chainIds (0, 15) + last', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 50000,
      endHeight: 4000000,
      chainIds: ['0', '15'],
      last: 25,
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture012.data).toMatchObject(data);
  });

  it('startHeight + endHeight + chainIds (0, 15) + last + before', async () => {
    const query = getBlocksFromHeightQuery({
      startHeight: 50000,
      endHeight: 4000000,
      chainIds: ['0', '15'],
      last: 25,
      before: 'Mzk5OTk4OTo5NTA5NTYzNA==',
    });
    const data = await client.request(query);
    expect(blocksFromHeightFixture013.data).toMatchObject(data);
  });
});
