import { GraphQLClient } from 'graphql-request';
import { getTransactionsByPublicKeyQuery } from '../builders/transactions-by-public-key.builder';
import { transactionsByPublicKeyFixture001 } from '../fixtures/transactions-by-public-key/transactions-by-public-key.fixture.001';
import { transactionsByPublicKeyFixture002 } from '../fixtures/transactions-by-public-key/transactions-by-public-key.fixture.002';
import { transactionsByPublicKeyFixture003 } from '../fixtures/transactions-by-public-key/transactions-by-public-key.fixture.003';
const client = new GraphQLClient(process.env.API_URL ?? 'http://localhost:3001/graphql');

describe('TransactionsByPublicKey', () => {
  it('#001', async () => {
    const query = getTransactionsByPublicKeyQuery({
      publicKey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
      after: 'MjExMjA2NTk=',
      first: 6,
    });
    const data = await client.request(query);
    expect(transactionsByPublicKeyFixture001.data).toMatchObject(data);
  });

  it('#002', async () => {
    const query = getTransactionsByPublicKeyQuery({
      publicKey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
      last: 6,
    });
    const data = await client.request(query);
    expect(transactionsByPublicKeyFixture002.data).toMatchObject(data);
  });

  it('#003', async () => {
    const query = getTransactionsByPublicKeyQuery({
      publicKey: '1001e8d69988110ca08122cf6d4e0258cac3b3a3de1978c47080a1cf9f0bcadf',
      last: 6,
      before: 'MTYyNDE5MjMxMg==',
    });
    const data = await client.request(query);
    expect(transactionsByPublicKeyFixture003.data).toMatchObject(data);
  });
});
