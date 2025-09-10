/**
 * Database implementation of the EventRepository interface
 *
 * This file provides a concrete implementation of the EventRepository interface
 * for retrieving blockchain event data from the PostgreSQL database. Events
 * represent state changes and notifications emitted during transaction execution
 * on the Kadena blockchain.
 *
 * The implementation includes support for:
 * - Retrieving individual events by block hash and transaction identifiers
 * - Querying events by qualified name (module.name format)
 * - Supporting paginated access with cursor-based navigation
 * - Filtering events by various criteria including block, chain, and height ranges
 * - Counting events for statistics and pagination
 */

import { rootPgPool } from '../../../../config/database';
import { PageInfo } from '../../../config/graphql-types';
import EventRepository, {
  EventOutput,
  GetBlockEventsParams,
  GetEventParams,
  GetEventsParams,
  GetLastEventsParams,
  GetTotalEventsCount,
  GetTotalTransactionEventsCount,
  GetTransactionEventsParams,
} from '../../application/event-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';
import { ConnectionEdge } from '../../types';
import { eventValidator } from '../schema-validator/event-schema-validator';
import EventQueryBuilder from '../query-builders/event-query-builder';
import BlockDbRepository from './block-db-repository';
import { isNullOrUndefined } from '@/utils/helpers';

/**
 * Database implementation of the EventRepository interface
 *
 * This class provides methods to access and query blockchain event data
 * stored in the PostgreSQL database. It handles the complex SQL queries
 * needed to join events with their related transactions and blocks,
 * while providing rich filtering, pagination, and counting capabilities.
 */
export default class EventDbRepository implements EventRepository {
  private queryBuilder = new EventQueryBuilder();

