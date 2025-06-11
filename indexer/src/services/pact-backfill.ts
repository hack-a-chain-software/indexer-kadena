import { sequelize } from '../config/database';
import PactCodeParser from './pact-parser';
import { QueryTypes } from 'sequelize';

export interface BackfillOptions {
  startBlockHeight?: number;
  endBlockHeight?: number;
  startDate?: Date;
  endDate?: Date;
  chainId?: number;
}

export interface BackfillStats {
  totalRecords: number;
  processedRecords: number;
  extractedArgsCount: number;
  errorCount: number;
  startTime: Date;
  endTime?: Date;
  batchSize: number;
  options: BackfillOptions;
}

export interface BackfillProgress {
  currentBatch: number;
  totalBatches: number;
  percentage: number;
  recordsPerSecond: number;
  estimatedTimeRemaining: string;
}

export class PactBackfillService {
  private stats: BackfillStats;
  private readonly batchSize: number;
  private readonly options: BackfillOptions;

  constructor(batchSize: number = 100, options: BackfillOptions = {}) {
    this.batchSize = batchSize;
    this.options = options;
    this.stats = {
      totalRecords: 0,
      processedRecords: 0,
      extractedArgsCount: 0,
      errorCount: 0,
      startTime: new Date(),
      batchSize,
      options,
    };
  }

  /**
   * Main backfill function - processes all existing TransactionDetails records
   */
  public async startBackfill(): Promise<BackfillStats> {
    console.info('[INFO][BACKFILL] Starting Pact code backfill process...');

    try {
      // Log filtering options
      this.logFilteringOptions();

      // Get total count for progress tracking
      this.stats.totalRecords = await this.getTotalRecordCount();
      console.info(
        `[INFO][BACKFILL] Found ${this.stats.totalRecords} TransactionDetails records to process`,
      );

      if (this.stats.totalRecords === 0) {
        console.info('[INFO][BACKFILL] No records to process');
        return this.stats;
      }

      const totalBatches = Math.ceil(this.stats.totalRecords / this.batchSize);
      let currentBatch = 0;

      // Process records in batches
      while (this.stats.processedRecords < this.stats.totalRecords) {
        currentBatch++;
        const offset = (currentBatch - 1) * this.batchSize;

        await this.processBatch(offset, currentBatch, totalBatches);

        // Log progress every 10 batches
        if (currentBatch % 10 === 0) {
          this.logProgress(currentBatch, totalBatches);
        }
      }

      this.stats.endTime = new Date();
      this.logFinalStats();

      return this.stats;
    } catch (error) {
      console.error('[ERROR][BACKFILL] Fatal error during backfill:', error);
      this.stats.endTime = new Date();
      throw error;
    }
  }

  /**
   * Get total count of TransactionDetails records with non-null code
   */
  private async getTotalRecordCount(): Promise<number> {
    const { whereClause, bindings } = this.buildWhereClause();

    const query = `
      SELECT COUNT(*) as total 
      FROM "TransactionDetails" td
      JOIN "Transactions" t ON td."transactionId" = t.id
      JOIN "Blocks" b ON t."blockId" = b.id
      WHERE td.code IS NOT NULL 
      AND td.code != '{}'::jsonb
      ${whereClause}
    `;

    const result = (await sequelize.query(query, {
      bind: bindings,
      type: QueryTypes.SELECT,
      plain: true,
    })) as any;

    return parseInt(result.total);
  }

