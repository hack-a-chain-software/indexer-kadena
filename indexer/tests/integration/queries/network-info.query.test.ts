import { GraphQLClient } from 'graphql-request';
import { getNetworkInfoQuery } from '../builders/network-info.builder';
import { networkInfoFixture001 } from '../fixtures/network-info/network-info.fixture.001';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Network Info', () => {
  it('#001 - Verify All Network Info Fields', async () => {
    const query = getNetworkInfoQuery();
    const data = await client.request(query);

    const fixture = networkInfoFixture001.data.networkInfo;

    expect(data.networkInfo.apiVersion).toBe(fixture.apiVersion);

    expect(data.networkInfo.genesisHeights).toMatchObject(fixture.genesisHeights);

    expect(data.networkInfo.networkHost).toBe(fixture.networkHost);

    expect(data.networkInfo.networkId).toBe(fixture.networkId);

    expect(data.networkInfo.nodeBlockDelay).toBe(fixture.nodeBlockDelay);

    expect(data.networkInfo.nodeChains).toMatchObject(fixture.nodeChains);

    expect(data.networkInfo.nodePackageVersion).toBe(fixture.nodePackageVersion);

    expect(data.networkInfo.nodeServiceDate).toBe(fixture.nodeServiceDate);

    expect(data.networkInfo.numberOfChains).toBe(fixture.numberOfChains);

    expect(data.networkInfo.nodeLatestBehaviorHeight).toBe(fixture.nodeLatestBehaviorHeight);

    expect(Number(data.networkInfo.transactionCount)).toBeGreaterThanOrEqual(
      Number(fixture.transactionCount),
    );

    expect(Number(data.networkInfo.coinsInCirculation)).toBeGreaterThanOrEqual(
      Number(fixture.coinsInCirculation),
    );

    expect(Number(data.networkInfo.networkHashRate)).toBeGreaterThanOrEqual(0);

    expect(Number(data.networkInfo.totalDifficulty)).toBeGreaterThanOrEqual(0);
  });
});
