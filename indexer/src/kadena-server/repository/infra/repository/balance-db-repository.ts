import { rootPgPool } from '../../../../config/database';
import BalanceModel from '../../../../models/balance';
import { formatBalance_NODE, formatGuard_NODE } from '../../../../utils/chainweb-node';
import { handleSingleQuery } from '../../../utils/raw-query';
import BalanceRepository, {
  FungibleAccountOutput,
  FungibleChainAccountOutput,
  GetTokensParams,
  INonFungibleAccount,
  INonFungibleChainAccount,
  INonFungibleTokenBalance,
} from '../../application/balance-repository';
import {
  getNonFungibleAccountBase64ID,
  getNonFungibleChainAccountBase64ID,
} from '../base64-id-generators';
import { fungibleAccountValidator } from '../schema-validator/fungible-account-validator';
import { fungibleChainAccountValidator } from '../schema-validator/fungible-chain-account-validator';
import { nonFungibleTokenBalanceValidator } from '../schema-validator/non-fungible-token-balance-validator';
import { getPageInfo, getPaginationParams } from '../../pagination';

export default class BalanceDbRepository implements BalanceRepository {
  // TODO: waiting for orphan blocks mechanism to be ready
  async getAccountInfo(accountName: string, fungibleName = 'coin') {
    const account = await BalanceModel.findOne({
      where: {
        account: accountName,
        ...(fungibleName && { module: fungibleName }),
      },
    });

    const totalBalanceQuery = `
      select b.account, sum(balance) as "totalBalance"
      from "Balances" b
      where b.account = $1
      and b.module = $2
      group by b.account
    `;

    const { rows } = await rootPgPool.query(totalBalanceQuery, [accountName, fungibleName]);

    if (!account || !rows?.length) {
      throw new Error('Account not found.');
    }

    const accountInfo = fungibleAccountValidator.mapFromSequelize(account);
    const totalBalance = fungibleAccountValidator.validateTotalBalance(rows[0]);
    return { ...accountInfo, totalBalance };
  }

  // TODO: waiting for orphan blocks mechanism to be ready
  async getChainsAccountInfo(
    accountName: string,
    fungibleName: string,
    chainIds?: string[],
  ): Promise<FungibleChainAccountOutput[]> {
    let query = `
      SELECT b.id, b."chainId", b.balance, b.module, b.account as "accountName"
      FROM "Balances" b
      WHERE b.account = $1
      AND b.module = $2
    `;

    const queryParams: any[] = [accountName, fungibleName];

    if (chainIds?.length) {
      queryParams.push(chainIds);
      query += ` AND b."chainId" = ANY($3::int[])`;
    }

    const { rows } = await rootPgPool.query(query, queryParams);

    const output = rows.map(r => fungibleChainAccountValidator.validate(r));
    return output;
  }

  // TODO: waiting for orphan blocks mechanism to be ready
  async getAccountsByPublicKey(
    publicKey: string,
    fungibleName: string,
  ): Promise<FungibleAccountOutput[]> {
    const publicKeyQuery = `
      SELECT p.id, p."chainId", p.account, p.module
      FROM "Guards" p
      WHERE p."publicKey" = $1
      AND p.module = $2
    `;

    const queryParams = [publicKey, fungibleName];
    const { rows } = await rootPgPool.query(publicKeyQuery, queryParams);

    const totalBalanceQuery = `
      select b.account, sum(balance) as "totalBalance"
      from "Balances" b
      WHERE b.account = ANY($1::text[])
      AND b.module = $2
      group by b.account
    `;

    const { rows: totalBalanceRows } = await rootPgPool.query(totalBalanceQuery, [
      rows.map(a => a.account),
      fungibleName,
    ]);

    const balanceMapping = totalBalanceRows.reduce(
      (acum, cur) => ({
        ...acum,
        [cur.account]: cur.totalBalance,
      }),
      {},
    );
    const output = rows.map(r => {
      return {
        ...fungibleAccountValidator.validate(r),
        totalBalance: balanceMapping[r.account],
      };
    });

    return output;
  }

