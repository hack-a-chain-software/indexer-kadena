/**
 * Central resolver registry for the Kadena Indexer GraphQL API
 *
 * This file aggregates and registers all resolvers for the GraphQL schema,
 * organizing them into logical groups that match the schema structure.
 * It maps GraphQL types to their corresponding resolver functions following
 * Apollo Server patterns and implements type resolvers for union and interface types.
 *
 * Key features:
 * - Combines over 60 individual resolver functions into a coherent whole
 * - Implements the Node interface for Relay Global Object Identification
 * - Contains type discrimination logic for polymorphic entities
 * - Includes detailed inline comments identifying optimization points for data loaders
 * - Supports various query patterns including nested relationship resolution
 *
 * The resolvers are organized by GraphQL type, with each type having its own
 * set of field resolvers to handle data fetching and transformation.
 */

import { DateTimeResolver } from 'graphql-scalars';
import { ResolverContext } from '../config/apollo-server-config';
import { Resolvers } from '../config/graphql-types';
import { totalCountBlockEventsConnectionResolver } from './fields/block-events-connection/total-count-block-events-connection';
import { totalCountBlockTransactionsConnectionResolver } from './fields/block-transactions-connection/total-count-block-transactions-connection-resolver';
import { eventsBlockResolver } from './fields/block/events-block-resolver';
import { minerAccountBlockResolver } from './fields/block/miner-account-block-resolver';
import { parentBlockResolver } from './fields/block/parent-block-resolver';
import { powHashBlockResolver } from './fields/block/pow-hash-block-resolver';
import { transactionsBlockResolver } from './fields/block/transactions-block-resolver';
import { blockEventResolver } from './fields/event/block-event-resolver';
import { transactionEventResolver } from './fields/event/transaction-event-resolver';
import { chainAccountsFungibleAccountResolver } from './fields/fungible-account/chain-accounts-fungible-account-resolver';
import { totalCountFungibleAccountTransactionsConnectionResolver } from './fields/fungible-account/transactions-connection/total-count-fungible-account-transactions-connection-resolver';
import { transactionsFungibleAccountResolver } from './fields/fungible-account/transactions-fungible-account-resolver';
import { totalCountFungibleAccountTransfersConnectionResolver } from './fields/fungible-account/transfers-connection/total-count-fungible-account-transfers-connection-resolver';
import { transfersFungibleAccountResolver } from './fields/fungible-account/transfers-fungible-account-resolver';
import { totalCountFungibleChainAccountTransactionsConnectionResolver } from './fields/fungible-chain-account/transactions-connection/total-count-fungible-chain-account-transactions-connection-resolver';
import { transactionsFungibleChainAccountResolver } from './fields/fungible-chain-account/transactions-fungible-chain-account-resolver';
import { totalCountFungibleChainAccountTransfersConnectionResolver } from './fields/fungible-chain-account/transfers-connection/total-count-fungible-chain-account-transfers-connection-resolver';
import { transfersFungibleChainAccountResolver } from './fields/fungible-chain-account/transfers-fungible-chain-account-resolver';
import { chainAccountsNonFungibleAccountResolver } from './fields/non-fungible-account/chain-accounts-non-fungible-account-resolver';
import { totalCountNonFungibleAccountTransactionsConnectionResolver } from './fields/non-fungible-account/transactions-connection/total-count-non-fungible-account-transactions-connection-resolver';
import { transactionsNonFungibleAccountResolver } from './fields/non-fungible-account/transactions-non-fungible-account-resolver';
import { totalCountNonFungibleChainAccountTransactionsConnectionResolver } from './fields/non-fungible-chain-account/transactions-connection/total-count-non-fungible-chain-account-transactions-connection-resolver';
import { transactionsNonFungibleChainAccountResolver } from './fields/non-fungible-chain-account/transactions-non-fungible-chain-account';
import { totalCountQueryEventsConnectionResolver } from './fields/query-events-connection/total-count-query-events-connection-resolver';
import { totalCountQueryTransactionsByPublicKeyConnectionResolver } from './fields/query-transactions-by-public-key-connection/total-count-query-transactions-by-public-key-connection-resolver';
import { totalCountQueryTransactionsConnectionResolver } from './fields/query-transactions-connection/total-count-query-transactions-connection-resolver';
import { totalCountQueryTransfersConnectionResolver } from './fields/query-transfers-connection/total-count-query-transfers-connection-resolver';
import { metaTransactionCommandResolver } from './fields/transaction-command/meta-transaction-command-resolver';
import { signersTransactionCommandResolver } from './fields/transaction-command/signers-transaction-command-resolver';
import { blockTransactionResultResolver } from './fields/transaction-result/block-transaction-result-resolver';
import { totalCountTransactionResultEventsConnectionResolver } from './fields/transaction-result/events-connection/total-count-transaction-result-events-connection-resolver';
import { eventsTransactionResultResolver } from './fields/transaction-result/events-transaction-result-resolver';
import { totalCountTransactionResultTransfersConnectionResolver } from './fields/transaction-result/transfers-connection/total-count-transaction-result-transfers-connection-resolver';
import { transfersTransactionResultResolver } from './fields/transaction-result/transfers-transaction-result-tesolver';
import { blockTransferResolver } from './fields/transfer/block-transfer-resolver';
import { crossChainTransferTransferResolver } from './fields/transfer/cross-chain-transfer-transfer-resolver';
import { transactionTransferResolver } from './fields/transfer/transaction-transfer-resolver';
import { poolsQueryResolver } from './query/pools-query-resolver';
import { blockQueryResolver } from './query/block-query-resolver';
import { blocksFromDepthQueryResolver } from './query/blocks-from-depth-query-resolver';
import { blocksFromHeightQueryResolver } from './query/blocks-from-height-query-resolver';
import { completedBlockHeightsQueryResolver } from './query/completed-block-heights-query-resolver';
import { eventsQueryResolver } from './query/events-query-resolver';
import { fungibleAccountQueryResolver } from './query/fungible-account-query-resolver';
import { fungibleAccountsByPublicKeyQueryResolver } from './query/fungible-accounts-by-public-key-query-resolver';
import { fungibleChainAccountQueryResolver } from './query/fungible-chain-account-query-resolver';
import { fungibleChainAccountsByPublicKeyQueryResolver } from './query/fungible-chain-accounts-by-public-key-query-resolver';
import { fungibleChainAccountsQueryResolver } from './query/fungible-chain-accounts-query-resolver';
import { gasLimitEstimateQueryResolver } from './query/gas-limit-estimate-query-resolver';
import { graphConfigurationQueryResolver } from './query/graph-configuration-query-resolver';
import { lastBlockHeightQueryResolver } from './query/last-block-height-query-resolver';
import { networkInfoQueryResolver } from './query/network-info-query-resolver';
import { nodeQueryResolver } from './query/node-query-resolver';
import { nodesQueryResolver } from './query/nodes-query-resolver';
import { nonFungibleAccountQueryResolver } from './query/non-fungible-account-query-resolver';
import { nonFungibleChainAccountQueryResolver } from './query/non-fungible-chain-account-query-resolver';
import { pactQueryResolver } from './query/pact-query-resolver';
import { tokensQueryResolver } from './query/tokens-query';
import { transactionQueryResolver } from './query/transaction-query-resolver';
import { transactionsByPublicKeyQueryResolver } from './query/transactions-by-public-key-query-resolver';
import { transactionsQueryResolver } from './query/transactions-query-resolver';
import { transfersQueryResolver } from './query/transfers-query-resolver';
import { eventsSubscriptionResolver } from './subscription/events-subscription-resolver';
import { newBlocksFromDepthSubscriptionResolver } from './subscription/new-blocks-from-depth-subscription-resolver';
import { newBlocksSubscriptionResolver } from './subscription/new-blocks-subscription-resolver';
import { transactionSubscriptionResolver } from './subscription/transaction-subscription-resolver';
import { poolResolvers } from './fields/pool/pool-resolvers';
import { poolQueryResolver } from './query/pool-query-resolver';
import { poolTransactionsQueryResolver } from './query/pool-transactions-query-resolver';
import { liquidityPositionsQueryResolver } from './query/liquidity-positions-query-resolver';
import { dexMetricsQueryResolver } from './query/dex-metrics-resolver';
import {
  tokenPriceQueryResolver,
  tokenPricesQueryResolver,
} from './query/token-price-query-resolver';
import { transactionsSubscriptionResolver } from '@/kadena-server/resolvers/subscription/transactions-subscription-resolver';
/**
 * Complete resolver map for the GraphQL API
 *
 * This object maps GraphQL types and fields to their resolver functions,
 * following the structure defined in the GraphQL schema. The resolvers
 * are organized by type, with each type having its fields mapped to their
 * corresponding resolver functions.
 *
 * Key sections:
 * - Scalar resolvers: Handle custom scalar types like DateTime
 * - Query resolvers: Entry points for data retrieval operations
 * - Subscription resolvers: Handle real-time data notifications
 * - Object type resolvers: Resolve fields for complex objects (Block, Event, etc.)
 * - Connection resolvers: Handle pagination-related fields and counts
 * - Union and interface type resolvers: Discriminate between different object types
 */
