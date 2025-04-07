import { GraphQLClient } from 'graphql-request';
import { getEventsQuery } from './builders/events.builder';
import { eventsSeed001 } from './fixtures/events/events.fixture.001';
import { eventsSeed002 } from './fixtures/events/events.fixture.002';
import { eventsSeed003 } from './fixtures/events/events.fixture.003';
import { eventsSeed004 } from './fixtures/events/events.fixture.004';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Events', () => {
  it('#001', async () => {
    const query = getEventsQuery({ qualifiedEventName: 'pact.X_YIELD', last: 10 });
    const data = await client.request(query);
    expect(eventsSeed001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getEventsQuery({ qualifiedEventName: 'pact.X_YIELD', after: 'MjAy' });
    const data = await client.request(query);
    expect(eventsSeed002.data).toMatchObject(data);
  });

  it('#003', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'coin.TRANSFER',
      blockHash: 'ONd7stIjJbuwMqRmlyQ71XhT-xVvyVy-A0X2DBomw1g',
      first: 8,
    });
    const data = await client.request(query);
    expect(eventsSeed003.data).toMatchObject(data);
  });

  it('#004', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'coin.TRANSFER',
      minHeight: 2000000,
      maxHeight: 4500000,
      first: 7,
    });

    const data = await client.request(query);
    expect(eventsSeed004.data).toMatchObject(data);
  });
});
