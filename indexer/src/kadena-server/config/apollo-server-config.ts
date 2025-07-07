/**
 * Apollo Server configuration for the Kadena Indexer GraphQL API
 *
 * This file defines the configuration for the Apollo Server GraphQL implementation,
 * including:
 * - The resolver context structure with repositories and data loaders
 * - Factory function for creating contexts with properly initialized dependencies
 * - PubSub instance for GraphQL subscriptions
 *
 * The configuration follows the dependency injection pattern, providing all necessary
 * data access components through the context object that's available to all resolvers.
 */

import DataLoader from 'dataloader';
import BlockRepository, { BlockOutput } from '../repository/application/block-repository';
import TransactionRepository, {
  TransactionOutput,
} from '../repository/application/transaction-repository';
import BalanceRepository from '../repository/application/balance-repository';
import EventRepository from '../repository/application/event-repository';
import TransferRepository from '../repository/application/transfer-repository';
import NetworkRepository from '../repository/application/network-repository';
import PoolRepository from '../repository/application/pool-repository';
import BlockDbRepository from '../repository/infra/repository/block-db-repository';
import TransactionDbRepository from '../repository/infra/repository/transaction-db-repository';
import BalanceDbRepository from '../repository/infra/repository/balance-db-repository';
import EventDbRepository from '../repository/infra/repository/event-db-repository';
import TransferDbRepository from '../repository/infra/repository/transfer-db-repository';
import NetworkDbRepository from '../repository/infra/repository/network-db-repository';
import PoolDbRepository from '../repository/infra/repository/pool-db-repository';
import GasGateway from '../repository/gateway/gas-gateway';
import GasApiGateway from '../repository/infra/gateway/gas-api-gateway';
import MempoolGateway from '../repository/gateway/mempool-gateway';
import MempoolApiGateway from '../repository/infra/gateway/mempool-api-gateway';
import PactGateway from '../repository/gateway/pact-gateway';
import PactApiGateway from '../repository/infra/gateway/pact-api-gateway';
import { LiquidityPositionRepository } from '../repository/application/liquidity-position-repository';
import LiquidityPositionDbRepository from '../repository/infra/repository/liquidity-position-db-repository';
import { DexMetricsRepository } from '../repository/application/dex-metrics-repository';
import DexMetricsDbRepository from '../repository/infra/repository/dex-metrics-db-repository';
import { TokenPriceRepository } from '../repository/application/token-price-repository';
import TokenPriceDbRepository from '../repository/infra/repository/token-price-db-repository';

export const DEFAULT_PROTOCOL = 'n_bd19ba92f0449d4422e620740759c9e94cacdb37.sushi-exchange';

/**
 * Resolver context type definition for the GraphQL API
 *
 * This type defines the shape of the context object that is passed to all GraphQL resolvers.
 * It contains:
 *
 * 1. Data loaders for efficient batched data access:
 *    - Blocks by hashes, transaction IDs, and event IDs
 *    - Transactions by event IDs
 *
 * 2. Repository interfaces for database access:
 *    - Balance repository for account and token data
 *    - Block repository for blockchain blocks
 *    - Event repository for blockchain events
 *    - Transfer repository for token transfers
 *    - Transaction repository for blockchain transactions
 *    - Network repository for blockchain network information
 *
 * 3. Gateway interfaces for external API access:
 *    - Gas gateway for gas estimation
 *    - Mempool gateway for pending transaction data
 *    - Pact gateway for interacting with Pact smart contracts
 *
 * 4. Utilities for GraphQL operations:
 *    - PubSub for subscriptions
 *    - AbortSignal for controlling subscription lifetimes
 */