export const resolvers: Resolvers<ResolverContext> = {
  DateTime: DateTimeResolver,
  Subscription: {
    transaction: transactionSubscriptionResolver,
    transactions: transactionsSubscriptionResolver,
    newBlocks: newBlocksSubscriptionResolver,
    newBlocksFromDepth: newBlocksFromDepthSubscriptionResolver,
    events: eventsSubscriptionResolver,
  },
  Query: {
    block: blockQueryResolver,
    blocksFromDepth: blocksFromDepthQueryResolver,
    blocksFromHeight: blocksFromHeightQueryResolver,
    completedBlockHeights: completedBlockHeightsQueryResolver,
    events: eventsQueryResolver,
    fungibleAccount: fungibleAccountQueryResolver,
    fungibleAccountsByPublicKey: fungibleAccountsByPublicKeyQueryResolver,
    fungibleChainAccount: fungibleChainAccountQueryResolver,
    fungibleChainAccounts: fungibleChainAccountsQueryResolver,
    fungibleChainAccountsByPublicKey: fungibleChainAccountsByPublicKeyQueryResolver,
    gasLimitEstimate: gasLimitEstimateQueryResolver,
    graphConfiguration: graphConfigurationQueryResolver,
    lastBlockHeight: lastBlockHeightQueryResolver,
    networkInfo: networkInfoQueryResolver,
    node: nodeQueryResolver,
    nodes: nodesQueryResolver,
    nonFungibleAccount: nonFungibleAccountQueryResolver,
    nonFungibleChainAccount: nonFungibleChainAccountQueryResolver,
    pactQuery: pactQueryResolver,
    pools: poolsQueryResolver,
    transaction: transactionQueryResolver,
    transactions: transactionsQueryResolver,
    transactionsByPublicKey: transactionsByPublicKeyQueryResolver,
    transfers: transfersQueryResolver,
    tokens: tokensQueryResolver,
    pool: poolQueryResolver,
    poolTransactions: poolTransactionsQueryResolver,
    liquidityPositions: liquidityPositionsQueryResolver,
    dexMetrics: dexMetricsQueryResolver,
    tokenPrice: tokenPriceQueryResolver,
    tokenPrices: tokenPricesQueryResolver,
  },
  Block: {
    parent: parentBlockResolver, // data loader set.
    events: eventsBlockResolver, // add dataloader
    minerAccount: minerAccountBlockResolver, // add dataloader
    transactions: transactionsBlockResolver, // add dataloader
    powHash: powHashBlockResolver,
  },
  Event: {
    block: blockEventResolver, // data loader set.
    transaction: transactionEventResolver, // data loader set.
  },
  BlockEventsConnection: {
    totalCount: totalCountBlockEventsConnectionResolver,
  },
  FungibleAccount: {
    chainAccounts: chainAccountsFungibleAccountResolver,
    transactions: transactionsFungibleAccountResolver,
    transfers: transfersFungibleAccountResolver,
  },
  FungibleAccountTransfersConnection: {
    totalCount: totalCountFungibleAccountTransfersConnectionResolver,
  },
  FungibleAccountTransactionsConnection: {
    totalCount: totalCountFungibleAccountTransactionsConnectionResolver,
  },
  FungibleChainAccount: {
    transactions: transactionsFungibleChainAccountResolver, // add dataloader
    transfers: transfersFungibleChainAccountResolver, // add dataloader
  },
  FungibleChainAccountTransfersConnection: {
    totalCount: totalCountFungibleChainAccountTransfersConnectionResolver,
  },
  FungibleChainAccountTransactionsConnection: {
    totalCount: totalCountFungibleChainAccountTransactionsConnectionResolver,
  },
  NonFungibleAccount: {
    chainAccounts: chainAccountsNonFungibleAccountResolver,
    transactions: transactionsNonFungibleAccountResolver,
  },
  NonFungibleChainAccount: {
    transactions: transactionsNonFungibleChainAccountResolver,
  },
  NonFungibleAccountTransactionsConnection: {
    totalCount: totalCountNonFungibleAccountTransactionsConnectionResolver,
  },
  NonFungibleChainAccountTransactionsConnection: {
    totalCount: totalCountNonFungibleChainAccountTransactionsConnectionResolver,
  },
  Transfer: {
    block: blockTransferResolver, // add dataloader
    transaction: transactionTransferResolver, // add dataloader
    crossChainTransfer: crossChainTransferTransferResolver, // add dataloader
  },
  BlockTransactionsConnection: {
    totalCount: totalCountBlockTransactionsConnectionResolver,
  },
  TransactionResult: {
    block: blockTransactionResultResolver, // data loader set.
    transfers: transfersTransactionResultResolver, // add dataloader
    events: eventsTransactionResultResolver, // add dataloader
  },
  TransactionResultTransfersConnection: {
    totalCount: totalCountTransactionResultTransfersConnectionResolver,
  },
  TransactionResultEventsConnection: {
    totalCount: totalCountTransactionResultEventsConnectionResolver,
  },
  TransactionCommand: {
    signers: signersTransactionCommandResolver, // add dataloader
    meta: metaTransactionCommandResolver, // add dataloader
  },
  QueryEventsConnection: {
    totalCount: totalCountQueryEventsConnectionResolver,
  },
  QueryTransfersConnection: {
    totalCount: totalCountQueryTransfersConnectionResolver,
  },
  QueryTransactionsConnection: {
    totalCount: totalCountQueryTransactionsConnectionResolver,
  },
  QueryTransactionsByPublicKeyConnection: {
    totalCount: totalCountQueryTransactionsByPublicKeyConnectionResolver,
  },
  Pool: poolResolvers,
  Node: {
    /**
     * Resolves the concrete object type for a Node interface implementation
     *
     * This resolver is a key component of the Relay Global Object Identification
     * specification implementation. It determines which concrete type an object
     * implements based on examining its properties. This enables polymorphic queries
     * where clients can request objects by ID without knowing their concrete types.
     *
     * The function inspects object properties to determine its type:
     * - Block: Contains difficulty and powHash
     * - Event: Contains name and qualifiedName
     * - NonFungibleTokenBalance: Contains tokenId and version
     * - NonFungibleChainAccount: Contains chainId and nonFungibleTokenBalances
     * - NonFungibleAccount: Contains nonFungibleTokenBalances (but not chainId)
     * - FungibleAccount: Contains totalBalance
     * - FungibleChainAccount: Contains accountName, chainId, and balance
     * - Signer: Contains pubkey
     * - Transaction: Contains cmd and result
     * - Transfer: Contains senderAccount and receiverAccount
     *
     * @param obj - The object to resolve the type for
     * @returns The GraphQL type name as a string, or null if unrecognized
     */
    __resolveType(obj: any) {
      if (obj.difficulty && obj.hash) {
        return 'Block';
      }

      if (obj.name && obj.qualifiedName) {
        return 'Event';
      }

      if (obj.tokenId !== undefined && obj.version) {
        return 'NonFungibleTokenBalance';
      }

      if (obj.chainId !== undefined && obj.nonFungibleTokenBalances) {
        return 'NonFungibleChainAccount';
      }

      if (obj.nonFungibleTokenBalances) {
        return 'NonFungibleAccount';
      }

      if (obj.accountName && obj.totalBalance !== undefined && obj.totalBalance !== null) {
        return 'FungibleAccount';
      }

      if (
        obj.accountName &&
        obj.chainId !== undefined &&
        obj.balance !== undefined &&
        obj.balance !== null
      ) {
        return 'FungibleChainAccount';
      }

      if (obj.pubkey) {
        return 'Signer';
      }

      if (obj.cmd && obj.result) {
        return 'Transaction';
      }

      if (obj.senderAccount !== undefined && obj.receiverAccount !== undefined) {
        return 'Transfer';
      }

      if (obj.address && obj.token0 && obj.token1) {
        return 'Pool';
      }

      return null;
    },
  },
  TransactionInfo: {
    /**
     * Type resolver for TransactionInfo union type
     *
     * Determines whether a transaction object represents a completed transaction
     * result or a mempool transaction that hasn't been mined yet.
     *
     * Note: Currently all transaction objects are resolved as TransactionResult.
     * The commented-out code indicates a potential future implementation for
     * distinguishing mempool transactions.
     *
     * @param obj - The transaction object to resolve
     * @returns The GraphQL type name as a string
     */
    __resolveType: (obj: any) => {
      // if (obj.status) {
      //   return "TransactionMempoolInfo";
      // }
      return 'TransactionResult';
    },
  },
  TransactionPayload: {
    /**
     * Type resolver for TransactionPayload union type
     *
     * Discriminates between the two types of transaction payloads:
     * - ExecutionPayload: Contains Pact code to be executed
     * - ContinuationPayload: Contains data for continuing a multi-step transaction
     *
     * @param obj - The payload object to resolve
     * @returns The GraphQL type name as a string
     */
    __resolveType: (obj: any) => {
      if (obj.step === 1) {
        return 'ContinuationPayload';
      }
      return 'ExecutionPayload';
    },
  },
  IGuard: {
    /**
     * Type resolver for IGuard union type
     *
     * Discriminates between the three types of guard objects:
     * - UserGuard: Contains user-specific guard information
     * - KeysetGuard: Contains keyset-based guard information
     * - RawGuard: Contains raw guard information
     *
     * @param obj - The guard object to resolve
     * @returns The GraphQL type name as a string
     */
    __resolveType: (obj: any) => {
      if (obj.fun) {
        return 'UserGuard';
      }
      if (obj.keys?.length) {
        return 'KeysetGuard';
      }
      return 'RawGuard';
    },
  },
};
