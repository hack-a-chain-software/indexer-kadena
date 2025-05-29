import { Op, Transaction } from 'sequelize';

import { sequelize } from '../config/database';
import Pair from '../models/pair';
import PoolChart from '../models/pool-chart';
import PoolStats from '../models/pool-stats';
import PoolTransaction, { TransactionType } from '../models/pool-transaction';
import Token from '../models/token';
import LiquidityBalance from '../models/liquidity-balance';
import { PriceService } from './price/price.service';

type TokenAmount = number | { decimal: string };

// Cache for token prices in USD
interface TokenPriceCache {
  price: number;
  timestamp: number;
}

interface CreatePairParams {
  moduleName: string;
  name: string;
  parameterText: string;
  parameters: string;
  qualifiedName: string;
  chainId: number;
}

interface TokenReference {
  refName: {
    name: string;
    namespace: string | null;
  };
  refSpec: Array<{
    name: string;
    namespace: string | null;
  }>;
}

export class PairService {
  private static tokenPriceCache: Map<number, TokenPriceCache> = new Map();
  private static readonly PRICE_CACHE_TTL = parseInt(process.env.PRICE_CACHE_TTL || '300000', 10); // Default 5 minutes

  /**
   * Formats a number to exactly 8 decimal places
   * @param value The number to format
   * @returns The formatted number with 8 decimal places
   */
  private static formatTo8Decimals(value: number | string): number {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || !isFinite(num)) {
      return 0;
    }
    return Number(num.toFixed(8));
  }

  /**
   * Creates a token if it doesn't exist
   * @param tokenRef Token reference from the parameters
   * @param transaction Sequelize transaction
   * @returns Created or found token
   */
  private static async createOrFindToken(
    tokenRef: TokenReference,
    transaction: any,
  ): Promise<Token> {
    const tokenName = tokenRef.refName.name;
    const tokenNamespace = tokenRef.refName.namespace || '';

    const code = tokenNamespace ? `${tokenNamespace}.${tokenName}` : tokenName;

    // Try to find the token by code (which is also the address)
    let token = await Token.findOne({
      where: {
        code,
      },
      transaction,
    });

    // If not found, create a new one
    if (!token) {
      token = await Token.create(
        {
          address: code,
          name: tokenName,
          symbol: tokenName.toUpperCase(),
          code,
          decimals: 18, // Default to 18 decimals
          totalSupply: '0',
          tokenInfo: {
            decimalsToDisplay: 8,
            description: '',
            themeColor: '#000000',
            discordUrl: '',
            mediumUrl: '',
            telegramUrl: '',
            twitterUrl: '',
            websiteUrl: '',
          },
        },
        { transaction },
      );
    }

    return token;
  }

  /**
   * Creates tokens if they don't exist and then creates a pair
   * @param pairs Array of pair creation parameters
   */
  static async createPairs(pairs: CreatePairParams[]): Promise<void> {
    if (!pairs || pairs.length === 0) {
      return;
    }

    const BATCH_SIZE = 10;
    const batches = [];

    // Split pairs into batches
    for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
      batches.push(pairs.slice(i, i + BATCH_SIZE));
    }

    console.log(`Starting to process ${batches.length} batches of ${BATCH_SIZE} pairs each`);

    // Process batches sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const progressPercentage = (((batchIndex + 1) / batches.length) * 100).toFixed(2);
      console.log(
        `Progress: ${progressPercentage}% (Create Pairs Batch ${batchIndex + 1}/${batches.length})`,
      );

      const tx = await sequelize.transaction();
      try {
        await Promise.all(
          batch.map(async pair => {
            try {
              // Parse parameters to get token information
              const params = JSON.parse(pair.parameters);
              const token0Ref = params[0] as TokenReference;
              const token1Ref = params[1] as TokenReference;
              const key = params[2] as string;
              const moduleName = pair.moduleName;

              // Create or find both tokens
              const [token0, token1] = await Promise.all([
                this.createOrFindToken(token0Ref, tx),
                this.createOrFindToken(token1Ref, tx),
              ]);

              // Create pair
              await this.createOrFindPair(token0, token1, moduleName, tx);
            } catch (error) {
              console.error('Error creating pair:', error);
              throw error;
            }
          }),
        );
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        console.error(`Error processing batch ${batchIndex + 1}/${batches.length}:`, error);
      }
    }
    console.log('Finished processing all pair creation batches');
  }

  /**
   * Gets the cached price for a token or calculates it if not cached
   * @param token The token to get price for
   * @returns The token price in USD
   */
  private static async getTokenPriceInUSD(token: Token): Promise<number | undefined> {
    const now = Date.now();
    const cached = this.tokenPriceCache.get(token.id);

    // Return cached price if it's still valid
    if (cached && now - cached.timestamp < this.PRICE_CACHE_TTL) {
      return cached.price;
    }

    // Calculate new price
    const price = await this.calculateTokenPriceInUSD(token, { decimal: '1' });
    if (price !== undefined) {
      this.tokenPriceCache.set(token.id, { price, timestamp: now });
    }
    return price;
  }

  /**
   * Updates pairs and their statistics based on the provided update events
   * @param updateEvents Array of update events
   */
  static async updatePairs(
    updateEvents: Array<{
      moduleName: string;
      name: string;
      parameterText: string;
      parameters: string;
      qualifiedName: string;
      chainId: number;
    }>,
  ): Promise<void> {
    // Process events in smaller batches to avoid connection pool exhaustion
    const BATCH_SIZE = 10;
    const batches = [];

    // Split events into batches
    for (let i = 0; i < updateEvents.length; i += BATCH_SIZE) {
      batches.push(updateEvents.slice(i, i + BATCH_SIZE));
    }

    console.log(`Starting to process ${batches.length} batches of ${BATCH_SIZE} events each`);

    // Process batches sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const progressPercentage = (((batchIndex + 1) / batches.length) * 100).toFixed(2);
      console.log(
        `Progress: ${progressPercentage}% (Update Pairs Batch ${batchIndex + 1}/${batches.length})`,
      );

      const tx = await sequelize.transaction();
      try {
        // Pre-fetch all pairs for this batch to reduce database queries
        const pairKeys = batch.map(event => {
          const [key] = JSON.parse(event.parameters) as [string, TokenAmount, TokenAmount];
          return key;
        });

        const existingPairs = await Pair.findAll({
          where: { key: { [Op.in]: pairKeys } },
          include: [
            { model: Token, as: 'token0' },
            { model: Token, as: 'token1' },
          ],
          transaction: tx,
        });

        const pairMap = new Map(existingPairs.map(pair => [pair.key, pair]));

        // Process each event in the batch
        await Promise.all(
          batch.map(async event => {
            try {
              // Parse the parameters
              const [key, reserve0, reserve1] = JSON.parse(event.parameters) as [
                string,
                TokenAmount,
                TokenAmount,
              ];

              // Convert TokenAmount to string representation
              const reserve0Str =
                typeof reserve0 === 'number' ? reserve0.toString() : reserve0.decimal;
              const reserve1Str =
                typeof reserve1 === 'number' ? reserve1.toString() : reserve1.decimal;

              // Get pair from pre-fetched map
              let pair = pairMap.get(key);

              if (!pair) {
                const [code0, code1] = key.split(':');
                // Create tokens using module name
                const [token0, token1] = await Promise.all([
                  Token.findOrCreate({
                    where: { code: code0 },
                    transaction: tx,
                    defaults: {
                      address: code0,
                      name: code0.split('.').length > 1 ? code0.split('.')[1] : code0,
                      symbol:
                        code0.split('.').length > 1
                          ? code0.split('.')[1].toUpperCase()
                          : code0.toUpperCase(),
                      code: code0,
                      decimals: 18,
                      totalSupply: '0',
                      tokenInfo: {
                        decimalsToDisplay: 8,
                        description: '',
                        themeColor: '#000000',
                        discordUrl: '',
                        mediumUrl: '',
                        telegramUrl: '',
                        twitterUrl: '',
                        websiteUrl: '',
                      },
                    },
                  }),
                  Token.findOrCreate({
                    where: { code: code1 },
                    transaction: tx,
                    defaults: {
                      address: code1,
                      name: code1.split('.').length > 1 ? code1.split('.')[1] : code1,
                      symbol:
                        code1.split('.').length > 1
                          ? code1.split('.')[1].toUpperCase()
                          : code1.toUpperCase(),
                      code: code1,
                      decimals: 18,
                      totalSupply: '0',
                      tokenInfo: {
                        decimalsToDisplay: 8,
                        description: '',
                        themeColor: '#000000',
                        discordUrl: '',
                        mediumUrl: '',
                        telegramUrl: '',
                        twitterUrl: '',
                        websiteUrl: '',
                      },
                    },
                  }),
                ]);

                // Create or find pair using existing method
                pair = await this.createOrFindPair(token0[0], token1[0], event.moduleName, tx);
                pairMap.set(key, pair);
              }

              // Get token prices in USD
              const [token0Price, token1Price] = await Promise.all([
                pair.token0 ? this.getTokenPriceInUSD(pair.token0) : undefined,
                pair.token1 ? this.getTokenPriceInUSD(pair.token1) : undefined,
              ]);

              // Calculate USD values
              const reserve0Usd = token0Price
                ? this.formatTo8Decimals(Number(reserve0Str) * token0Price)
                : '0.00000000';
              const reserve1Usd = token1Price
                ? this.formatTo8Decimals(Number(reserve1Str) * token1Price)
                : '0.00000000';
              const tvlUsd = this.formatTo8Decimals(Number(reserve0Usd) + Number(reserve1Usd));

              // Store chart data
              await PoolChart.create(
                {
                  pairId: pair.id,
                  reserve0: reserve0Str,
                  reserve1: reserve1Str,
                  totalSupply: pair.totalSupply,
                  reserve0Usd,
                  reserve1Usd,
                  tvlUsd,
                  timestamp: new Date(),
                },
                { transaction: tx },
              );

              // Update pair's current state
              await pair.update(
                {
                  reserve0: reserve0Str,
                  reserve1: reserve1Str,
                },
                { transaction: tx },
              );

              // Update pool stats
              await this.updatePoolStats(pair.id, tx);
            } catch (error) {
              console.error('Error updating pair:', error);
              throw error;
            }
          }),
        );
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        console.error(`Error processing batch ${batchIndex + 1}/${batches.length}:`, error);
      }
    }
    console.log('Finished processing all update batches');
  }

  /**
   * Updates pool statistics for a given pair
   * @param pairId ID of the pair to update stats for
   */
  private static async updatePoolStats(pairId: number, tx?: Transaction): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get transactions for different time periods
    const [transactions24h, transactions7d, transactions30d, transactions1y] = await Promise.all([
      PoolTransaction.findAll({
        where: {
          pairId,
          timestamp: { [Op.gte]: oneDayAgo },
        },
      }),
      PoolTransaction.findAll({
        where: {
          pairId,
          timestamp: { [Op.gte]: sevenDaysAgo },
        },
      }),
      PoolTransaction.findAll({
        where: {
          pairId,
          timestamp: { [Op.gte]: thirtyDaysAgo },
        },
      }),
      PoolTransaction.findAll({
        where: {
          pairId,
          timestamp: { [Op.gte]: oneYearAgo },
        },
      }),
    ]);

    // Get latest chart data for TVL
    const latestChart = await PoolChart.findOne({
      where: { pairId },
      order: [['timestamp', 'DESC']],
    });

    // Calculate volumes and fees
    const volume24h = transactions24h.reduce(
      (sum, tx) => sum + parseFloat(tx.amountUsd.toString()),
      0,
    );
    const volume7d = transactions7d.reduce(
      (sum, tx) => sum + parseFloat(tx.amountUsd.toString()),
      0,
    );
    const volume30d = transactions30d.reduce(
      (sum, tx) => sum + parseFloat(tx.amountUsd.toString()),
      0,
    );
    const volume1y = transactions1y.reduce(
      (sum, tx) => sum + parseFloat(tx.amountUsd.toString()),
      0,
    );

    const fees24h = transactions24h.reduce((sum, tx) => sum + parseFloat(tx.feeUsd.toString()), 0);
    const fees7d = transactions7d.reduce((sum, tx) => sum + parseFloat(tx.feeUsd.toString()), 0);
    const fees30d = transactions30d.reduce((sum, tx) => sum + parseFloat(tx.feeUsd.toString()), 0);
    const fees1y = transactions1y.reduce((sum, tx) => sum + parseFloat(tx.feeUsd.toString()), 0);

    // Calculate APR (assuming 0.3% fee)
    const tvlUsd = latestChart?.tvlUsd ? parseFloat(latestChart.tvlUsd) : 0;
    const apr24h = tvlUsd > 0 ? (fees24h * 365) / tvlUsd : 0;

    // Get TVL history
    const tvlHistory = await PoolChart.findAll({
      where: { pairId },
      attributes: ['timestamp', 'tvlUsd'],
      order: [['timestamp', 'ASC']],
    });

    // Update or create pool stats
    await PoolStats.upsert(
      {
        pairId,
        timestamp: now,
        volume24hUsd: this.formatTo8Decimals(volume24h),
        volume7dUsd: this.formatTo8Decimals(volume7d),
        volume30dUsd: this.formatTo8Decimals(volume30d),
        volume1yUsd: this.formatTo8Decimals(volume1y),
        fees24hUsd: this.formatTo8Decimals(fees24h),
        fees7dUsd: this.formatTo8Decimals(fees7d),
        fees30dUsd: this.formatTo8Decimals(fees30d),
        fees1yUsd: this.formatTo8Decimals(fees1y),
        tvlUsd: latestChart?.tvlUsd ? this.formatTo8Decimals(parseFloat(latestChart.tvlUsd)) : 0,
        apr24h: this.formatTo8Decimals(apr24h),
        tvlHistory: tvlHistory.map(chart => ({
          timestamp: chart.timestamp,
          value: chart.tvlUsd,
        })),
      },
      { transaction: tx },
    );
  }

  private static async createOrFindPair(
    token0: Token,
    token1: Token,
    moduleName: string,
    tx?: Transaction,
  ): Promise<Pair> {
    // Try to find existing pair
    const existingPair = await Pair.findOne({
      where: {
        [Op.or]: [
          { token0Id: token0.id, token1Id: token1.id },
          { token0Id: token1.id, token1Id: token0.id },
        ],
        address: moduleName,
      },
    });

    if (existingPair) {
      return existingPair;
    }

    // Canonize the key by sorting token codes alphabetically
    const [firstToken, secondToken] = [token0.code, token1.code].sort();
    const key = `${firstToken}:${secondToken}`;

    // Determine which token should be token0 and token1 based on the sorted order
    const isToken0First = token0.code === firstToken;
    const orderedToken0 = isToken0First ? token0 : token1;
    const orderedToken1 = isToken0First ? token1 : token0;

    // Create new pair if not found
    return await Pair.create(
      {
        token0Id: orderedToken0.id,
        token1Id: orderedToken1.id,
        reserve0: '0',
        reserve1: '0',
        totalSupply: '0',
        key: key,
        address: moduleName,
      },
      { transaction: tx },
    );
  }

  /**
   * Processes swap events and records them in the pool transaction history
   * @param swapEvents Array of swap events
   */
  static async processSwaps(
    swapEvents: Array<{
      moduleName: string;
      name: string;
      parameterText: string;
      parameters: string;
      qualifiedName: string;
      chainId: number;
      transactionId: number;
      requestkey: string;
    }>,
  ): Promise<void> {
    if (!swapEvents || swapEvents.length === 0) {
      return;
    }

    const FEE = 0.003; // 0.3% fee
    const BATCH_SIZE = 10;
    const batches = [];

    // Split events into batches
    for (let i = 0; i < swapEvents.length; i += BATCH_SIZE) {
      batches.push(swapEvents.slice(i, i + BATCH_SIZE));
    }

    console.log(`Starting to process ${batches.length} batches of ${BATCH_SIZE} swap events each`);

    // Process batches sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const progressPercentage = (((batchIndex + 1) / batches.length) * 100).toFixed(2);
      console.log(
        `Progress: ${progressPercentage}% (Process Swaps Batch ${batchIndex + 1}/${batches.length})`,
      );

      const tx = await sequelize.transaction();
      try {
        await Promise.all(
          batch.map(async event => {
            try {
              // Parse parameters
              const [sender, receiver, amountIn, tokenInRef, amountOut, tokenOutRef] = JSON.parse(
                event.parameters,
              ) as [string, string, TokenAmount, TokenReference, TokenAmount, TokenReference];

              // Convert TokenAmount to string representation
              const amountInStr =
                typeof amountIn === 'number' ? amountIn.toString() : amountIn.decimal;
              const amountOutStr =
                typeof amountOut === 'number' ? amountOut.toString() : amountOut.decimal;

              // Create or find both tokens
              const tokenIn = await this.createOrFindToken(tokenInRef, tx);
              const tokenOut = await this.createOrFindToken(tokenOutRef, tx);

              // Create or find the pair
              const pair = await this.createOrFindPair(tokenIn, tokenOut, event.moduleName, tx);

              // Get token prices in USD
              const [tokenInPrice, tokenOutPrice] = await Promise.all([
                this.getTokenPriceInUSD(tokenIn),
                this.getTokenPriceInUSD(tokenOut),
              ]);

              // Calculate USD value
              const amountUsd = tokenInPrice
                ? this.formatTo8Decimals(Number(amountInStr) * tokenInPrice)
                : tokenOutPrice
                  ? this.formatTo8Decimals(Number(amountOutStr) * tokenOutPrice)
                  : '0.00000000';

              // Calculate fee amount using the formula: fee_amount = in * (FEE / (1 - FEE))
              const feeAmount = Number(amountInStr) * (FEE / (1 - FEE));
              const feeUsd = tokenInPrice
                ? this.formatTo8Decimals(feeAmount * tokenInPrice)
                : '0.00000000';

              // Create pool transaction record
              await PoolTransaction.create(
                {
                  pairId: pair.id,
                  transactionId: event.transactionId,
                  requestkey: event.requestkey,
                  type: TransactionType.SWAP,
                  maker: sender,
                  timestamp: new Date(),
                  amount0In: pair.token0Id === tokenIn.id ? amountInStr : '0',
                  amount1In: pair.token1Id === tokenIn.id ? amountInStr : '0',
                  amount0Out: pair.token0Id === tokenOut.id ? amountOutStr : '0',
                  amount1Out: pair.token1Id === tokenOut.id ? amountOutStr : '0',
                  amountUsd,
                  feeUsd,
                },
                { transaction: tx },
              );

              // Update pool stats
              await this.updatePoolStats(pair.id, tx);
            } catch (error) {
              console.error('Error processing swap:', error);
              throw error;
            }
          }),
        );
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        console.error(`Error processing batch ${batchIndex + 1}/${batches.length}:`, error);
      }
    }
    console.log('Finished processing all swap batches');
  }

  /**
   * Processes liquidity events and records them in the pool transaction history
   * @param liquidityEvents Array of liquidity events
   */
  static async processLiquidityEvents(
    liquidityEvents: Array<{
      moduleName: string;
      name: string;
      parameterText: string;
      parameters: string;
      qualifiedName: string;
      chainId: number;
      transactionId: number;
      requestkey: string;
    }>,
  ): Promise<void> {
    if (!liquidityEvents || liquidityEvents.length === 0) {
      return;
    }

    const BATCH_SIZE = 10;
    const batches = [];

    // Split events into batches
    for (let i = 0; i < liquidityEvents.length; i += BATCH_SIZE) {
      batches.push(liquidityEvents.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `Starting to process ${batches.length} batches of ${BATCH_SIZE} liquidity events each`,
    );

    // Process batches sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const progressPercentage = (((batchIndex + 1) / batches.length) * 100).toFixed(2);
      console.log(
        `Progress: ${progressPercentage}% (Process Liquidity Events Batch ${batchIndex + 1}/${batches.length})`,
      );

      const tx = await sequelize.transaction();
      try {
        await Promise.all(
          batch.map(async event => {
            try {
              // Parse the parameters
              const [sender, to, token0Ref, token1Ref, amount0, amount1, liquidity] = JSON.parse(
                event.parameters,
              ) as [
                string,
                string,
                TokenReference,
                TokenReference,
                TokenAmount,
                TokenAmount,
                number,
              ];

              // Convert TokenAmount to string representation
              const amount0Str = typeof amount0 === 'number' ? amount0.toString() : amount0.decimal;
              const amount1Str = typeof amount1 === 'number' ? amount1.toString() : amount1.decimal;

              // Find the tokens
              const [token0, token1] = await Promise.all([
                this.createOrFindToken(token0Ref, tx),
                this.createOrFindToken(token1Ref, tx),
              ]);

              // Find the pair
              const pair = await Pair.findOne({
                where: {
                  [Op.or]: [
                    { token0Id: token0.id, token1Id: token1.id },
                    { token0Id: token1.id, token1Id: token0.id },
                  ],
                },
                transaction: tx,
              });

              if (!pair) {
                console.warn(`Pair not found for tokens: ${token0.code} and ${token1.code}`);
                return;
              }

              // Get token prices in USD
              const [token0Price, token1Price] = await Promise.all([
                this.getTokenPriceInUSD(token0),
                this.getTokenPriceInUSD(token1),
              ]);

              // Calculate USD value
              const amountUsd = this.formatTo8Decimals(
                (token0Price ? Number(amount0Str) * token0Price : 0) +
                  (token1Price ? Number(amount1Str) * token1Price : 0),
              );

              // Create pool transaction record
              await PoolTransaction.create(
                {
                  pairId: pair.id,
                  transactionId: event.transactionId,
                  requestkey: event.requestkey,
                  type:
                    event.name === 'ADD_LIQUIDITY'
                      ? TransactionType.ADD_LIQUIDITY
                      : TransactionType.REMOVE_LIQUIDITY,
                  maker: sender,
                  timestamp: new Date(),
                  amount0In:
                    event.name === 'ADD_LIQUIDITY'
                      ? pair.token0Id === token0.id
                        ? amount0Str
                        : amount1Str
                      : '0',
                  amount1In:
                    event.name === 'ADD_LIQUIDITY'
                      ? pair.token1Id === token0.id
                        ? amount0Str
                        : amount1Str
                      : '0',
                  amount0Out:
                    event.name === 'REMOVE_LIQUIDITY'
                      ? pair.token0Id === token1.id
                        ? amount0Str
                        : amount1Str
                      : '0',
                  amount1Out:
                    event.name === 'REMOVE_LIQUIDITY'
                      ? pair.token1Id === token1.id
                        ? amount0Str
                        : amount1Str
                      : '0',
                  amountUsd,
                  feeUsd: '0.00000000',
                },
                { transaction: tx },
              );

              const liquidityBalance = await LiquidityBalance.findOne({
                where: {
                  pairId: pair.id,
                  walletAddress: sender,
                },
                transaction: tx,
              });

              if (event.name === 'ADD_LIQUIDITY') {
                if (liquidityBalance) {
                  // Update existing balance
                  const currentLiquidity = BigInt(liquidityBalance.liquidity);
                  const newLiquidity = currentLiquidity + BigInt(liquidity.toString());
                  await liquidityBalance.update(
                    {
                      liquidity: newLiquidity.toString(),
                    },
                    { transaction: tx },
                  );
                } else {
                  // Create new balance
                  await LiquidityBalance.create(
                    {
                      pairId: pair.id,
                      walletAddress: sender,
                      liquidity: liquidity.toString(),
                    },
                    { transaction: tx },
                  );
                }
              } else if (event.name === 'REMOVE_LIQUIDITY' && liquidityBalance) {
                // Subtract liquidity
                const currentLiquidity = BigInt(liquidityBalance.liquidity);
                const newLiquidity = currentLiquidity - BigInt(liquidity.toString());
                await liquidityBalance.update(
                  {
                    liquidity: newLiquidity.toString(),
                  },
                  { transaction: tx },
                );
              }

              // Update pool stats
              await this.updatePoolStats(pair.id, tx);
            } catch (error) {
              console.error('Error processing liquidity event:', error);
              throw error;
            }
          }),
        );
        await tx.commit();
      } catch (error) {
        await tx.rollback();
        console.error(`Error processing batch ${batchIndex + 1}/${batches.length}:`, error);
      }
    }
    console.log('Finished processing all liquidity batches');
  }

  /**
   * Finds a direct pair between two tokens
   * @param token0Id First token ID
   * @param token1Id Second token ID
   * @returns The pair if found, null otherwise
   */
  private static async findDirectPair(token0Id: number, token1Id: number): Promise<Pair | null> {
    return Pair.findOne({
      where: {
        [Op.or]: [
          { token0Id, token1Id },
          { token0Id: token1Id, token1Id: token0Id },
        ],
      },
      include: [
        { model: Token, as: 'token0' },
        { model: Token, as: 'token1' },
      ],
    });
  }

  /**
   * Uses BFS to find the shortest path to KDA and calculates the token price
   * @param startTokenId Starting token ID
   * @param startAmount Starting token amount
   * @returns The KDA amount if a path is found, undefined otherwise
   */
  private static async findOptimalKdaPricePath(
    startTokenId: number,
    startAmount: number,
  ): Promise<bigint | undefined> {
    // Get KDA token
    const kdaToken = await Token.findOne({ where: { code: 'coin' } });
    if (!kdaToken) {
      return undefined;
    }

    // Queue for BFS: [tokenId, amount, path]
    const queue: Array<[number, number, number[]]> = [[startTokenId, startAmount, [startTokenId]]];
    const visited = new Set<number>([startTokenId]);

    while (queue.length > 0) {
      const [currentTokenId, currentAmount, path] = queue.shift()!;

      // Try direct path to KDA
      const directPair = await this.findDirectPair(currentTokenId, kdaToken.id);
      if (directPair) {
        const reserve0 = Number(directPair.reserve0);
        const reserve1 = Number(directPair.reserve1);

        let kdaAmount: number;
        if (currentTokenId === directPair.token0Id) {
          kdaAmount = reserve0 ? (currentAmount * reserve1) / reserve0 : 0;
        } else {
          kdaAmount = reserve1 ? (currentAmount * reserve0) / reserve1 : 0;
        }

        // Found the shortest path to KDA
        return BigInt(kdaAmount.toFixed(0));
      }

      // If path length is 4, don't explore further
      if (path.length >= 4) {
        continue;
      }

      // Find all connected pairs
      const connectedPairs = await Pair.findAll({
        where: {
          [Op.or]: [{ token0Id: currentTokenId }, { token1Id: currentTokenId }],
        },
        include: [
          { model: Token, as: 'token0' },
          { model: Token, as: 'token1' },
        ],
      });

      // Add connected tokens to queue
      for (const pair of connectedPairs) {
        const otherTokenId = pair.token0Id === currentTokenId ? pair.token1Id : pair.token0Id;

        // Skip if already visited
        if (visited.has(otherTokenId)) {
          continue;
        }

        // Calculate amount of the other token
        const reserve0 = Number(pair.reserve0);
        const reserve1 = Number(pair.reserve1);
        const otherTokenAmount =
          currentTokenId === pair.token0Id
            ? (currentAmount * reserve1) / reserve0
            : (currentAmount * reserve0) / reserve1;

        // Add to queue
        queue.push([otherTokenId, otherTokenAmount, [...path, otherTokenId]]);
        visited.add(otherTokenId);
      }
    }

    return undefined;
  }

  /**
   * Calculates the USD value of a token amount using KDA price and pair information
   * @param token The token to calculate value for
   * @param amount The amount of the token
   * @returns The USD value of the token amount
   */
  static async calculateTokenPriceInUSD(
    token: Token,
    amount: TokenAmount,
  ): Promise<number | undefined> {
    try {
      // Get KDA/USD price
      const priceService = PriceService.getInstance();
      const kdaUsdPrice = priceService.getKdaUsdPrice();
      if (!kdaUsdPrice) {
        console.warn('KDA/USD price not available');
        return undefined;
      }

      // Convert amount to string and then to BigInt
      const amountStr = typeof amount === 'number' ? amount.toFixed(0) : amount.decimal;
      const amountNumber = Number(amountStr);

      // Find shortest path to KDA using BFS
      const kdaAmount = await this.findOptimalKdaPricePath(token.id, amountNumber);

      if (kdaAmount === undefined) {
        console.warn(`No path found to calculate USD value for token ${token.code}`);
        return undefined;
      }

      // Convert to USD
      return Number(kdaAmount) * kdaUsdPrice;
    } catch (error) {
      console.error('Error calculating token USD value:', error);
      return undefined;
    }
  }
}
