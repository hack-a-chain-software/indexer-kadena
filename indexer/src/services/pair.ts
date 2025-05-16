import { EventAttributes } from '../models/event';
import Event from '../models/event';
import { PairService } from './pair-service';
import { sequelize } from '../config/database';
import { Op } from 'sequelize';
import Transaction from '../models/transaction';

const MODULE_NAMES = ['kdlaunch.kdswap-exchange', 'sushiswap.sushi-exchange'];
const EVENT_TYPES = ['CREATE_PAIR', 'UPDATE', 'SWAP', 'ADD_LIQUIDITY', 'REMOVE_LIQUIDITY'];

/**
 * Process pair creation events from transaction events
 * @param events Array of events from a transaction
 */
export async function processPairCreationEvents(events: EventAttributes[]): Promise<void> {
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
    console.log('pairUpdateEvents', pairUpdateEvents);
    const updateParams = pairUpdateEvents.map(event => ({
      moduleName: event.module,
      name: event.name,
      parameterText: JSON.stringify(event.params),
      parameters: JSON.stringify(event.params),
      qualifiedName: event.qualname,
      chainId: event.chainId,
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
  const whereClause: any = {
    module: {
      [Op.in]: MODULE_NAMES,
    },
    name: {
      [Op.in]: EVENT_TYPES,
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

  console.log('whereClause', whereClause);

  while (hasMore) {
    const events = await Event.findAll({
      where: whereClause,
      include: [
        {
          model: Transaction,
          as: 'transaction',
          attributes: ['blockId'],
        },
      ],
      limit: batchSize,
      offset: processedCount,
      order: [[sequelize.literal('"transaction"."blockId"'), 'ASC']],
    });

    console.log('events', events);
    if (events.length === 0) {
      hasMore = false;
      continue;
    }

    console.log(
      `Processing batch of ${events.length} events starting from offset ${processedCount}`,
    );
    await processPairCreationEvents(events.map(event => event.get({ plain: true })));
    processedCount += events.length;

    if (events.length < batchSize) {
      hasMore = false;
    }
  }

  console.log(`Backfill completed. Processed ${processedCount} events.`);
}