  // TODO: waiting for orphan blocks mechanism to be ready
  async getChainAccountsByPublicKey(
    publicKey: string,
    fungibleName: string,
    chainId: string,
  ): Promise<FungibleChainAccountOutput[]> {
    const publicKeyQuery = `
      SELECT p.id, p."chainId", p.account, p.module
      FROM "Guards" p
      WHERE p."publicKey" = $1
      AND p.module = $2
      AND p."chainId" = $3
    `;

    const queryParams = [publicKey, fungibleName, chainId];
    const { rows } = await rootPgPool.query(publicKeyQuery, queryParams);

    if (rows.length === 0) return [];

    const balanceQueryParams: any = [];
    const placeholders = rows
      .map(r => ({
        chainId: r.chainId,
        module: r.module,
        account: r.account,
      }))
      .map((filter, index) => {
        balanceQueryParams.push(filter.chainId, filter.module, filter.account);
        const startIndex = index * 3 + 1;
        return `($${startIndex}, $${startIndex + 1}, $${startIndex + 2})`;
      })
      .join(', ');

    const balanceQuery = `
        SELECT
          b.id,
          b."chainId",
          b.module,
          b.account as "accountName",
          b.balance
        FROM "Balances" b
        WHERE (b."chainId", b.module, b.account) IN (${placeholders})
    `;

    const { rows: accountRows } = await rootPgPool.query(balanceQuery, balanceQueryParams);

    const output = accountRows
      .filter(r => r.hasTokenId)
      .map(r => fungibleChainAccountValidator.validate(r));
    return output;
  }

  async getNonFungibleAccountInfo(accountName: string): Promise<INonFungibleAccount | null> {
    const queryParams = [accountName];
    let query = `
      SELECT b.id, b."chainId", b.balance, b."tokenId", b.account, b.module, b."hasTokenId"
      FROM "Balances" b
      WHERE b.account = $1
      AND b.module = 'marmalade-v2.ledger'
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    if (rows.length === 0) return null;

    const nonFungibleTokenBalances = rows
      .filter(r => r.hasTokenId)
      .map(row => {
        return nonFungibleTokenBalanceValidator.validate(row);
      });

    return {
      id: getNonFungibleAccountBase64ID(accountName),
      accountName,
      chainAccounts: [],
      nonFungibleTokenBalances,
    };
  }

  async getNonFungibleChainAccountsInfo(accountName: string): Promise<INonFungibleChainAccount[]> {
    const queryParams = [accountName];
    const query = `
      SELECT b.id, b."chainId", b.balance, b."tokenId", b.account, b.module, b."hasTokenId"
      FROM "Balances" b
      WHERE b.account = $1
      AND b.module = 'marmalade-v2.ledger'
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    if (rows.length === 0) return [];

    const nonFungibleTokenBalances = rows
      .filter(row => row.hasTokenId)
      .map(row => {
        return nonFungibleTokenBalanceValidator.validate(row);
      });

    const output = rows.map(row => ({
      id: getNonFungibleChainAccountBase64ID(row.chainId, accountName),
      accountName,
      chainId: row.chainId,
      nonFungibleTokenBalances,
    }));

    return output;
  }

  async getNonFungibleChainAccountInfo(
    accountName: string,
    chainId: string,
  ): Promise<INonFungibleChainAccount | null> {
    const queryParams = [accountName, chainId];
    const query = `
      SELECT b.id, b."chainId", b.balance, b."tokenId", b.account, b.module, b."hasTokenId"
      FROM "Balances" b
      WHERE b.account = $1
      AND b."chainId" = $2
      AND b.module = 'marmalade-v2.ledger'
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    if (rows.length === 0) return null;

    const nonFungibleTokenBalances = rows.map(row => {
      return nonFungibleTokenBalanceValidator.validate(row);
    });

    return {
      id: getNonFungibleChainAccountBase64ID(chainId, accountName),
      accountName,
      chainId,
      nonFungibleTokenBalances,
    };
  }

  async getNonFungibleTokenBalance(
    accountName: string,
    chainId: string,
    tokenId: string,
  ): Promise<INonFungibleTokenBalance | null> {
    const queryParams = [accountName, tokenId, chainId];
    let query = `
      SELECT b.id, b."chainId", b.balance, b."tokenId", b.account, b."hasTokenId"
      FROM "Balances" b
      WHERE b.account = $1
      AND b."tokenId" = $2
      AND "chainId" = $3
      AND "hasTokenId" = true
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    if (rows.length === 0) return null;

    const output = nonFungibleTokenBalanceValidator.validate(rows[0]);

    return output;
  }

