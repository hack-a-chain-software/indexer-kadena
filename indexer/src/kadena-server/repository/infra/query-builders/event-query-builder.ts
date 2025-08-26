/**
 * Specialized class for building SQL queries related to blockchain events
 *
 * This class encapsulates the complex logic for constructing SQL queries
 * to retrieve events from the database with various filtering criteria.
 */
export default class EventQueryBuilder {
  /**
   * Builds the SQL query for fetching events with various filtering options
   *
   * @param params - Object containing parameters needed to build the query
   * @returns Object containing the query string and parameters array
   */
  buildEventQuery(params: {
    qualifiedEventName?: string | null;
    module?: string | null;
    limit: number;
    order: string;
    after?: string | null;
    before?: string | null;
    blockHash?: string | null;
    chainId?: string | null;
    minHeight?: number | null;
    maxHeight?: number | null;
    requestKey?: string | null;
  }) {
    const {
      qualifiedEventName,
      module,
      limit,
      order,
      after,
      before,
      blockHash,
      chainId,
      minHeight,
      maxHeight,
      requestKey,
    } = params;

    const queryParams: (string | number)[] = [limit];
    let conditions = '';

    const localOperator = (paramsLength: number) => (paramsLength > 2 ? `\nAND` : '\nWHERE');

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

    if (module) {
      queryParams.push(module);
      const op = localOperator(queryParams.length);
      conditions += `${op} e.module = $${queryParams.length}`;
    }

    if (after) {
      const [creationtime, id] = after.split(':');
      queryParams.push(creationtime);
      const op = localOperator(queryParams.length);
      queryParams.push(id);
      conditions += `${op} (e.creationtime, e.id) < ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (before) {
      const [creationtime, id] = before.split(':');
      queryParams.push(creationtime);
      const op = localOperator(queryParams.length);
      queryParams.push(id);
      conditions += `${op} (e.creationtime, e.id) > ($${queryParams.length - 1}, $${queryParams.length})`;
    }

    if (blockHash) {
      queryParams.push(blockHash);
      const op = localOperator(queryParams.length);
      conditions += `${op} b.hash = $${queryParams.length}`;
    }

    if (requestKey) {
      queryParams.push(requestKey);
      const op = localOperator(queryParams.length);
      conditions += `${op} t."requestkey" = $${queryParams.length}`;
    }

    if (chainId) {
      queryParams.push(chainId);
      const op = localOperator(queryParams.length);
      conditions += `${op} e."chainId" = $${queryParams.length}`;
    }

    if (minHeight) {
      queryParams.push(minHeight);
      const op = localOperator(queryParams.length);
      conditions += `${op} b."height" >= $${queryParams.length}`;
    }

    if (maxHeight) {
      queryParams.push(maxHeight);
      const op = localOperator(queryParams.length);
      conditions += `${op} b."height" <= $${queryParams.length}`;
    }

    const query = `
      SELECT
        e.id as id,
        e.creationtime as "creationTime",
        e.requestkey as "requestKey",
        e."chainId" as "chainId",
        b.height as height,
        e."orderIndex" as "orderIndex",
        e.module as "moduleName",
        e.name as name,
        e.params as parameters,
        b.hash as "blockHash"
      FROM "Events" e
      join "Transactions" t ON t.id = e."transactionId"
      join "Blocks" b ON b.id = t."blockId"
      ${conditions}
      ORDER BY e.creationtime ${order}, e.id ${order}
      LIMIT $1
    `;

    return { query, queryParams };
  }
}
