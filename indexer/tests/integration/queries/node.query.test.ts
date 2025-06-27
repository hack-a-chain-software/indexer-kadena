import { GraphQLClient } from 'graphql-request';
import { getNodeQuery } from '../builders/node.builder';
import { nodeFixture001 } from '../fixtures/node/node.fixture.001';
import { nodeFixture002 } from '../fixtures/node/node.fixture.002';
import { nodeFixture003 } from '../fixtures/node/node.fixture.003';
import { nodeFixture004 } from '../fixtures/node/node.fixture.004';
import { nodeFixture005 } from '../fixtures/node/node.fixture.005';
import { nodeFixture006 } from '../fixtures/node/node.fixture.006';
import { nodeFixture007 } from '../fixtures/node/node.fixture.007';
import { nodeFixture008 } from '../fixtures/node/node.fixture.008';
import { nodeFixture009 } from '../fixtures/node/node.fixture.009';
import { nodeFixture010 } from '../fixtures/node/node.fixture.010';

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

describe('Node', () => {
  it('#001 - Block', async () => {
    const query = getNodeQuery('Block', {
      id: 'QmxvY2s6T0txV3psalZXZll6SkdVaEtIMlBBUUo1M2VIMjRNdUd0TC13Sl82bGxWbw==',
    });

    const data = await client.request(query);
    expect(nodeFixture001.data).toMatchObject(data);
  });

  it('#002 - Event', async () => {
    const query = getNodeQuery('Event', {
      id: 'RXZlbnQ6WyIyZU9LNTBhZnppZjRIN2pNQmdLNjlVNURERnRLemJYQjlLbnd2RWVXQ2swIiwiMyIsIlR5Z3VGOVZVbG5rVkYtSmRTVXdSeXpya2FGOTl2OUNONWk3UUpiQ01HZVkiXQ==',
    });

    const data = await client.request(query);
    expect(nodeFixture002.data).toMatchObject(data);
  });

  it('#003 - FungibleAccount', async () => {
    const query = getNodeQuery('FungibleAccount', {
      id: 'RnVuZ2libGVBY2NvdW50OlsiY29pbiIsIms6ZWY3Y2I2NmMzMDZiMjhiMzI3MzRhNTQ0YmJiMDVhYmQxNDMwZDYzNzgyN2MwOWZkMGY4OThhODliNzc5YmFjYyJd',
    });

    const data = await client.request(query);
    expect(nodeFixture003.data).toMatchObject(data);
  });

  it('#004 - FungibleChainAccount', async () => {
    const query = getNodeQuery('FungibleChainAccount', {
      id: 'RnVuZ2libGVDaGFpbkFjY291bnQ6WyIwIiwiY29pbiIsIms6ODRhY2FjMGI3MmU4MWU2MTdlZTQxN2E1NWIxNmNkYWE5Y2JjZDNmZjhmZmZkMTI5NmNiMDkzNzZhNzkxNmQ0MCJd',
    });

    const data = await client.request(query);
    expect(nodeFixture004.data).toMatchObject(data);
  });

  it('#005 - NonFungibleAccount', async () => {
    const query = getNodeQuery('NonFungibleAccount', {
      id: 'Tm9uRnVuZ2libGVBY2NvdW50Oms6MGM2ODZkZjVkNTE0OWY2NjJiY2JkZGIzNWZjYmVkZGM2M2YxM2IyMmZlNmE5ZTI0NWFkNzgxOTgzNGQ2NjNjMw==',
    });

    const data = await client.request(query);
    expect(nodeFixture005.data).toMatchObject(data);
  });

  it('#006 - NonFungibleChainAccount', async () => {
    const query = getNodeQuery('NonFungibleChainAccount', {
      id: 'Tm9uRnVuZ2libGVDaGFpbkFjY291bnQ6WyI4IiwiazowY2JlMmI4ZTIwNWIzZTIyNTExMzM0NTc4ZjhlY2Q5MjY3Yzc1MjdkMjBjZjZhMWFhN2IxMzRkODI4Mjc2NzhkIl0=',
    });

    const data = await client.request(query);
    expect(nodeFixture006.data).toMatchObject(data);
  });

  it('#007 - NonFungibleTokenBalance', async () => {
    const query = getNodeQuery('NonFungibleTokenBalance', {
      id: 'Tm9uRnVuZ2libGVUb2tlbkJhbGFuY2U6WyJ0OjdyTHhnY2ptNFZmenJVcGRGVENlOUVZSFBSOU5rNlR1YkVKTVd6Ny03MTQiLCJrOjQ4ZjNjOGVlM2YxNDk0M2UyMGFkYmIzMDJjZDdlNzQwMzBhZTRlZDFjZmNiYjYzMTNiOGFjNTM2N2MxYTNkZjQiLCI4Il0=',
    });

    const data = await client.request(query);
    expect(nodeFixture007.data).toMatchObject(data);
  });

  it('#008 - Signer', async () => {
    const query = getNodeQuery('Signer', {
      id: 'U2lnbmVyOlsiTzNYRHYzX2NZaHFUUGwyWXItMFVKREZHdUMwNHBlZHd0c0gzVEYxbW1JcyIsIjAiXQ==',
    });

    const data = await client.request(query);
    expect(nodeFixture008.data).toMatchObject(data);
  });

  it('#009 - Transaction', async () => {
    const query = getNodeQuery('Transaction', {
      id: 'VHJhbnNhY3Rpb246WyIyUkprUUpkZ1hRSjZQTkI5MG44WmwwdVZZQklOcV90TGt5STNoVjlpeDEwIiwiWm1jVTNKb0xkU0h2TDQ2MzQzVkJEMTM5ZnM3cFkwczRDOU1YNDJKQnVlZyJd',
    });

    const data = await client.request(query);
    expect(nodeFixture009.data).toMatchObject(data);
  });

  it('#010 - Transfer', async () => {
    const query = getNodeQuery('Transfer', {
      id: 'VHJhbnNmZXI6WyJzNUp3ckxJeUVkQ00tdUJRTFN6RGxJeG9RSld4RkV3UDVOcHN4ekdESEVzIiwiMCIsIjQiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwiT1ZzRFJzQkN0MzZkME1fWjA1ZG5fQ2UxcGVDUUYwY3JnOTloYkI5X1FYVSJd',
    });

    const data = await client.request(query);
    expect(nodeFixture010.data).toMatchObject(data);
  });
});
