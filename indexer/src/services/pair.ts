import { EventAttributes } from '../models/event';
import Event from '../models/event';
import { PairService } from './pair-service';
import { Op, WhereOptions, Transaction as SequelizeTransaction } from 'sequelize';
import Transaction from '../models/transaction';
// import { DEFAULT_PROTOCOL } from '../kadena-server/config/apollo-server-config';

const MODULE_NAMES = [
  // 'kdlaunch.kdswap-exchange',
  'n_82274f03ce7df5c0ea6c3d5766b535a7a748a552.sushi-exchange',
  'n_82274f03ce7df5c0ea6c3d5766b535a7a748a552.sushi-exchange-tokens',
];
const EVENT_TYPES = ['CREATE_PAIR', 'UPDATE', 'SWAP', 'ADD_LIQUIDITY', 'REMOVE_LIQUIDITY'];
const EXCHANGE_TOKEN_EVENTS = ['MINT_EVENT', 'BURN_EVENT', 'TRANSFER_EVENT'];

const LAST_BLOCK_ID = process.env.BACKFILL_PAIR_EVENTS_LAST_BLOCK_ID
  ? Number(process.env.BACKFILL_PAIR_EVENTS_LAST_BLOCK_ID)
  : null;

/**
 * Process pair creation events from transaction events
 * @param events Array of events from a transaction
 */
export async function processPairCreationEvents(
  events: EventAttributes[],
  transaction: SequelizeTransaction | null | undefined,
): Promise<void> {
  const pairCreationEvents = events.filter(
    event => MODULE_NAMES.includes(event.module) && event.name === 'CREATE_PAIR',
  );

  if (pairCreationEvents.length > 0) {
    const pairParams = pairCreationEvents.map(event => ({
      moduleName: event.module,
      name: event.name,
      parameterText: JSON.stringify(event.params),
      parameters: JSON.stringify(event.params),
      qualifiedName: event.qualname,
      chainId: event.chainId,
    }));
    await PairService.createPairs(pairParams);
  }

  const pairUpdateEvents = events.filter(
    event => MODULE_NAMES.includes(event.module) && event.name === 'UPDATE',
  );

  if (pairUpdateEvents.length > 0) {
    const updateParams = pairUpdateEvents.map(event => ({
      moduleName: event.module,
      name: event.name,
      parameterText: JSON.stringify(event.params),
      parameters: JSON.stringify(event.params),
      qualifiedName: event.qualname,
      chainId: event.chainId,
      transactionId: event.transactionId,
    }));
    await PairService.updatePairs(updateParams);
  }

  const swapEvents = events.filter(
    event => MODULE_NAMES.includes(event.module) && event.name === 'SWAP',
  );

  if (swapEvents.length > 0) {
    const swapParams = swapEvents.map(event => ({
      moduleName: event.module,
      name: event.name,
      parameterText: JSON.stringify(event.params),
      parameters: JSON.stringify(event.params),
      qualifiedName: event.qualname,
      chainId: event.chainId,
      transactionId: event.transactionId,
      requestkey: event.requestkey,
    }));
    await PairService.processSwaps(swapParams);
  }

  const liquidityEvents = events.filter(
    event =>
      MODULE_NAMES.includes(event.module) &&
      (event.name === 'ADD_LIQUIDITY' || event.name === 'REMOVE_LIQUIDITY'),
  );

  if (liquidityEvents.length > 0) {
    const liquidityParams = liquidityEvents.map(event => ({
      moduleName: event.module,
      name: event.name,
      parameterText: JSON.stringify(event.params),
      parameters: JSON.stringify(event.params),
      qualifiedName: event.qualname,
      chainId: event.chainId,
      transactionId: event.transactionId,
      requestkey: event.requestkey,
    }));
    await PairService.processLiquidityEvents(liquidityParams);
  }

  const exchangeTokenEvents = events.filter(
    event => MODULE_NAMES.includes(event.module) && EXCHANGE_TOKEN_EVENTS.includes(event.name),
  );

  if (exchangeTokenEvents.length > 0) {
    const exchangeTokenParams = exchangeTokenEvents.map(event => ({
      moduleName: event.module,
      name: event.name,
      parameterText: JSON.stringify(event.params),
      parameters: JSON.stringify(event.params),
      qualifiedName: event.qualname,
      chainId: event.chainId,
      transactionId: event.transactionId,
      requestkey: event.requestkey,
    }));
    await PairService.processExchangeTokenEvents(exchangeTokenParams);
  }
}

/**
 * Backfill function to process historical events from the database
 * @param startBlock Optional starting block number
 * @param endBlock Optional ending block number
 * @param batchSize Number of events to process in each batch
 */
export async function backfillPairEvents(
  startBlock?: number,
  endBlock?: number,
  batchSize: number = 1000,
): Promise<void> {
  if (LAST_BLOCK_ID === null) {
    throw new Error('BACKFILL_PAIR_EVENTS_LAST_BLOCK_ID is not set');
  }

  const whereClause: WhereOptions<EventAttributes> = {
    module: {
      [Op.in]: MODULE_NAMES,
    },
    name: {
      [Op.in]: [...EVENT_TYPES, ...EXCHANGE_TOKEN_EVENTS],
    },
  };

  if (startBlock) {
    whereClause['$transaction.blockId$'] = {
      [Op.gte]: startBlock,
    };
  }

  if (endBlock) {
    whereClause['$transaction.blockId$'] = {
      ...whereClause['$transaction.blockId$'],
      [Op.lte]: endBlock,
    };
  }

  let processedCount = 0;
  let hasMore = true;

  while (hasMore) {
    const startTime = Date.now();
    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: ['blockId', 'creationtime'],
        },
      ],
      limit: batchSize,
      offset: processedCount,
      order: [[{ model: Transaction, as: 'transaction' }, 'creationtime', 'ASC']],
    });
    if (events.length === 0) {
      hasMore = false;
      continue;
    }

    const progressPercentage = ((processedCount / LAST_BLOCK_ID) * 100).toFixed(2);
    console.log(
      `Processing batch of ${events.length} events starting from offset ${processedCount} (${progressPercentage}% complete)`,
    );
    await processPairCreationEvents(
      events.map(event => event.get({ plain: true })),
      null,
    );
    processedCount += events.length;

    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // Convert to seconds
    console.log(`Batch processed in ${timeTaken.toFixed(2)} seconds`);

    if (events.length < batchSize) {
      hasMore = false;
    }
  }

  console.log(`Backfill completed. Processed ${processedCount} events.`);
}
