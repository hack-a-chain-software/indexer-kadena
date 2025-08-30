import { GraphQLClient } from 'graphql-request';
import { getEventsQuery } from '../builders/events.builder';
import { eventsFixture001 } from '../fixtures/events/events.fixture.001';
import { eventsFixture002 } from '../fixtures/events/events.fixture.002';
import { eventsFixture003 } from '../fixtures/events/events.fixture.003';
import { eventsFixture004 } from '../fixtures/events/events.fixture.004';
import { eventsFixture005 } from '../fixtures/events/events.fixture.005';
import { eventsFixture006 } from '../fixtures/events/events.fixture.006';
import { eventsFixture007 } from '../fixtures/events/events.fixture.007';
import { eventsFixture008 } from '../fixtures/events/events.fixture.008';
import { eventsFixture009 } from '../fixtures/events/events.fixture.009';
import { eventsFixture010 } from '../fixtures/events/events.fixture.010';
import { eventsFixture011 } from '../fixtures/events/events.fixture.011';

const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('Events', () => {
  it('qualifiedEventName + last', async () => {
    const query = getEventsQuery({ qualifiedEventName: 'pact.X_YIELD', last: 25 });
    const data = await client.request(query);
    expect(eventsFixture001.data).toMatchObject(data);
  });

  it('qualifiedEventName + last + before', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'pact.X_YIELD',
      last: 25,
      before: 'MTYyNDA3ODc5Mzo3Mzg4NzQyMA==',
    });
    const data = await client.request(query);
    expect(eventsFixture002.data).toMatchObject(data);
  });

  it('qualifiedEventName + first + after', async () => {
    const query = getEventsQuery({
      qualifiedEventName: 'pact.X_YIELD',
      first: 25,
      after: 'MTc1NjM4OTU1MjozODk3ODg3MjE=',
    });
    const data = await client.request(query);
    expect(eventsFixture003.data).toMatchObject(data);
  });

  it('moduleName + last', async () => {
    const query = getEventsQuery({ moduleName: 'pact', last: 25 });
    const data = await client.request(query);
    expect(eventsFixture004.data).toMatchObject(data);
  });

  it('module + last + before', async () => {
    const query = getEventsQuery({
      moduleName: 'pact',
      last: 25,
      before: 'MTYyNDA3NzQ2NTozODA5NzY2MjU=',
    });
    const data = await client.request(query);
    expect(eventsFixture005.data).toMatchObject(data);
  });

  it('module + first + after', async () => {
    const query = getEventsQuery({
      moduleName: 'pact',
      first: 25,
      after: 'MTc1NjM5MDI2NDozODk3OTE2NTA=',
    });
    const data = await client.request(query);
    expect(eventsFixture006.data).toMatchObject(data);
  });

  it('blockhash', async () => {
    const query = getEventsQuery({
      blockHash: 'ONd7stIjJbuwMqRmlyQ71XhT-xVvyVy-A0X2DBomw1g',
      first: 10,
    });
    const data = await client.request(query);
    expect(eventsFixture007.data).toMatchObject(data);
  });

  it('requestKey', async () => {
    const query = getEventsQuery({
      requestKey: 'JVOE6mpjSHHOjkg9wdzqGsBoqRx9fiQMq83GEdoi92c',
    });
    const data = await client.request(query);
    expect(eventsFixture008.data).toMatchObject(data);
  });

  it('chainId + last', async () => {
    const query = getEventsQuery({
      chainId: '0',
      last: 25,
    });

    const data = await client.request(query);
    expect(eventsFixture009.data).toMatchObject(data);
  });

  it('chainId + last + before', async () => {
    const query = getEventsQuery({
      chainId: '0',
      last: 25,
      before: 'MTYwNjUyODQ5NzozODEwNzM4Mzk=',
    });

    const data = await client.request(query);
    expect(eventsFixture010.data).toMatchObject(data);
  });

  it('chainId + first + after', async () => {
    const query = getEventsQuery({
      chainId: '0',
      first: 25,
      after: 'MTc1NjQ5MTc0MTozOTAxNzA2MTQ=',
    });

    const data = await client.request(query);
    expect(eventsFixture011.data).toMatchObject(data);
  });
});
