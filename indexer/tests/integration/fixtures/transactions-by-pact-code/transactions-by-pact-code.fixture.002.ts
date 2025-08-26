export const transactionsByPactCodeFixture002 = {
  data: {
    transactionsByPactCode: {
      pageInfo: {
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean),
        startCursor: expect.any(String),
        endCursor: expect.any(String),
      },
      edges: expect.arrayContaining([
        expect.objectContaining({
          cursor: expect.any(String),
          node: expect.objectContaining({
            requestKey: expect.any(String),
            chainId: expect.any(String),
            height: expect.any(String),
            canonical: expect.any(Boolean),
            gas: expect.any(String),
            gasLimit: expect.any(String),
            gasPrice: expect.any(String),
            sender: expect.any(String),
          }),
        }),
      ]),
    },
  },
};
