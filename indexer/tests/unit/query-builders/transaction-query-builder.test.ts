import TransactionQueryBuilder from '../../../src/kadena-server/repository/infra/query-builders/transaction-query-builder';

describe('TransactionQueryBuilder', () => {
  let queryBuilder: TransactionQueryBuilder;

  beforeEach(() => {
    queryBuilder = new TransactionQueryBuilder();
  });

  describe('buildTransactionsQuery', () => {
    // Base parameters that will be common to most test cases
    const baseParams = {
      limit: 10,
      order: 'DESC' as const,
    };

    it('should build a basic query with minimal parameters', () => {
      const { query, queryParams } = queryBuilder.buildTransactionsQuery({
        ...baseParams,
      });

      // Verify query contains the expected structure
      expect(query).toContain('WITH filtered_transactions AS');
      expect(query).toContain('ORDER BY t.creationtime DESC');
      expect(query).toContain('LIMIT $1');

      // Should have limit as the only parameter
      expect(queryParams).toEqual([10]);
    });

    describe('block-first query path', () => {
      it('should build a query with blockHash filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          blockHash: 'test-block-hash',
        });

        // Should use block-first approach
        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b.hash = $2');
        expect(queryParams).toEqual([10, 'test-block-hash']);
      });

      it('should build a query with chainId filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          chainId: '5',
        });

        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b."chainId" = $2');
        expect(queryParams).toEqual([10, '5']);
      });

      it('should build a query with minHeight filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          minHeight: 1000,
        });

        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b."height" >= $2');
        expect(queryParams).toEqual([10, 1000]);
      });

      it('should build a query with maxHeight filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          maxHeight: 2000,
        });

        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b."height" <= $2');
        expect(queryParams).toEqual([10, 2000]);
      });

      it('should build a query with multiple block filters', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          blockHash: 'test-block-hash',
          chainId: '5',
          minHeight: 1000,
        });

        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b.hash = $2');
        expect(query).toContain('AND b."chainId" = $3');
        expect(query).toContain('AND b."height" >= $4');
        expect(queryParams).toEqual([10, 'test-block-hash', '5', 1000]);
      });
    });

    describe('transaction-first query path', () => {
      it('should build a query with accountName filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          accountName: 'test-account',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE t.sender = $2');
        expect(queryParams).toEqual([10, 'test-account']);
      });

      it('should build a query with requestKey filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          requestKey: 'test-request-key',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE t."requestkey" = $2');
        expect(queryParams).toEqual([10, 'test-request-key']);
      });

      it('should build a query with fungibleName filter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          fungibleName: 'coin',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE EXISTS');
        expect(query).toContain('FROM "Events" e');
        expect(query).toContain('AND e."module" = $2');
        expect(queryParams).toEqual([10, 'coin']);
      });

      it('should build a query with hasTokenId and accountName filters', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          accountName: 'test-account',
          hasTokenId: true,
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('AND EXISTS');
        expect(query).toContain('FROM "Transfers" t');
        expect(query).toContain('(t."from_acct" = $1 OR t."to_acct" = $1)');
        expect(query).toContain('AND t."modulename" = \'marmalade-v2.ledger\'');
        expect(queryParams).toEqual([10, 'test-account']);
      });
    });

    describe('pagination parameters', () => {
      it('should build a query with after parameter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          after: '1633046400000:11',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE (t.creationtime, t.id) < ($2, $3)');
        expect(queryParams).toEqual([10, '1633046400000', '11']);
      });

      it('should build a query with before parameter', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          before: '1633046400000:11',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE (t.creationtime, t.id) > ($2, $3)');
        expect(queryParams).toEqual([10, '1633046400000', '11']);
      });

      it('should build a query with both after and before parameters', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          after: '1633046400000:11',
          before: '1633132800000:12',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE (t.creationtime, t.id) < ($2, $3)');
        expect(query).toContain('AND (t.creationtime, t.id) > ($4, $5)');
        expect(queryParams).toEqual([10, '1633046400000', '11', '1633132800000', '12']);
      });
    });

    describe('combined filters', () => {
      it('should build a query combining block and transaction filters with block-first approach', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          blockHash: 'test-block-hash',
          accountName: 'test-account',
          after: '1633046400000:11',
        });

        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b.hash = $2');
        expect(query).toContain('WHERE t.sender = $3');
        expect(query).toContain('AND (t.creationtime, t.id) < ($4, $5)');
        expect(queryParams).toEqual([10, 'test-block-hash', 'test-account', '1633046400000', '11']);
      });

      it('should build a query combining multiple transaction filters with transaction-first approach', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          accountName: 'test-account',
          requestKey: 'test-request-key',
          after: '1633046400000:11',
        });

        expect(query).toContain('WITH filtered_transactions AS');
        expect(query).toContain('WHERE t.sender = $2');
        expect(query).toContain('AND (t.creationtime, t.id) < ($3, $4)');
        expect(query).toContain('AND t."requestkey" = $5');
        expect(queryParams).toEqual([
          10,
          'test-account',
          '1633046400000',
          '11',
          'test-request-key',
        ]);
      });

      it('should build a complex query with both types of filters', () => {
        const { query, queryParams } = queryBuilder.buildTransactionsQuery({
          ...baseParams,
          blockHash: 'test-block-hash',
          chainId: '5',
          minHeight: 1000,
          accountName: 'test-account',
          after: '1633046400000:11',
          before: '1633132800000:11',
        });

        expect(query).toContain('WITH filtered_block AS');
        expect(query).toContain('WHERE b.hash = $2');
        expect(query).toContain('AND b."chainId" = $3');
        expect(query).toContain('AND b."height" >= $4');

        // Transaction conditions appear later in the query
        expect(query).toContain('WHERE t.sender = $5');
        expect(query).toContain('AND (t.creationtime, t.id) < ($6, $7)');
        expect(query).toContain('AND (t.creationtime, t.id) > ($8, $9)');

        expect(queryParams).toEqual([
          10,
          'test-block-hash',
          '5',
          1000,
          'test-account',
          '1633046400000',
          '11',
          '1633132800000',
          '11',
        ]);
      });
    });
  });
});
