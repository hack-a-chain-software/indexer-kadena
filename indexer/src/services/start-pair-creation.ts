import { rootPgPool, sequelize } from '@/config/database';
import Block from '@/models/block';
import Event, { EventAttributes } from '@/models/event';
import Transaction from '@/models/transaction';
import { processPairCreationEvents } from '@/services/pair';
import { Op, Transaction as SeqTransaction } from 'sequelize';

let lastHeight: number | null = null;
const BLOCK_DEPTH = 6;

export async function startPairCreation() {
  let pairCreationTx: SeqTransaction;
  let events: EventAttributes[] = [];
  let currentHeight: number;
  try {
    const result: any = await rootPgPool.query('SELECT max(height) FROM "Blocks"');
    const maxHeight = result.rows?.[0].max;
    currentHeight = maxHeight - BLOCK_DEPTH;

    if (lastHeight === null) {
      lastHeight = currentHeight - 10;
    }

    if (currentHeight - lastHeight <= 0) {
      console.info('[INFO][SYNC][STREAMING] No new blocks to process');
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
                  [Op.gt]: lastHeight,
                  [Op.lte]: currentHeight,
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
    lastHeight = currentHeight;
  } catch (error) {
    await pairCreationTx.rollback();
    console.error('[ERROR][DATA][DATA_CORRUPT] Error processing pair creation events:', error);
  }
}
