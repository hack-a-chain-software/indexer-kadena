import { rootPgPool, sequelize } from '@/config/database';
import { EventAttributes } from '@/models/event';
import {
  EVENT_TYPES,
  EXCHANGE_TOKEN_EVENTS,
  MODULE_NAMES,
  processPairCreationEvents,
} from '@/services/pair';
import { isNullOrUndefined } from '@/utils/helpers';
import { Transaction as SeqTransaction } from 'sequelize';

let lastHeightProcessed: number | null = null;
const BLOCK_DEPTH = 6;

export async function startPairCreation() {
  let pairCreationTx: SeqTransaction;
  let events: EventAttributes[] = [];
  let currentHeight: number;

  try {
    const result: any = await rootPgPool.query('SELECT max(height) FROM "Blocks"');
    const maxHeight = result.rows?.[0].max;

    if (isNullOrUndefined(maxHeight)) {
      console.error('[ERROR][DATA][DATA_CORRUPT] Failed to get max height from database');
      return;
    }

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

    const EVENT_NAMES = [...EVENT_TYPES, ...EXCHANGE_TOKEN_EVENTS];
    const queryParams = [lastHeightProcessed, currentHeight, EVENT_NAMES, MODULE_NAMES];
    const query = `
      SELECT
        e.id,
        e."transactionId",
        e."chainId",
        e.module,
        e.name,
        e.params,
        e.qualname,
        e.requestkey,
        e."orderIndex"
      FROM "Events" e
      JOIN "Transactions" t ON t.id = e."transactionId"
      JOIN "Blocks" b ON b.id = t."blockId"
      WHERE b.height > $1 AND b.height <= $2
      AND e."name" = ANY($3::text[])
      AND e."module" = ANY($4::text[])
    `;

    const eventsResult = await rootPgPool.query(query, queryParams);

    events = eventsResult.rows.map(r => {
      return {
        name: r.name,
        module: r.module,
        params: r.params,
        transactionId: r.transactionId,
        blockId: r.blockId,
        height: r.height,
        createdAt: r.createdAt,
        chainId: r.chainId,
        qualname: r.qualname,
        requestkey: r.requestkey,
        orderIndex: r.orderIndex,
        id: r.id,
      };
    }) as EventAttributes[];
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
    lastHeightProcessed = currentHeight;
  } catch (error) {
    await pairCreationTx.rollback();
    console.error('[ERROR][DATA][DATA_CORRUPT] Error processing pair creation events:', error);
  }
}
