export const pactQueryFixture001 = {
  data: {
    pactQuery: [
      {
        chainId: '1',
        code: "(coin.details (read-msg 'account))",
        error: null,
        result:
          '{"guard":{"pred":"keys-all","keys":["55c6d18b855820af917b49d49a60e944728a0691a4a9c414a7c0d6b6e31de0ea"]},"balance":1.20342,"account":"test"}',
        status: 'success',
      },
    ],
  },
};
