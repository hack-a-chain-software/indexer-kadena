import { GraphQLClient } from 'graphql-request';
import { getEventsQuery } from '../builders/events.builder';
import { eventsFixture001 } from '../fixtures/events/events.fixture.001';
import { eventsFixture002 } from '../fixtures/events/events.fixture.002';
import { eventsFixture003 } from '../fixtures/events/events.fixture.003';
import { eventsFixture004 } from '../fixtures/events/events.fixture.004';
import { eventsFixture005 } from '../fixtures/events/events.fixture.005';
import { eventsFixture006 } from '../fixtures/events/events.fixture.006';

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

describe('Events', () => {
  it('#001', async () => {
    const query = getEventsQuery({ qualifiedEventName: 'pact.X_YIELD', last: 10 });
    const data = await client.request(query);
    expect(eventsFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getEventsQuery({ qualifiedEventName: 'pact.X_YIELD', after: 'MjAy' });
    const data = await client.request(query);
    expect(eventsFixture002.data).toMatchObject(data);
  });

  // blockHash
  it('#003', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'coin.TRANSFER',
      blockHash: 'ONd7stIjJbuwMqRmlyQ71XhT-xVvyVy-A0X2DBomw1g',
      first: 8,
    });
    const data = await client.request(query);
    expect(eventsFixture003.data).toMatchObject(data);
  });

  // requestKey
  it('#004', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'free.crankk01.TRANSFER',
      requestKey: 'JVOE6mpjSHHOjkg9wdzqGsBoqRx9fiQMq83GEdoi92c',
    });
    const data = await client.request(query);
    expect(eventsFixture004.data).toMatchObject(data);
  });

  // height
  it('#005', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'coin.TRANSFER',
      minHeight: 2000000,
      maxHeight: 4500000,
      first: 7,
    });

    const data = await client.request(query);
    expect(eventsFixture005.data).toMatchObject(data);
  });

  // before, last
  it('#006', async () => {
    const query = getEventsQuery({ qualifiedEventName: 'pact.X_YIELD', last: 5, before: 'MzA2' });
    const data = await client.request(query);
    expect(eventsFixture006.data).toMatchObject(data);
  });

  // minimumDepth: Int
  // orderIndex: Int
  // parametersFilter: String
});
