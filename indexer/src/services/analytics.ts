/**
 * Analytics Service
 *
 * This service computes and stores pre-aggregated analytics metrics to enable
 * fast querying of transaction fees, event frequencies, and network statistics.
 *
 * Instead of running expensive real-time queries that take 30+ minutes,
 * this service pre-computes metrics during block ingestion and stores them
 * in the AnalyticsSummary table for instant retrieval.
 */

import { Transaction } from 'sequelize';
import { sequelize } from '@/config/database';
import AnalyticsSummary from '@/models/analytics-summary';
import { BlockAttributes } from '@/models/block';
import { EventAttributes } from '@/models/event';
import { TransactionAttributes } from '@/models/transaction';
import { TransactionDetailsAttributes } from '@/models/transaction-details';

export interface TransactionFeeMetrics {
  totalGasExpenditure: string;
  totalTransactionCount: number;
  uniqueSenders: number;
  averageGasPrice: string;
  averageGasUsed: string;
  averageFeePerTransaction: string;
}

export interface EventTypeMetrics {
  [moduleAndName: string]: {
    module: string;
    name: string;
    frequency: number;
    percentage: number;
  };
}

export interface NetworkActivityMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  uniqueAccounts: number;
  totalGasUsed: string;
  averageBlockTime: number;
  transactionsPerSecond: number;
}

/**
 * Computes transaction fee metrics for a given time period
 */
export async function computeTransactionFeeMetrics(
  periodStart: Date,
  periodEnd: Date,
  chainId?: number,
  tx?: Transaction,
): Promise<TransactionFeeMetrics> {
  const chainFilter = chainId ? `AND t."chainId" = ${chainId}` : '';

  const query = `
    SELECT
      SUM(td.gas::numeric * td.gasprice::numeric) AS total_gas_expenditure,
      COUNT(*) AS total_transaction_count,
      COUNT(DISTINCT t.sender) AS unique_senders,
      AVG(td.gasprice::numeric) AS average_gas_price,
      AVG(td.gas::numeric) AS average_gas_used,
      AVG(td.gas::numeric * td.gasprice::numeric) AS average_fee_per_transaction
    FROM
      "TransactionDetails" td
    JOIN "Transactions" t ON CAST(td."transactionId" AS TEXT) = CAST(t.id AS TEXT)
    WHERE
      t.creationtime::double precision BETWEEN $1 AND $2
      ${chainFilter}
  `;

  const [result] = await sequelize.query(query, {
    bind: [periodStart.getTime() / 1000, periodEnd.getTime() / 1000],
    transaction: tx,
  });

  const row = (result as any[])[0];

  return {
    totalGasExpenditure: row.total_gas_expenditure || '0',
    totalTransactionCount: parseInt(row.total_transaction_count) || 0,
    uniqueSenders: parseInt(row.unique_senders) || 0,
    averageGasPrice: row.average_gas_price || '0',
    averageGasUsed: row.average_gas_used || '0',
    averageFeePerTransaction: row.average_fee_per_transaction || '0',
  };
}

/**
 * Computes event type frequency metrics for a given time period
 */
export async function computeEventTypeMetrics(
  periodStart: Date,
  periodEnd: Date,
  chainId?: number,
  tx?: Transaction,
): Promise<EventTypeMetrics> {
  const chainFilter = chainId ? `AND e."chainId" = ${chainId}` : '';

  const query = `
    WITH event_counts AS (
      SELECT
        e.module,
        e.name,
        COUNT(*) as frequency
      FROM
        "Events" e
      JOIN "Transactions" t ON e."transactionId" = t.id
      WHERE
        t.creationtime::double precision BETWEEN $1 AND $2
        ${chainFilter}
      GROUP BY e.module, e.name
    ),
    total_events AS (
      SELECT SUM(frequency) as total FROM event_counts
    )
    SELECT
      ec.module,
      ec.name,
      ec.frequency,
      (ec.frequency::numeric / te.total::numeric * 100) as percentage
    FROM event_counts ec
    CROSS JOIN total_events te
    ORDER BY ec.frequency DESC
  `;

  const results = await sequelize.query(query, {
    bind: [periodStart.getTime() / 1000, periodEnd.getTime() / 1000],
    transaction: tx,
  });

  const eventMetrics: EventTypeMetrics = {};

  (results[0] as any[]).forEach(row => {
    const key = `${row.module}.${row.name}`;
    eventMetrics[key] = {
      module: row.module,
      name: row.name,
      frequency: parseInt(row.frequency),
      percentage: parseFloat(row.percentage),
    };
  });

  return eventMetrics;
}

/**
 * Computes network activity metrics for a given time period
 */