  async getAccountInfo_NODE(
    accountName: string,
    fungibleName = 'coin',
  ): Promise<FungibleAccountOutput> {
    const query = `
      SELECT DISTINCT b."chainId"
      FROM "Balances" b
      WHERE b.account = $1
      AND b.module = $2
    `;
    const { rows } = await rootPgPool.query(query, [accountName, fungibleName]);

    const chainIds = rows.map(r => Number(r.chainId));

    const balancePromises = chainIds.map(c => {
      const query = {
        chainId: c.toString(),
        code: `(${fungibleName}.details \"${accountName}\")`,
      };
      return handleSingleQuery(query);
    });

    const balances = (await Promise.all(balancePromises)).filter(b => b.status === 'success');
    const balancesNumber = balances.map(b => formatBalance_NODE(b));
    const totalBalance = balancesNumber.reduce((acc, cur) => acc + cur, 0);

    const accountInfo = fungibleAccountValidator.mapFromSequelize({
      account: accountName,
      module: fungibleName,
      chainId: -1,
      balance: BigInt(-1),
      hasTokenId: false,
    });
    return { ...accountInfo, totalBalance };
  }

  async getChainsAccountInfo_NODE(
    accountName: string,
    fungibleName: string,
    chainIds?: string[],
  ): Promise<FungibleChainAccountOutput[]> {
    let chainIdsParam = [];
    if (!chainIds?.length) {
      const query = `
        SELECT DISTINCT b."chainId"
        FROM "Balances" b
        WHERE b.account = $1
        AND b.module = $2
      `;
      const { rows } = await rootPgPool.query(query, [accountName, fungibleName]);
      const chainIds = rows.map(r => Number(r.chainId));
      chainIdsParam.push(...chainIds);
    } else {
      chainIdsParam.push(...chainIds.map(c => Number(c)));
    }

    const balancePromises = chainIdsParam.map(c => {
      const query = {
        chainId: c.toString(),
        code: `(${fungibleName}.details \"${accountName}\")`,
      };
      return handleSingleQuery(query);
    });

    const rows = (await Promise.all(balancePromises)).filter(b => b.status === 'success');

    const rowsMapped = rows.map((row, index) => {
      const balance = formatBalance_NODE(row);
      const guard = formatGuard_NODE(row);
      return {
        id: index,
        accountName,
        chainId: chainIdsParam[index],
        balance: balance.toString(),
        module: fungibleName,
        guard,
      };
    });

    const output = rowsMapped.map(r => fungibleChainAccountValidator.validate(r));

    return output;
  }

