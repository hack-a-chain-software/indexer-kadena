/**
 * Analytics GraphQL Resolvers
 *
 * These resolvers provide fast access to pre-computed analytics metrics
 * stored in the AnalyticsSummary table. This avoids expensive real-time
 * calculations and provides instant query responses.
 */

import AnalyticsSummary from '../../../models/analytics-summary';
import { Op } from 'sequelize';

interface AnalyticsArgs {
  timeframe: string;
  startDate: Date;
  endDate: Date;
  chainId?: number;
}

export const analyticsResolvers = {
  /**
   * Retrieves transaction fee analytics for specified time periods
   */
  transactionFeeAnalytics: async (
    _: any,
    { timeframe, startDate, endDate, chainId }: AnalyticsArgs,
  ) => {
    const whereClause: any = {
      metricType: 'transaction_fees',
      timeframe,
      periodStart: {
        [Op.gte]: startDate,
      },
      periodEnd: {
        [Op.lte]: endDate,
      },
    };

    if (chainId !== undefined) {
      whereClause.chainId = chainId;
    }

    const results = await AnalyticsSummary.findAll({
      where: whereClause,
      order: [['periodStart', 'ASC']],
    });

    return results.map(result => ({
      periodStart: result.periodStart,
      periodEnd: result.periodEnd,
      chainId: result.chainId,
      ...(result.metricData as any),
    }));
  },

  /**
   * Retrieves event type frequency analytics
   */
  eventTypeAnalytics: async (_: any, { timeframe, startDate, endDate, chainId }: AnalyticsArgs) => {
    const whereClause: any = {
      metricType: 'event_types',
      timeframe,
      periodStart: {
        [Op.gte]: startDate,
      },
      periodEnd: {
        [Op.lte]: endDate,
      },
    };

    if (chainId !== undefined) {
      whereClause.chainId = chainId;
    }

    const results = await AnalyticsSummary.findAll({
      where: whereClause,
      order: [['periodStart', 'ASC']],
    });

    return results.map(result => {
      const eventTypesData = result.metricData as any;
      const eventTypes = Object.values(eventTypesData).map((eventType: any) => ({
        module: eventType.module,
        name: eventType.name,
        frequency: eventType.frequency,
        percentage: eventType.percentage,
      }));

      return {
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
        chainId: result.chainId,
        eventTypes,
      };
    });
  },

  /**
   * Retrieves network activity analytics
   */
  networkActivityAnalytics: async (
    _: any,
    { timeframe, startDate, endDate, chainId }: AnalyticsArgs,
  ) => {
    const whereClause: any = {
      metricType: 'network_activity',
      timeframe,
      periodStart: {
        [Op.gte]: startDate,
      },
      periodEnd: {
        [Op.lte]: endDate,
      },
    };

    if (chainId !== undefined) {
      whereClause.chainId = chainId;
    }

    const results = await AnalyticsSummary.findAll({
      where: whereClause,
      order: [['periodStart', 'ASC']],
    });

    return results.map(result => ({
      periodStart: result.periodStart,
      periodEnd: result.periodEnd,
      chainId: result.chainId,
      ...(result.metricData as any),
    }));
  },
};