  /**
   * Process a single batch of records
   */
  private async processBatch(
    offset: number,
    currentBatch: number,
    totalBatches: number,
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Fetch batch of TransactionDetails with Transaction requestkey
      const records = await this.fetchBatch(offset);

      if (records.length === 0) {
        await transaction.commit();
        return;
      }

      // Process each record and extract args
      const argsToInsert = new Map<string, number>(); // arg -> count
      const relationsToInsert: Array<{ requestKey: string; args: string[] }> = [];

      for (const record of records) {
        try {
          const pactCode = this.extractPactCodeString(record.code);
          if (pactCode) {
            const extractedArgs = PactCodeParser.parsePactCode(pactCode);

            if (extractedArgs.length > 0) {
              // Count unique args
              extractedArgs.forEach(arg => {
                argsToInsert.set(arg, (argsToInsert.get(arg) || 0) + 1);
              });

              relationsToInsert.push({
                requestKey: record.requestkey,
                args: extractedArgs,
              });

              this.stats.extractedArgsCount += extractedArgs.length;
            }
          }
        } catch (error) {
          console.error(`[ERROR][BACKFILL] Error processing record ${record.requestkey}:`, error);
          this.stats.errorCount++;
        }
      }

      // Insert args and relations
      if (argsToInsert.size > 0) {
        await this.insertArgsAndRelations(argsToInsert, relationsToInsert, transaction);
      }

      this.stats.processedRecords += records.length;

      await transaction.commit();

      console.debug(
        `[DEBUG][BACKFILL] Batch ${currentBatch}/${totalBatches} complete: ${records.length} records, ${argsToInsert.size} unique args`,
      );
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Build WHERE clause based on options
   */
  private buildWhereClause(): { whereClause: string; bindings: any[] } {
    const conditions: string[] = [];
    const bindings: any[] = [];
    let bindIndex = 1;

    if (this.options.startBlockHeight !== undefined) {
      conditions.push(`AND b.height >= $${bindIndex}`);
      bindings.push(this.options.startBlockHeight);
      bindIndex++;
    }

    if (this.options.endBlockHeight !== undefined) {
      conditions.push(`AND b.height <= $${bindIndex}`);
      bindings.push(this.options.endBlockHeight);
      bindIndex++;
    }

    if (this.options.startDate !== undefined) {
      conditions.push(`AND b."creationTime" >= $${bindIndex}`);
      bindings.push(this.options.startDate);
      bindIndex++;
    }

    if (this.options.endDate !== undefined) {
      conditions.push(`AND b."creationTime" <= $${bindIndex}`);
      bindings.push(this.options.endDate);
      bindIndex++;
    }

    if (this.options.chainId !== undefined) {
      conditions.push(`AND t."chainId" = $${bindIndex}`);
      bindings.push(this.options.chainId);
      bindIndex++;
    }

    return {
      whereClause: conditions.join(' '),
      bindings,
    };
  }

  /**
   * Fetch a batch of TransactionDetails records with their requestkey
   */
  private async fetchBatch(offset: number): Promise<Array<{ requestkey: string; code: any }>> {
    const { whereClause, bindings } = this.buildWhereClause();

    const query = `
      SELECT t.requestkey, td.code
      FROM "TransactionDetails" td
      JOIN "Transactions" t ON td."transactionId" = t.id
      JOIN "Blocks" b ON t."blockId" = b.id
      WHERE td.code IS NOT NULL 
      AND td.code != '{}'::jsonb
      ${whereClause}
      ORDER BY b.height DESC, td.id
      LIMIT $${bindings.length + 1} OFFSET $${bindings.length + 2}
    `;

    const allBindings = [...bindings, this.batchSize, offset];

    return (await sequelize.query(query, {
      bind: allBindings,
      type: QueryTypes.SELECT,
    })) as Array<{ requestkey: string; code: any }>;
  }

  /**
   * Extract Pact code string from various JSONB formats
   */
  private extractPactCodeString(codeJsonb: any): string | null {
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
   * Insert unique args into CodeSearch and relations into Transaction_CodeSearch
   */
  private async insertArgsAndRelations(
    argsMap: Map<string, number>,
    relations: Array<{ requestKey: string; args: string[] }>,
    transaction: any,
  ): Promise<void> {
    // 1. Insert unique args into CodeSearch (with conflict resolution) - in chunks to avoid PostgreSQL limits
    const uniqueArgs = Array.from(argsMap.keys());

    if (uniqueArgs.length > 0) {
      // Insert args one by one to avoid PostgreSQL statement size limits completely
      for (const arg of uniqueArgs) {
        const escapedArg = arg.replace(/'/g, "''");
        const insertArgsQuery = `
          INSERT INTO "CodeSearch" (arg, created_at, updated_at)
          VALUES ('${escapedArg}', NOW(), NOW())
          ON CONFLICT (arg) DO NOTHING
        `;

        await sequelize.query(insertArgsQuery, { transaction });
      }
    }

    // 2. Get the PKs for all args we need
    const argPksQuery = `
      SELECT pk, arg FROM "CodeSearch" 
      WHERE arg = ANY($1)
    `;

    const argPks = (await sequelize.query(argPksQuery, {
      bind: [uniqueArgs],
      type: QueryTypes.SELECT,
      transaction,
    })) as Array<{ pk: number; arg: string }>;

    const argToPk = new Map(argPks.map(row => [row.arg, row.pk]));

    // 3. Prepare relations for bulk insert
    const relationValues: string[] = [];

    for (const relation of relations) {
      for (const arg of relation.args) {
        const argFk = argToPk.get(arg);
        if (argFk) {
          const escapedRequestKey = relation.requestKey.replace(/'/g, "''");
          relationValues.push(`('${escapedRequestKey}', ${argFk}, NOW(), NOW())`);
        }
      }
    }

    // 4. Insert relations one by one to completely avoid PostgreSQL limits
    if (relationValues.length > 0) {
      for (const relationValue of relationValues) {
        const insertRelationsQuery = `
          INSERT INTO "Transaction_CodeSearch" (requestkey, args_fk, created_at, updated_at)
          VALUES ${relationValue}
          ON CONFLICT (requestkey, args_fk) DO NOTHING
        `;

        try {
          await sequelize.query(insertRelationsQuery, { transaction });
        } catch (error) {
          console.error(`[ERROR][BACKFILL] Failed to insert relation: ${relationValue}`, error);
          // Continue with other relations instead of failing the entire batch
        }
      }
    }
  }

  /**
   * Log current progress
   */
  private logProgress(currentBatch: number, totalBatches: number): void {
    const progress = this.calculateProgress(currentBatch, totalBatches);

    console.info(
      `[INFO][BACKFILL] Progress: ${progress.percentage}% (${progress.currentBatch}/${progress.totalBatches} batches)`,
    );
    console.info(
      `[INFO][BACKFILL] Records: ${this.stats.processedRecords}/${this.stats.totalRecords}`,
    );
    console.info(`[INFO][BACKFILL] Speed: ${progress.recordsPerSecond.toFixed(1)} records/sec`);
    console.info(`[INFO][BACKFILL] ETA: ${progress.estimatedTimeRemaining}`);
    console.info(
      `[INFO][BACKFILL] Extracted args: ${this.stats.extractedArgsCount}, Errors: ${this.stats.errorCount}`,
    );
  }

  /**
   * Calculate detailed progress information
   */
  private calculateProgress(currentBatch: number, totalBatches: number): BackfillProgress {
    const percentage = Math.round((this.stats.processedRecords / this.stats.totalRecords) * 100);
    const elapsedMs = Date.now() - this.stats.startTime.getTime();
    const recordsPerSecond = this.stats.processedRecords / (elapsedMs / 1000);

    const remainingRecords = this.stats.totalRecords - this.stats.processedRecords;
    const estimatedRemainingMs = (remainingRecords / recordsPerSecond) * 1000;
    const estimatedTimeRemaining = this.formatDuration(estimatedRemainingMs);

    return {
      currentBatch,
      totalBatches,
      percentage,
      recordsPerSecond,
      estimatedTimeRemaining,
    };
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Log final statistics
   */
  private logFinalStats(): void {
    const duration = this.stats.endTime!.getTime() - this.stats.startTime.getTime();
    const avgSpeed = this.stats.processedRecords / (duration / 1000);

    console.info('[INFO][BACKFILL] === BACKFILL COMPLETE ===');
    console.info(`[INFO][BACKFILL] Total records processed: ${this.stats.processedRecords}`);
    console.info(`[INFO][BACKFILL] Total args extracted: ${this.stats.extractedArgsCount}`);
    console.info(`[INFO][BACKFILL] Errors encountered: ${this.stats.errorCount}`);
    console.info(`[INFO][BACKFILL] Total duration: ${this.formatDuration(duration)}`);
    console.info(`[INFO][BACKFILL] Average speed: ${avgSpeed.toFixed(1)} records/sec`);
    console.info(`[INFO][BACKFILL] Batch size used: ${this.batchSize}`);
  }

  /**
   * Log filtering options being used
   */
  private logFilteringOptions(): void {
    console.info('[INFO][BACKFILL] Filtering options:');

    if (this.options.startBlockHeight !== undefined) {
      console.info(`[INFO][BACKFILL]   • Start block height: ${this.options.startBlockHeight}`);
    }

    if (this.options.endBlockHeight !== undefined) {
      console.info(`[INFO][BACKFILL]   • End block height: ${this.options.endBlockHeight}`);
    }

    if (this.options.chainId !== undefined) {
      console.info(`[INFO][BACKFILL]   • Chain ID: ${this.options.chainId}`);
    }

    if (this.options.startDate !== undefined) {
      console.info(`[INFO][BACKFILL]   • Start date: ${this.options.startDate.toISOString()}`);
    }

    if (this.options.endDate !== undefined) {
      console.info(`[INFO][BACKFILL]   • End date: ${this.options.endDate.toISOString()}`);
    }

    if (Object.keys(this.options).length === 0) {
      console.info(`[INFO][BACKFILL]   • Processing ALL records (no filters applied)`);
    }
  }

  /**
   * Get current statistics
   */
  public getStats(): BackfillStats {
    return { ...this.stats };
  }
}

// Export for CLI usage
export default PactBackfillService;