  async getAccountsByPublicKey_NODE(
    publicKey: string,
    fungibleName: string,
  ): Promise<FungibleAccountOutput[]> {
    const guardsQuery = `
      SELECT g."publicKey", g."balanceId"
      FROM "Guards" g
      WHERE g."publicKey" = $1
    `;

    const { rows: guardRows } = await rootPgPool.query(guardsQuery, [publicKey]);

    if (!guardRows?.length) {
      const params = [`k:${publicKey}`, fungibleName];
      const query = `
        SELECT b.account, b."chainId"
        FROM "Balances" b
        WHERE b.account = $1
        AND b.module = $2
      `;
      const { rows } = await rootPgPool.query(query, params);

      if (!rows.length) return [];

      const balancePromises = rows.map(r => {
        const query = {
          chainId: r.chainId.toString(),
          code: `(${fungibleName}.details \"${r.account}\")`,
        };
        return handleSingleQuery(query);
      });

      const balances = (await Promise.all(balancePromises)).filter(b => b.status === 'success');
      const balancesNumber = balances.map(q => formatBalance_NODE(q));
      const totalBalance = balancesNumber.reduce((acc, cur) => acc + cur, 0);

      const accountInfo = fungibleAccountValidator.mapFromSequelize({
        account: `k:${publicKey}`,
        module: fungibleName,
        chainId: -1,
        balance: BigInt(-1),
        hasTokenId: false,
      });
      return [{ ...accountInfo, totalBalance }];
    } else {
      const params = [publicKey, fungibleName];
      const query = `
        SELECT b.account, b."chainId"
        FROM "Balances" b
        JOIN "Guards" g ON b.id = g."balanceId"
        WHERE g."publicKey" = $1
        AND b.module = $2
      `;
      const { rows } = await rootPgPool.query(query, params);

      const groupedByAccount: Record<string, string[]> = rows.reduce(
        (acc, cur) => {
          if (!acc[cur.account]) {
            acc[cur.account] = [];
          }
          acc[cur.account].push(cur.chainId);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      const accountsPromises = Object.entries(groupedByAccount).map(
        async ([account, chainIds], index) => {
          const balances = chainIds.map(async c => {
            const query = {
              chainId: c.toString(),
              code: `(${fungibleName}.details \"${account}\")`,
            };
            const result = await handleSingleQuery(query);
            return formatBalance_NODE(result);
          });

          const balancesNumber = await Promise.all(balances);
          const totalBalance: Number = balancesNumber.reduce((acc, cur) => acc + cur, 0);

          return {
            id: index.toString(),
            accountName: account,
            totalBalance,
            fungibleName,
          };
        },
      );

      const accounts = await Promise.all(accountsPromises);
      return accounts;
    }
  }

  async getChainAccountsByPublicKey_NODE(
    publicKey: string,
    fungibleName: string,
    chainId: string,
  ): Promise<FungibleChainAccountOutput[]> {
    const guardsQuery = `
      SELECT g."publicKey", g."balanceId"
      FROM "Guards" g
      WHERE g."publicKey" = $1
    `;

    const { rows: guardRows } = await rootPgPool.query(guardsQuery, [publicKey]);

    const params = [guardRows?.length ? publicKey : `k:${publicKey}`, fungibleName, chainId];
    let query = '';
    if (!guardRows?.length) {
      query = `
        SELECT b.id, b.account, b."chainId", b.module
        FROM "Balances" b
        WHERE b.account = $1
        AND b.module = $2
        AND b."chainId" = $3
      `;
    } else {
      query = `
        SELECT b.id, b.account, b."chainId", b.module
        FROM "Balances" b
        JOIN "Guards" g ON b.id = g."balanceId"
        WHERE g."publicKey" = $1
        AND b.module = $2
        AND b."chainId" = $3
      `;
    }

    const { rows } = await rootPgPool.query(query, params);
    const balancesWithQuery = rows.map(async r => {
      const query = {
        chainId: r.chainId.toString(),
        code: `(${fungibleName}.details \"${r.account}\")`,
      };

      return {
        id: r.id,
        accountName: r.account,
        chainId: r.chainId,
        balanceQuery: await handleSingleQuery(query),
        module: r.module,
      };
    });

    const queries = (await Promise.all(balancesWithQuery)).filter(
      b => b.balanceQuery.status === 'success',
    );

    const balances = queries.map(b => {
      const balance = formatBalance_NODE(b.balanceQuery).toString();
      return {
        ...b,
        balance,
        guard: formatGuard_NODE(b.balanceQuery),
      };
    });

    const output = balances.map(r => fungibleChainAccountValidator.validate(r));
    return output;
  }

  async getTokens(params: GetTokensParams) {
    const { limit, order, after, before } = getPaginationParams(params);

    const queryParams: any[] = [limit];
    let conditions = '';

    if (after) {
      const [module, chainId] = after.split(',');
      queryParams.push(module);
      queryParams.push(chainId);
      conditions += `\nAND (module, "chainId") > ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (before) {
      const [module, chainId] = before.split(',');
      queryParams.push(module);
      queryParams.push(chainId);
      conditions += `\nAND (module, "chainId") < ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    const query = `
      SELECT DISTINCT module, "chainId"
      FROM "Balances"
      WHERE module != 'coin'
      ${conditions}
      ORDER BY module, "chainId"
      LIMIT $1
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => {
      const cursor = `${row.module},${row.chainId}`;
      return {
        cursor,
        node: {
          id: Buffer.from(`Token:[${cursor}]`).toString('base64'),
          name: row.module,
          chainId: String(row.chainId),
        },
      };
    });

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }
}
