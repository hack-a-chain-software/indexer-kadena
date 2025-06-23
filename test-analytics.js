#!/usr/bin/env node

/**
 * Analytics Testing Script
 *
 * This script demonstrates the new analytics features by running
 * GraphQL queries against the indexer to fetch pre-computed metrics.
 */

const { GraphQLClient } = require('graphql-request');

// GraphQL endpoint (adjust if needed)
const GRAPHQL_ENDPOINT = 'http://localhost:3001/graphql';

// Create GraphQL client
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

// GraphQL queries for analytics
const TRANSACTION_FEE_ANALYTICS = `
  query TransactionFees($timeframe: String!, $startDate: DateTime!, $endDate: DateTime!, $chainId: Int) {
    transactionFeeAnalytics(
      timeframe: $timeframe
      startDate: $startDate
      endDate: $endDate
      chainId: $chainId
    ) {
      periodStart
      periodEnd
      chainId
      totalGasExpenditure
      totalTransactionCount
      uniqueSenders
      averageGasPrice
      averageGasUsed
      averageFeePerTransaction
    }
  }
`;

const EVENT_TYPE_ANALYTICS = `
  query EventTypes($timeframe: String!, $startDate: DateTime!, $endDate: DateTime!) {
    eventTypeAnalytics(
      timeframe: $timeframe
      startDate: $startDate
      endDate: $endDate
    ) {
      periodStart
      periodEnd
      eventTypes {
        module
        name
        frequency
        percentage
      }
    }
  }
`;

const NETWORK_ACTIVITY_ANALYTICS = `
  query NetworkActivity($timeframe: String!, $startDate: DateTime!, $endDate: DateTime!) {
    networkActivityAnalytics(
      timeframe: $timeframe
      startDate: $startDate
      endDate: $endDate
    ) {
      periodStart
      periodEnd
      totalTransactions
      successfulTransactions
      failedTransactions
      uniqueAccounts
      totalGasUsed
      averageBlockTime
      transactionsPerSecond
    }
  }
`;

async function testTransactionFeeAnalytics() {
  console.log('\n🔍 Testing Transaction Fee Analytics...');

  try {
    const variables = {
      timeframe: 'daily',
      startDate: '2024-12-01T00:00:00Z',
      endDate: '2024-12-02T00:00:00Z',
      chainId: 0,
    };

    const data = await client.request(TRANSACTION_FEE_ANALYTICS, variables);

    console.log('✅ Transaction Fee Analytics Results:');
    console.log(JSON.stringify(data.transactionFeeAnalytics, null, 2));

    if (data.transactionFeeAnalytics.length > 0) {
      const metrics = data.transactionFeeAnalytics[0];
      console.log(`📊 Summary for ${metrics.periodStart}:`);
      console.log(`   💰 Total Gas Expenditure: ${metrics.totalGasExpenditure}`);
      console.log(`   📈 Transaction Count: ${metrics.totalTransactionCount}`);
      console.log(`   👥 Unique Senders: ${metrics.uniqueSenders}`);
      console.log(`   ⛽ Average Gas Price: ${metrics.averageGasPrice}`);
    }
  } catch (error) {
    console.error('❌ Error testing transaction fee analytics:', error.message);
  }
}

async function testEventTypeAnalytics() {
  console.log('\n🔍 Testing Event Type Analytics...');

  try {
    const variables = {
      timeframe: 'daily',
      startDate: '2024-12-01T00:00:00Z',
      endDate: '2024-12-02T00:00:00Z',
    };

    const data = await client.request(EVENT_TYPE_ANALYTICS, variables);

    console.log('✅ Event Type Analytics Results:');

    if (data.eventTypeAnalytics.length > 0) {
      const analytics = data.eventTypeAnalytics[0];
      console.log(`📊 Event Types for ${analytics.periodStart}:`);

      // Show top 5 most frequent events
      const topEvents = analytics.eventTypes.sort((a, b) => b.frequency - a.frequency).slice(0, 5);

      topEvents.forEach((event, index) => {
        console.log(
          `   ${index + 1}. ${event.module}.${event.name}: ${event.frequency} (${event.percentage.toFixed(2)}%)`,
        );
      });
    } else {
      console.log('📊 No event analytics data found for the specified period');
    }
  } catch (error) {
    console.error('❌ Error testing event type analytics:', error.message);
  }
}

async function testNetworkActivityAnalytics() {
  console.log('\n🔍 Testing Network Activity Analytics...');

  try {
    const variables = {
      timeframe: 'daily',
      startDate: '2024-12-01T00:00:00Z',
      endDate: '2024-12-02T00:00:00Z',
    };

    const data = await client.request(NETWORK_ACTIVITY_ANALYTICS, variables);

    console.log('✅ Network Activity Analytics Results:');

    if (data.networkActivityAnalytics.length > 0) {
      const metrics = data.networkActivityAnalytics[0];
      console.log(`📊 Network Activity for ${metrics.periodStart}:`);
      console.log(`   📈 Total Transactions: ${metrics.totalTransactions}`);
      console.log(`   ✅ Successful: ${metrics.successfulTransactions}`);
      console.log(`   ❌ Failed: ${metrics.failedTransactions}`);
      console.log(`   👥 Unique Accounts: ${metrics.uniqueAccounts}`);
      console.log(`   ⛽ Total Gas Used: ${metrics.totalGasUsed}`);
      console.log(`   ⏱️  Average Block Time: ${metrics.averageBlockTime}s`);
      console.log(`   🚀 TPS: ${metrics.transactionsPerSecond.toFixed(4)}`);
    } else {
      console.log('📊 No network activity data found for the specified period');
    }
  } catch (error) {
    console.error('❌ Error testing network activity analytics:', error.message);
  }
}

async function testAnalytics() {
  console.log('🚀 Starting Analytics System Test');
  console.log('=====================================');

  // Test all analytics endpoints
  await testTransactionFeeAnalytics();
  await testEventTypeAnalytics();
  await testNetworkActivityAnalytics();

  console.log('\n🎉 Analytics testing completed!');
  console.log('\n💡 Tips:');
  console.log('   - Adjust date ranges to match your indexed data');
  console.log('   - Try different timeframes: hourly, daily, weekly, monthly');
  console.log('   - Use chainId parameter to filter by specific chains');
  console.log('   - Check the database for AnalyticSummaries table data');
}

// Run the tests
if (require.main === module) {
  testAnalytics().catch(console.error);
}

module.exports = {
  testTransactionFeeAnalytics,
  testEventTypeAnalytics,
  testNetworkActivityAnalytics,
};
