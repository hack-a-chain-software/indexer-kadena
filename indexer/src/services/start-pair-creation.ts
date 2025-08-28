import { rootPgPool, sequelize } from '@/config/database';
import Block from '@/models/block';
import Event, { EventAttributes } from '@/models/event';
import Transaction from '@/models/transaction';
import { processPairCreationEvents } from '@/services/pair';
import { isNullOrUndefined } from '@/utils/helpers';
import { Op, Transaction as SeqTransaction } from 'sequelize';

let lastHeightProcessed: number | null = null;
const BLOCK_DEPTH = 6;

export async function startPairCreation() {
  let pairCreationTx: SeqTransaction;
  let events: EventAttributes[] = [];
  let currentHeight: number;

  const startTime = Date.now();
  try {
    const result: any = await rootPgPool.query('SELECT max(height) FROM "Blocks"');
    const maxHeight = result.rows?.[0].max;

    if (isNullOrUndefined(maxHeight)) {
      console.error('[ERROR][DATA][DATA_CORRUPT] Failed to get max height from database');
      return;
    }

    // maxheight = 66; currentheight = 60; lastheightprocessed = 58
    // [60, 61]
    currentHeight = maxHeight - BLOCK_DEPTH;
    if (lastHeightProcessed === null) {
      lastHeightProcessed = currentHeight - 10;
    }

    if (currentHeight - lastHeightProcessed <= 0) {
      console.info('[INFO][SYNC][STREAMING] No new blocks to process', {
        lastHeightProcessed,
        currentHeight,
      });
      return;
    }

    events = await Event.findAll({
      include: [
        {
          model: Transaction,
          as: 'transaction',
          include: [
            {
              model: Block,
              where: {
                height: {
                  [Op.gt]: 6121875,
                  [Op.lte]: 6121875,
                },
              },
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('[ERROR][DATA][DATA_CORRUPT] Failed to get events:', error);
    return;
  }

  try {
    pairCreationTx = await sequelize.transaction();
  } catch (error) {
    console.error('[ERROR][DATA][DATA_CORRUPT] Failed to create pair creation transaction:', error);
    return;
  }

  try {
    await processPairCreationEvents(events, pairCreationTx);
    await pairCreationTx.commit();
    console.info('[INFO][SYNC][STREAMING] Pair creation events processed', {
      lastHeightProcessed,
      currentHeight,
    });
    console.info(
      '[INFO][SYNC][STREAMING] Pair creation events processed in',
      Date.now() - startTime,
      'ms',
    );
    lastHeightProcessed = currentHeight;
  } catch (error) {
    await pairCreationTx.rollback();
    console.error('[ERROR][DATA][DATA_CORRUPT] Error processing pair creation events:', error);
  }
}
