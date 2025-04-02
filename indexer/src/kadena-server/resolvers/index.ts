import { eventsBlockResolver } from './fields/block/events-block-resolver';
import { blockQueryResolver } from './query/block-query-resolver';
import { Resolvers } from '../config/graphql-types';
import { parentBlockResolver } from './fields/block/parent-block-resolver';
import { minerAccountBlockResolver } from './fields/block/miner-account-block-resolver';
import { transactionsBlockResolver } from './fields/block/transactions-block-resolver';
import { transactionsQueryResolver } from './query/transactions-query-resolver';
import { transfersQueryResolver } from './query/transfers-query-resolver';
import { blockTransactionResultResolver } from './fields/transaction-result/block-transaction-result-resolver';
import { transactionTransferResolver } from './fields/transfer/transaction-transfer-resolver';
import { metaTransactionCommandResolver } from './fields/transaction-command/meta-transaction-command-resolver';
import { crossChainTransferTransferResolver } from './fields/transfer/cross-chain-transfer-transfer-resolver';
import { blocksFromDepthQueryResolver } from './query/blocks-from-depth-query-resolver';
import { blocksFromHeightQueryResolver } from './query/blocks-from-height-query-resolver';
import { totalCountQueryTransfersConnectionResolver } from './fields/query-transfers-connection/total-count-query-transfers-connection-resolver';
import { totalCountBlockEventsConnectionResolver } from './fields/block-events-connection/total-count-block-events-connection';
import { transactionQueryResolver } from './query/transaction-query-resolver';
import { transactionsByPublicKeyQueryResolver } from './query/transactions-by-public-key-query-resolver';
import { totalCountQueryTransactionsByPublicKeyConnectionResolver } from './fields/query-transactions-by-public-key-connection/total-count-query-transactions-by-public-key-connection-resolver';
import { eventsQueryResolver } from './query/events-query-resolver';
import { totalCountQueryEventsConnectionResolver } from './fields/query-events-connection/total-count-query-events-connection-resolver';
import { blockEventResolver } from './fields/event/block-event-resolver';
import { totalCountBlockTransactionsConnectionResolver } from './fields/block-transactions-connection/total-count-block-transactions-connection-resolver';
import { fungibleAccountQueryResolver } from './query/fungible-account-query-resolver';
import { transactionsFungibleAccountResolver } from './fields/fungible-account/transactions-fungible-account-resolver';
import { transfersFungibleAccountResolver } from './fields/fungible-account/transfers-fungible-account-resolver';
import { graphConfigurationQueryResolver } from './query/graph-configuration-query-resolver';
import { lastBlockHeightQueryResolver } from './query/last-block-height-query-resolver';
import { networkInfoQueryResolver } from './query/network-info-query-resolver';
import { chainAccountsFungibleAccountResolver } from './fields/fungible-account/chain-accounts-fungible-account-resolver';
import { nodeQueryResolver } from './query/node-query-resolver';
import { fungibleChainAccountsQueryResolver } from './query/fungible-chain-accounts-query-resolver';
import { transactionsFungibleChainAccountResolver } from './fields/fungible-chain-account/transactions-fungible-chain-account-resolver';
import { transfersFungibleChainAccountResolver } from './fields/fungible-chain-account/transfers-fungible-chain-account-resolver';
import { totalCountFungibleAccountTransfersConnectionResolver } from './fields/fungible-account/transfers-connection/total-count-fungible-account-transfers-connection-resolver';
import { totalCountFungibleAccountTransactionsConnectionResolver } from './fields/fungible-account/transactions-connection/total-count-fungible-account-transactions-connection-resolver';
import { totalCountFungibleChainAccountTransfersConnectionResolver } from './fields/fungible-chain-account/transfers-connection/total-count-fungible-chain-account-transfers-connection-resolver';
import { totalCountFungibleChainAccountTransactionsConnectionResolver } from './fields/fungible-chain-account/transactions-connection/total-count-fungible-chain-account-transactions-connection-resolver';
import { fungibleAccountsByPublicKeyQueryResolver } from './query/fungible-accounts-by-public-key-query-resolver';
import { transfersTransactionResultResolver } from './fields/transaction-result/transfers-transaction-result-tesolver';
import { totalCountTransactionResultTransfersConnectionResolver } from './fields/transaction-result/transfers-connection/total-count-transaction-result-transfers-connection-resolver';
import { eventsTransactionResultResolver } from './fields/transaction-result/events-transaction-result-resolver';
import { totalCountTransactionResultEventsConnectionResolver } from './fields/transaction-result/events-connection/total-count-transaction-result-events-connection-resolver';
import { transactionEventResolver } from './fields/event/transaction-event-resolver';
import { ResolverContext } from '../config/apollo-server-config';
import { nodesQueryResolver } from './query/nodes-query-resolver';
import { totalCountQueryTransactionsConnectionResolver } from './fields/query-transactions-connection/total-count-query-transactions-connection-resolver';
import { transactionSubscriptionResolver } from './subscription/transaction-subscription-resolver';
import { newBlocksSubscriptionResolver } from './subscription/new-blocks-subscription-resolver';
import { eventsSubscriptionResolver } from './subscription/events-subscription-resolver';
import { newBlocksFromDepthSubscriptionResolver } from './subscription/new-blocks-from-depth-subscription-resolver';
import { blockTransferResolver } from './fields/transfer/block-transfer-resolver';
import { DateTimeResolver } from 'graphql-scalars';
import { fungibleChainAccountsByPublicKeyQueryResolver } from './query/fungible-chain-accounts-by-public-key-query-resolver';
import { completedBlockHeightsQueryResolver } from './query/completed-block-heights-query-resolver';
import { pactQueryResolver } from './query/pact-query-resolver';
import { gasLimitEstimateQueryResolver } from './query/gas-limit-estimate-query-resolver';
import { nonFungibleAccountQueryResolver } from './query/non-fungible-account-query-resolver';
import { signersTransactionCommandResolver } from './fields/transaction-command/signers-transaction-command-resolver';
import { transactionsNonFungibleAccountResolver } from './fields/non-fungible-account/transactions-non-fungible-account-resolver';
import { nonFungibleChainAccountQueryResolver } from './query/non-fungible-chain-account-query-resolver';
import { transactionsNonFungibleChainAccountResolver } from './fields/non-fungible-chain-account/transactions-non-fungible-chain-account';
import { totalCountNonFungibleAccountTransactionsConnectionResolver } from './fields/non-fungible-account/transactions-connection/total-count-non-fungible-account-transactions-connection-resolver';
import { totalCountNonFungibleChainAccountTransactionsConnectionResolver } from './fields/non-fungible-chain-account/transactions-connection/total-count-non-fungible-chain-account-transactions-connection-resolver';
import { fungibleChainAccountQueryResolver } from './query/fungible-chain-account-query-resolver';
import { powHashBlockResolver } from './fields/block/pow-hash-block-resolver';
import { tokensQueryResolver } from './query/tokens-query';
import { chainAccountsNonFungibleAccountResolver } from './fields/non-fungible-account/chain-accounts-non-fungible-account-resolver';

export const resolvers: Resolvers<ResolverContext> = {
  DateTime: DateTimeResolver,
  Subscription: {
    transaction: transactionSubscriptionResolver,
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
    transaction: transactionQueryResolver,
    transactions: transactionsQueryResolver,
    transactionsByPublicKey: transactionsByPublicKeyQueryResolver,
    transfers: transfersQueryResolver,
    tokens: tokensQueryResolver,
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
  Node: {
    __resolveType(obj: any) {
      if (obj.difficulty && obj.powHash) {
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

      return null;
    },
  },
  TransactionInfo: {
    __resolveType: (obj: any) => {
      // if (obj.status) {
      //   return "TransactionMempoolInfo";
      // }
      return 'TransactionResult';
    },
  },
  TransactionPayload: {
    __resolveType: (obj: any) => {
      if (obj.code) {
        return 'ExecutionPayload';
      }
      return 'ContinuationPayload';
    },
  },
  IGuard: {
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