export async function computeNetworkActivityMetrics(
  periodStart: Date,
  periodEnd: Date,
  chainId?: number,
  tx?: Transaction,
): Promise<NetworkActivityMetrics> {
  const chainFilter = chainId ? `AND t."chainId" = ${chainId}` : '';

  const query = `
    SELECT
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN td.rollback = false THEN 1 END) as successful_transactions,
      COUNT(CASE WHEN td.rollback = true THEN 1 END) as failed_transactions,
      COUNT(DISTINCT t.sender) as unique_accounts,
      SUM(td.gas::numeric) as total_gas_used,
      AVG(EXTRACT(EPOCH FROM (t.creationtime::timestamp - LAG(t.creationtime::timestamp) OVER (ORDER BY t.creationtime)))) as average_block_time
    FROM
      "TransactionDetails" td
    JOIN "Transactions" t ON td."transactionId" = t.id
    WHERE
      t.creationtime::double precision BETWEEN $1 AND $2
      ${chainFilter}
  `;

  const [result] = await sequelize.query(query, {
    bind: [periodStart.getTime() / 1000, periodEnd.getTime() / 1000],
    transaction: tx,
  });

  const row = (result as any[])[0];
  const totalTransactions = parseInt(row.total_transactions) || 0;
  const timePeriodSeconds = (periodEnd.getTime() - periodStart.getTime()) / 1000;

  return {
    totalTransactions,
    successfulTransactions: parseInt(row.successful_transactions) || 0,
    failedTransactions: parseInt(row.failed_transactions) || 0,
    uniqueAccounts: parseInt(row.unique_accounts) || 0,
    totalGasUsed: row.total_gas_used || '0',
    averageBlockTime: parseFloat(row.average_block_time) || 0,
    transactionsPerSecond: timePeriodSeconds > 0 ? totalTransactions / timePeriodSeconds : 0,
  };
}

/**
 * Stores analytics metrics for a given time period and metric type
 */
export async function storeAnalyticsMetrics(
  metricType: string,
  timeframe: string,
  periodStart: Date,
  periodEnd: Date,
  metricData: object,
  chainId?: number,
  tx?: Transaction,
): Promise<void> {
  await AnalyticsSummary.upsert(
    {
      metricType,
      timeframe,
      periodStart,
      periodEnd,
      chainId,
      metricData,
    },
    {
      conflictFields: ['metricType', 'timeframe', 'periodStart', 'chainId'],
      transaction: tx,
    },
  );
}

/**
 * Computes and stores all analytics for a given time period
 */
export async function computeAndStoreAnalytics(
  periodStart: Date,
  periodEnd: Date,
  timeframe: string,
  chainId?: number,
  tx?: Transaction,
): Promise<void> {
  console.info(
    `[ANALYTICS] Computing ${timeframe} analytics for period ${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
  );

  try {
    // Compute transaction fee metrics
    const feeMetrics = await computeTransactionFeeMetrics(periodStart, periodEnd, chainId, tx);
    await storeAnalyticsMetrics(
      'transaction_fees',
      timeframe,
      periodStart,
      periodEnd,
      feeMetrics,
      chainId,
      tx,
    );

    // Compute event type metrics
    const eventMetrics = await computeEventTypeMetrics(periodStart, periodEnd, chainId, tx);
    await storeAnalyticsMetrics(
      'event_types',
      timeframe,
      periodStart,
      periodEnd,
      eventMetrics,
      chainId,
      tx,
    );

    // Compute network activity metrics
    const networkMetrics = await computeNetworkActivityMetrics(periodStart, periodEnd, chainId, tx);
    await storeAnalyticsMetrics(
      'network_activity',
      timeframe,
      periodStart,
      periodEnd,
      networkMetrics,
      chainId,
      tx,
    );

    console.info(
      `[ANALYTICS] Successfully stored ${timeframe} analytics for period ${periodStart.toISOString()}`,
    );
  } catch (error) {
    console.error(
      `[ANALYTICS] Failed to compute analytics for period ${periodStart.toISOString()}:`,
      error,
    );
    throw error;
  }
}

/**
 * Gets time period boundaries for different timeframes
 */
export function getTimePeriods(date: Date, timeframe: string): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (timeframe) {
    case 'hourly':
      start.setMinutes(0, 0, 0);
      end.setTime(start.getTime() + 60 * 60 * 1000); // +1 hour
      break;
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime() + 24 * 60 * 60 * 1000); // +1 day
      break;
    case 'weekly':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setTime(start.getTime() + 7 * 24 * 60 * 60 * 1000); // +1 week
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1);
      end.setDate(1);
      end.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear() + 1);
      end.setMonth(0, 1);
      end.setHours(0, 0, 0, 0);
      break;
    default:
      throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return { start, end };
}

/**
 * Processes analytics for a block - called during block ingestion
 */
export async function processBlockAnalytics(
  block: BlockAttributes,
  transactions: TransactionAttributes[],
  events: EventAttributes[],
  tx?: Transaction,
): Promise<void> {
  const blockTime = new Date(Number(block.creationTime) * 1000);

  // Process analytics for different timeframes
  const timeframes = ['hourly', 'daily', 'weekly', 'monthly'];

  for (const timeframe of timeframes) {
    const { start, end } = getTimePeriods(blockTime, timeframe);

    // Only process if this is a new period or we're updating the current period
    const now = new Date();
    if (end <= now) {
      // Period is complete, compute final analytics
      await computeAndStoreAnalytics(start, end, timeframe, block.chainId, tx);
    }
  }
}