export type ResolverContext = {
  /**
   * DataLoader for efficiently batching and caching block lookups by hash
   *
   * Instead of making individual database queries for each block hash,
   * this DataLoader collects all requested hashes during a single tick of the event loop
   * and makes a single optimized database query. This provides two main benefits:
   * 1. Reduces database load by minimizing the number of queries
   * 2. Improves performance by avoiding redundant queries for the same block
   */
  getBlocksByHashesLoader: DataLoader<string, BlockOutput>;

  /**
   * DataLoader for efficiently batching and caching block lookups by transaction ID
   *
   * This loader finds blocks that contain specific transactions, using the same
   * batching and caching pattern to optimize database access.
   */
  getBlocksByTransactionIdsLoader: DataLoader<string, BlockOutput>;

  /**
   * DataLoader for efficiently batching and caching block lookups by event ID
   *
   * This loader finds blocks that contain specific events, optimizing the common
   * pattern where resolvers need to access the block associated with an event.
   */
  getBlocksByEventIdsLoader: DataLoader<string, BlockOutput>;

  /**
   * DataLoader for efficiently batching and caching transaction lookups by event ID
   *
   * This loader finds transactions that contain specific events, which is useful
   * for resolving the transaction field of event objects efficiently.
   */
  getTransactionsByEventIdsLoader: DataLoader<string, TransactionOutput>;

  balanceRepository: BalanceRepository;
  blockRepository: BlockRepository;
  eventRepository: EventRepository;
  transferRepository: TransferRepository;
  transactionRepository: TransactionRepository;
  networkRepository: NetworkRepository;
  poolRepository: PoolRepository;
  gasGateway: GasGateway;
  mempoolGateway: MempoolGateway;
  pactGateway: PactGateway;
  signal: AbortSignal;
  liquidityPositionRepository: LiquidityPositionRepository;
  dexMetricsRepository: DexMetricsRepository;
  tokenPriceRepository: TokenPriceRepository;
};

/**
 * Factory function that creates a fully initialized GraphQL resolver context
 *
 * This function instantiates all the necessary components for the GraphQL API:
 * 1. Creates concrete implementations of all repository interfaces
 * 2. Creates concrete implementations of all gateway interfaces
 * 3. Initializes DataLoaders with their respective batch loading functions
 * 4. Sets up the PubSub instance and abort signal for subscriptions
 *
 * The function follows the Repository Pattern, providing specific implementations
 * while exposing only the abstract interfaces to the resolvers, which promotes
 * loose coupling and makes the system more testable.
 *
 * @returns Promise resolving to a fully initialized resolver context
 */
export const createGraphqlContext = () => {
  const blockRepository = new BlockDbRepository();
  const transactionRepository = new TransactionDbRepository();
  const context = {
    blockRepository,
    transactionRepository,
    balanceRepository: new BalanceDbRepository(),
    eventRepository: new EventDbRepository(),
    transferRepository: new TransferDbRepository(),
    networkRepository: new NetworkDbRepository(),
    poolRepository: new PoolDbRepository(),
    gasGateway: new GasApiGateway(),
    mempoolGateway: new MempoolApiGateway(),
    pactGateway: new PactApiGateway(),
    signal: new AbortController().signal,
    liquidityPositionRepository: new LiquidityPositionDbRepository(),
    dexMetricsRepository: new DexMetricsDbRepository(),
    tokenPriceRepository: new TokenPriceDbRepository(),
  };

  return Promise.resolve({
    ...context,
    // Initialize DataLoader for batch-loading blocks by their hashes
    // When multiple resolvers request blocks with different hashes in a single GraphQL query,
    // these requests will be combined into a single database query
    getBlocksByHashesLoader: new DataLoader(hashes =>
      blockRepository.getBlockByHashes(hashes as string[]),
    ),

    // Initialize DataLoader for batch-loading blocks by event IDs
    // This optimizes the common case where we need to find which block contains a specific event
    getBlocksByEventIdsLoader: new DataLoader(eventIds =>
      blockRepository.getBlocksByEventIds(eventIds as string[]),
    ),

    // Initialize DataLoader for batch-loading transactions by event IDs
    // This optimizes resolving the transaction that contains a specific event
    getTransactionsByEventIdsLoader: new DataLoader(eventIds =>
      transactionRepository.getTransactionsByEventIds(eventIds as string[]),
    ),

    // Initialize DataLoader for batch-loading blocks by transaction IDs
    // This optimizes finding which block contains a specific transaction
    getBlocksByTransactionIdsLoader: new DataLoader(hashes =>
      blockRepository.getBlocksByTransactionIds(hashes as string[]),
    ),
  });
};
