import { getNftTransfers } from '../../../src/utils/transfers';

describe('getNftTransfers', () => {
  it('should format this RECONCILE/MINT event as a transfer', async () => {
    const reconcileEvent = {
      params: [
        't:LMh569P5t1ItN_4b1o3XK_to4IagVgJm89RZ559-sjw',
        1,
        { account: '', current: 0, previous: 0 },
        { account: 'r:n_8aa0eb0be2f51f3f97699ca8d2589ef64a24dbcb.kadena', current: 1, previous: 0 },
      ],
      name: 'RECONCILE',
      module: {
        namespace: 'marmalade-v2',
        name: 'ledger',
      },
      moduleHash: '7QV99opeC0tYI184ws9bMt4ory4l_j_AuYs-LJT2bV4',
      orderIndex: 0,
    };

    const transactionDetailsAttributes = {
      id: 1,
      blockId: 1,
      chainId: 1,
      creationtime: '2025-08-21T18:58:50Z',
      hash: '1234567890',
      result: {},
      logs: '',
      num_events: 1,
      requestkey: 'abc123',
      sender: '',
      txid: '1234567890',
    };

    const output = getNftTransfers([reconcileEvent], transactionDetailsAttributes);

    const expectedTransfers = [
      {
        amount: 1,
        chainId: 1,
        from_acct: '',
        modulehash: '7QV99opeC0tYI184ws9bMt4ory4l_j_AuYs-LJT2bV4',
        modulename: 'marmalade-v2.ledger',
        requestkey: 'abc123',
        to_acct: 'r:n_8aa0eb0be2f51f3f97699ca8d2589ef64a24dbcb.kadena',
        hasTokenId: true,
        tokenId: 't:LMh569P5t1ItN_4b1o3XK_to4IagVgJm89RZ559-sjw',
        type: 'poly-fungible',
        orderIndex: 0,
      },
    ];
    expect(output).toEqual(expectedTransfers);
  });

  it('should format this RECONCILE/BURN event as a transfer', async () => {
    const reconcileEvent = {
      params: [
        't:0WhZyzsJRo4zIUZbXeNh0brWjTgcfbeAPnS7V4FL8BE',
        1,
        {
          account: 'k:ad010254d356e5242cbe508276141f4f19fa06db2455a22ab8805733e3d65138',
          current: 0,
          previous: 1,
        },
        { account: '', current: 0, previous: 0 },
      ],
      name: 'RECONCILE',
      module: {
        namespace: 'marmalade',
        name: 'ledger',
      },
      moduleHash: 'KT2lURUtOUDl0eGNINnE5TVplcU50SXNXd1g2d3dYY2l',
      orderIndex: 2,
    };

    const transactionDetailsAttributes = {
      id: 1,
      blockId: 1,
      chainId: 1,
      creationtime: '2025-08-21T18:58:50Z',
      hash: '1234567890',
      result: {},
      logs: '',
      num_events: 1,
      requestkey: 'abc123',
      sender: '',
      txid: '1234567890',
    };

    const output = getNftTransfers([reconcileEvent], transactionDetailsAttributes);

    const expectedTransfers = [
      {
        amount: 1,
        chainId: 1,
        from_acct: 'k:ad010254d356e5242cbe508276141f4f19fa06db2455a22ab8805733e3d65138',
        modulehash: 'KT2lURUtOUDl0eGNINnE5TVplcU50SXNXd1g2d3dYY2l',
        modulename: 'marmalade.ledger',
        requestkey: 'abc123',
        to_acct: '',
        hasTokenId: true,
        tokenId: 't:0WhZyzsJRo4zIUZbXeNh0brWjTgcfbeAPnS7V4FL8BE',
        type: 'poly-fungible',
        orderIndex: 2,
      },
    ];
    expect(output).toEqual(expectedTransfers);
  });

  it('should format this RECONCILE/TRANSFER event as a transfer', async () => {
    const reconcileEvent = {
      params: [
        't:_sLgqsJyfOxfIduWkb_llroKrb7Vo-O6LmoDgigXgY8',
        1,
        {
          account: 'k:1b57695390163531852f7724313e3ef9ab4728425fead4d1d120444c33f1aa58',
          current: 0,
          previous: 1,
        },
        {
          account: 'k:85a29bcd001682d1be2927560db18f452e1e439b6ffd7db722a52a8b68558a4e',
          current: 1,
          previous: 0,
        },
      ],
      name: 'RECONCILE',
      module: {
        namespace: 'marmalade-v2',
        name: 'ledger',
      },
      moduleHash: 'rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4',
      orderIndex: 2,
    };

    const transactionDetailsAttributes = {
      id: 1,
      blockId: 1,
      chainId: 1,
      creationtime: '2025-08-21T18:58:50Z',
      hash: '1234567890',
      result: {},
      logs: '',
      num_events: 1,
      requestkey: 'abc123',
      sender: '',
      txid: '1234567890',
    };

    const output = getNftTransfers([reconcileEvent], transactionDetailsAttributes);

    const expectedTransfers = [
      {
        amount: 1,
        chainId: 1,
        from_acct: 'k:1b57695390163531852f7724313e3ef9ab4728425fead4d1d120444c33f1aa58',
        modulehash: 'rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4',
        modulename: 'marmalade-v2.ledger',
        requestkey: 'abc123',
        to_acct: 'k:85a29bcd001682d1be2927560db18f452e1e439b6ffd7db722a52a8b68558a4e',
        hasTokenId: true,
        tokenId: 't:_sLgqsJyfOxfIduWkb_llroKrb7Vo-O6LmoDgigXgY8',
        type: 'poly-fungible',
        orderIndex: 2,
      },
    ];
    expect(output).toEqual(expectedTransfers);
  });

  it('should ignore this TRANSFER event', async () => {
    const reconcileEvent = {
      params: ['', 'k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3', 0.9440715],
      name: 'TRANSFER',
      module: {
        namespace: '',
        name: 'coin',
      },
      moduleHash: 'rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4',
      orderIndex: 2,
    };

    const transactionDetailsAttributes = {
      id: 1,
      blockId: 1,
      chainId: 1,
      creationtime: '2025-08-21T18:58:50Z',
      hash: '1234567890',
      result: {},
      logs: '',
      num_events: 1,
      requestkey: 'abc123',
      sender: '',
      txid: '1234567890',
    };

    const output = getNftTransfers([reconcileEvent], transactionDetailsAttributes);
    expect(output).toEqual([]);
  });
});
