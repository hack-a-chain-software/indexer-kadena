import PactCodeParser from './pact-parser';
import { sequelize } from '../config/database';
import { QueryTypes, Transaction } from 'sequelize';

/**
 * Service for integrating Pact code search functionality into the ingestion pipeline
 */
export class PactCodeSearchService {
  /**
   * Process a single transaction's code and extract searchable arguments
   * @param requestkey - The transaction request key
   * @param code - The Pact code to parse
   * @param transaction - Optional Sequelize transaction for atomicity
   */
  public static async processTransactionCode(
    requestkey: string,
    code: any,
    transaction?: Transaction,
  ): Promise<void> {
    try {
      // Skip if no code or empty code
      if (!code || Object.keys(code).length === 0) {
        return;
      }

      // Extract Pact code string from the code object
      const pactCodeString = this.extractPactCodeString(code);
      if (!pactCodeString) {
        return;
      }

      // Parse the Pact code to extract arguments
      const args = PactCodeParser.parsePactCode(pactCodeString);
      if (args.length === 0) {
        return;
      }

      // Insert the arguments and relations
      await this.insertArgsAndRelations(requestkey, args, transaction);
    } catch (error) {
      console.error(`[ERROR][PACT_SEARCH] Failed to process code for ${requestkey}:`, error);
      // Don't throw - we don't want to break the main pipeline
    }
  }

  /**
   * Extract Pact code string from code object (same logic as backfill service)
   */
  private static extractPactCodeString(codeJsonb: any): string | null {
    if (!codeJsonb) return null;

    // Handle different possible structures
    if (typeof codeJsonb === 'string') {
      return codeJsonb;
    }

    if (typeof codeJsonb === 'object') {
      // Try common code field names
      if (codeJsonb.code) return codeJsonb.code;
      if (codeJsonb.pact) return codeJsonb.pact;
      if (codeJsonb.exec && codeJsonb.exec.code) return codeJsonb.exec.code;

      // If it's a single key-value pair, try the value
      const keys = Object.keys(codeJsonb);
      if (keys.length === 1 && typeof codeJsonb[keys[0]] === 'string') {
        return codeJsonb[keys[0]];
      }
    }

    return null;
  }

  /**
   * Insert unique args and create relations (optimized for single transaction)
   */
  private static async insertArgsAndRelations(
    requestkey: string,
    args: string[],
    transaction?: Transaction,
  ): Promise<void> {
    if (args.length === 0) return;

    // 1. Insert unique args into CodeSearch (with conflict resolution)
    for (const arg of args) {
      const escapedArg = arg.replace(/'/g, "''");

      const insertArgsQuery = `
        INSERT INTO "CodeSearch" (arg, created_at, updated_at)
        VALUES ('${escapedArg}', NOW(), NOW())
        ON CONFLICT (arg) DO NOTHING
      `;

      try {
        await sequelize.query(insertArgsQuery, { transaction });
      } catch (error) {
        console.error(
          `[ERROR][PACT_SEARCH] Failed to insert arg: ${arg.substring(0, 100)}...`,
          error,
        );
        // Continue with other args
      }
    }

    // 2. Get the PKs for all args we need
    const argPksQuery = `
      SELECT pk, arg FROM "CodeSearch" 
      WHERE arg = ANY($1)
    `;

    const argPks = (await sequelize.query(argPksQuery, {
      bind: [args],
      type: QueryTypes.SELECT,
      transaction,
    })) as Array<{ pk: number; arg: string }>;

    if (argPks.length === 0) return;

    // 3. Insert relations one by one
    const escapedRequestKey = requestkey.replace(/'/g, "''");

    for (const argPk of argPks) {
      const insertRelationQuery = `
        INSERT INTO "Transaction_CodeSearch" (requestkey, args_fk, created_at, updated_at)
        VALUES ('${escapedRequestKey}', ${argPk.pk}, NOW(), NOW())
        ON CONFLICT (requestkey, args_fk) DO NOTHING
      `;

      try {
        await sequelize.query(insertRelationQuery, { transaction });
      } catch (error) {
        console.error(
          `[ERROR][PACT_SEARCH] Failed to insert relation for ${requestkey}:${argPk.arg}`,
          error,
        );
        // Continue with other relations
      }
    }
  }
}

export default PactCodeSearchService;