  /**
   * Retrieves a specific event by its block hash, request key, and order index
   *
   * This method fetches a single event from the database using its unique
   * identifying criteria: the block hash it belongs to, the transaction's
   * request key, and the order index within that transaction.
   *
   * @param params - Object containing hash (block hash), requestKey, and orderIndex
   * @returns Promise resolving to the event data if found
   */
  async getEvent(params: GetEventParams): Promise<EventOutput> {
    const { hash, requestKey, orderIndex } = params;
    const queryParams = [hash, requestKey, orderIndex];

    const query = `
      SELECT e.id as id,
        e.name as name,
        e.requestkey as "requestKey",
        b."chainId" as "chainId",
        b.height as height,
        e."orderIndex" as "orderIndex",
        e.module as "moduleName",
        e.params as parameters,
        b.hash as "blockHash"
      FROM "Blocks" b
      JOIN "Transactions" t ON b.id = t."blockId"
      JOIN "Events" e ON t.id = e."transactionId"
      WHERE b.hash = $1
      AND e.requestkey = $2
      AND e."orderIndex" = $3
      LIMIT 1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const output = eventValidator.validate(rows[0]);
    return output;
  }

  /**
   * Retrieves events from a specific block with pagination support
   *
   * This method fetches events that occurred in a specific block,
   * supporting cursor-based pagination for efficient navigation through
   * large result sets. Results are ordered by event ID.
   *
   * @param params - Object containing block hash and pagination parameters
   * @returns Promise resolving to page info and event edges
   */
  async getBlockEvents(params: GetBlockEventsParams) {
    const { hash, after: afterEncoded, before: beforeEncoded, first, last } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const queryParams = [limit, hash];

    let conditions = '';

    if (before) {
      queryParams.push(before);
      conditions += `\nAND e.id > $3`;
    }

    if (after) {
      queryParams.push(after);
      conditions += `\nAND e.id < $3`;
    }

    const query = `
      SELECT e.id as id,
        e.name as name,
        e.requestkey as "requestKey",
        b."chainId" as "chainId",
        b.height as height,
        e."orderIndex" as "orderIndex",
        e.module as "moduleName",
        e.params as parameters,
        e.creationtime as "creationTime",
        b.hash as "blockHash"
      FROM "Blocks" b
      JOIN "Transactions" t ON b.id = t."blockId"
      JOIN "Events" e ON t.id = e."transactionId"
      WHERE b.hash = $2
      ${conditions}
      ORDER BY e.id ${order}
      LIMIT $1;
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: `${row.creationTime}:${row.id}`,
      node: eventValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Counts the total number of events in a specific block
   *
   * This method performs a COUNT query to determine how many events
   * are associated with a particular block, which is useful for
   * pagination metadata and analytics.
   *
   * @param hash - The block hash to count events for
   * @returns Promise resolving to the total count of events in the block
   */
  async getTotalCountOfBlockEvents(hash: string): Promise<number> {
    const totalCountQuery = `
      SELECT COUNT(*) as count
      FROM "Blocks" b
      JOIN "Transactions" t ON b.id = t."blockId"
      JOIN "Events" e ON t.id = e."transactionId"
      WHERE b.hash = $1
    `;

    const { rows: countResult } = await rootPgPool.query(totalCountQuery, [hash]);

    const totalCount = parseInt(countResult[0].count, 10);
    return totalCount;
  }

  /**
   * Retrieves events by their qualified name with extensive filtering options
   *
   * This method provides a powerful way to query events by their module.name
   * qualified name, with support for numerous filtering criteria including:
   * - Block hash filtering
   * - Chain ID filtering
   * - Height range filtering (min/max height)
   * - Confirmation depth filtering
   * - Request key filtering
   *
   * Results are paginated and can be navigated using cursor-based pagination.
   *
   * @param params - Object containing qualified event name and various filtering options
   * @returns Promise resolving to page info and event edges
   */
  async getEvents(
    params: GetEventsParams,
  ): Promise<{ pageInfo: PageInfo; edges: ConnectionEdge<EventOutput>[] }> {
    const {
      qualifiedEventName,
      moduleName,
      blockHash,
      chainId,
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
      minHeight,
      maxHeight,
      minimumDepth,
      requestKey,
    } = params;

    if (qualifiedEventName && moduleName) {
      throw new Error('qualifiedEventName and moduleName cannot be used together.');
    }

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    // If no minimumDepth is specified, we can use the normal query approach
    if (!minimumDepth) {
      const { query, queryParams } = this.queryBuilder.buildEventQuery({
        qualifiedEventName,
        module: moduleName,
        limit,
        order,
        after,
        before,
        blockHash,
        chainId,
        minHeight,
        maxHeight,
        requestKey,
      });

      const { rows } = await rootPgPool.query(query, queryParams);

      const edges = rows.map(row => ({
        cursor: `${row.creationTime}:${row.id}`,
        node: eventValidator.validate(row),
      }));

      return getPageInfo({ edges, order, limit, after, before });
    }

    let allFilteredEvents: any[] = [];
    let lastCursor: string | null = afterEncoded ?? null;
    let hasMoreEvents = true;
    const batchSize = Math.max(limit * 3, 50); // Fetch more than needed for depth filtering

    // Continue fetching batches until we have enough events that meet depth requirement
    while (allFilteredEvents.length < limit && hasMoreEvents) {
      const { query, queryParams } = this.queryBuilder.buildEventQuery({
        qualifiedEventName,
        module: moduleName,
        limit: batchSize,
        order,
        after: afterEncoded,
        before: beforeEncoded,
        blockHash,
        chainId,
        minHeight,
        maxHeight,
        requestKey,
      });

      const { rows: eventBatch } = await rootPgPool.query(query, queryParams);

      hasMoreEvents = eventBatch.length === batchSize;

      if (eventBatch.length === 0) {
        break; // No more events to process
      }

      // Extract block hashes and get depth map
      const blockHashes = Array.from(new Set(eventBatch.map(event => event.blockHash)));
      const blockRepository = new BlockDbRepository();
      const blockHashToDepth = await blockRepository.createBlockDepthMap(
        blockHashes.map(hash => ({ hash })),
        'hash',
        minimumDepth,
      );

      // Filter events by block depth
      const filteredBatch = eventBatch.filter(
        event => blockHashToDepth[event.blockHash] >= minimumDepth,
      );

      allFilteredEvents = [...allFilteredEvents, ...filteredBatch];

      // Update cursor for next batch
      if (eventBatch.length > 0) {
        const lastEvent = eventBatch[eventBatch.length - 1];
        lastCursor = `${lastEvent.creationTime}:${lastEvent.id}`;
      }
    }

    // Create edges for paginated result
    const edges = allFilteredEvents.slice(0, limit).map(event => ({
      cursor: `${event.creationTime}:${event.id}`,
      node: eventValidator.validate(event),
    }));

    return getPageInfo({ edges, order, limit, after, before });
  }

  /**
   * Counts the total number of events matching specific filter criteria
   *
   * This method performs a COUNT query to determine how many events
   * match a given set of filtering criteria, including qualified name,
   * block hash, chain ID, and height ranges.
   *
   * @param params - Object containing filtering criteria for events
   * @returns Promise resolving to the total count of matching events
   */
  async getTotalEventsCount(params: GetTotalEventsCount): Promise<number> {
    const {
      qualifiedEventName,
      moduleName,
      blockHash,
      chainId,
      minHeight,
      maxHeight,
      requestKey,
      minimumDepth,
    } = params;

    const queryParams: (string | number)[] = [];
    let conditions = '';

    const localOperator = (paramsLength: number) => (paramsLength > 1 ? `\nAND` : '\nWHERE');

    const isJoinBlock =
      !isNullOrUndefined(blockHash) ||
      !isNullOrUndefined(minHeight) ||
      !isNullOrUndefined(maxHeight) ||
      !isNullOrUndefined(minimumDepth);
    const isJoinTransaction = !isNullOrUndefined(requestKey) || isJoinBlock;
    let totalCountQuery = `
      select count (*) as count
      from "Events" e
    `;

    if (isJoinBlock) {
      totalCountQuery += `\njoin "Transactions" t on e."transactionId" = t.id`;
      totalCountQuery += `\n join "Blocks" b on b.id = t."blockId"`;
    } else if (isJoinTransaction) {
      totalCountQuery += `\njoin "Transactions" t on e."transactionId" = t.id`;
    }

    if (qualifiedEventName) {
      const splitted = qualifiedEventName.split('.');
      const name = splitted.pop() ?? '';
      const module = splitted.join('.');

      queryParams.push(module);
      const opModule = localOperator(queryParams.length);
      conditions += `${opModule} e.module = $${queryParams.length}`;
      queryParams.push(name);
      const opName = localOperator(queryParams.length);
      conditions += `${opName} e.name = $${queryParams.length}`;
    }

    if (moduleName) {
      queryParams.push(moduleName);
      const opModule = localOperator(queryParams.length);
      conditions += `${opModule} e.module = $${queryParams.length}`;
    }

    if (blockHash) {
      queryParams.push(blockHash);
      const opBlockHash = localOperator(queryParams.length);
      conditions += `${opBlockHash} b.hash = $${queryParams.length}`;
    }

    if (chainId) {
      queryParams.push(chainId);
      const opChainId = localOperator(queryParams.length);
      conditions += `${opChainId} e."chainId" = $${queryParams.length}`;
    }

    if (minHeight) {
      queryParams.push(minHeight);
      const opMinHeight = localOperator(queryParams.length);
      conditions += `${opMinHeight} b."height" >= $${queryParams.length}`;
    }

    if (maxHeight) {
      queryParams.push(maxHeight);
      const opMaxHeight = localOperator(queryParams.length);
      conditions += `${opMaxHeight} b."height" <= $${queryParams.length}`;
    }

    if (minimumDepth) {
      queryParams.push(minimumDepth);
      const opMinimumDepth = localOperator(queryParams.length);
      conditions += `${opMinimumDepth} b."height" <= $${queryParams.length}`;
    }

    if (requestKey) {
      queryParams.push(requestKey);
      const opRequestKey = localOperator(queryParams.length);
      conditions += `${opRequestKey} t.requestkey = $${queryParams.length}`;
    }

    totalCountQuery += `\n${conditions}`;

    const { rows: countResult } = await rootPgPool.query(totalCountQuery, queryParams);
    const totalCount = parseInt(countResult[0].count, 10);
    return totalCount;
  }

  /**
   * Retrieves events from a specific transaction with pagination support
   *
   * This method fetches events that were emitted during the execution of a
   * specific transaction, supporting cursor-based pagination for efficient
   * navigation through large result sets.
   *
   * @param params - Object containing transaction ID and pagination parameters
   * @returns Promise resolving to page info and event edges
   */
  async getTransactionEvents(
    params: GetTransactionEventsParams,
  ): Promise<{ pageInfo: PageInfo; edges: ConnectionEdge<EventOutput>[] }> {
    const { transactionId, after: afterEncoded, before: beforeEncoded, first, last } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const queryParams: (string | number)[] = [limit, transactionId];
    let conditions = '';

    if (after) {
      queryParams.push(after);
      conditions += `\nAND e.id < $3`;
    }

    if (before) {
      queryParams.push(before);
      conditions += `\nAND e.id > $3`;
    }

    const query = `
      select e.id as id,
        e.requestkey as "requestKey",
        b."chainId" as "chainId",
        b.height as height,
        e.module as "moduleName",
        e."orderIndex" as "orderIndex",
        e.name as name,
        e.params as parameters,
        e.creationtime as "creationTime",
        b.hash as "blockHash"
      from "Events" e
      join "Transactions" t on e."transactionId" = t.id 
      join "Blocks" b on b.id = t."blockId"
      where t.id = $2
      ${conditions}
      ORDER BY id ${order}
      LIMIT $1
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const edges = rows.map(row => ({
      cursor: `${row.creationTime}:${row.id}`,
      node: eventValidator.validate(row),
    }));

    const pageInfo = getPageInfo({ edges, order, limit, after, before });
    return pageInfo;
  }

  /**
   * Counts the total number of events in a specific transaction
   *
   * This method performs a COUNT query to determine how many events
   * were emitted during the execution of a specific transaction.
   *
   * @param params - Object containing the transaction ID
   * @returns Promise resolving to the total count of events in the transaction
   */
  async getTotalTransactionEventsCount(params: GetTotalTransactionEventsCount) {
    const { transactionId } = params;

    const queryParams: (string | number)[] = [transactionId];

    const totalCountQuery = `
      SELECT t.num_events as count
      FROM "Transactions" t
      WHERE t.id = $1
    `;

    const { rows: countResult } = await rootPgPool.query(totalCountQuery, queryParams);
    const totalCount = parseInt(countResult[0].count, 10);
    return totalCount;
  }

  /**
   * Retrieves the ID of the most recent event in the database
   *
   * This method is useful for tracking the latest events for subscription
   * and real-time update features, allowing clients to efficiently fetch
   * only new events since their last query.
   *
   * @returns Promise resolving to the ID of the most recent event
   */
  async getLastEventId(): Promise<number> {
    const query = `SELECT last_value AS "lastValue" from "Events_id_seq"`;
    const { rows } = await rootPgPool.query(query);
    const totalCount = parseInt(rows[0].lastValue, 10);
    return totalCount;
  }

  /**
   * Retrieves recent events matching specific criteria
   *
   * This method fetches events that occurred after a specific event ID
   * and match additional criteria such as qualified name and chain ID.
   * It's particularly useful for subscription features that need to
   * track recent events.
   *
   * @param params - Object containing filtering criteria and last event ID
   * @returns Promise resolving to an array of matching events
   */
  async getLastEvents({
    qualifiedEventName,
    lastEventId,
    chainId,
    quantity,
    minimumDepth,
  }: GetLastEventsParams) {
    const queryParams = [];
    let conditions = '';
    let limitCondition = lastEventId ? 'LIMIT 5' : `LIMIT ${quantity}`;

    const splitted = qualifiedEventName.split('.');
    const name = splitted.pop() ?? '';
    const module = splitted.join('.');

    queryParams.push(module);
    conditions += `WHERE e.module = $${queryParams.length}`;
    queryParams.push(name);
    conditions += `\nAND e.name = $${queryParams.length}`;

    if (lastEventId) {
      queryParams.push(lastEventId);
      conditions += `\nAND e.id > $${queryParams.length}`;
    }

    if (chainId) {
      queryParams.push(parseInt(chainId));
      conditions += `\nAND b."chainId" = $${queryParams.length}`;
    }

    const query = `
      SELECT e.id as id,
        e.requestkey as "requestKey",
        b."chainId" as "chainId",
        b.height as height,
        e.module as "moduleName",
        e."orderIndex" as "orderIndex",
        e.name as name,
        e.params as parameters,
        b.hash as "blockHash"
      FROM "Events" e
      JOIN "Transactions" t ON e."transactionId" = t.id
      JOIN "Blocks" b ON b.id = t."blockId"
      ${conditions}
      ORDER BY e.id DESC
      ${limitCondition}
    `;

    const { rows } = await rootPgPool.query(query, queryParams);

    const events = rows.map(e => eventValidator.validate(e));

    return events;
  }
}
