/**
 * Builder function for transforming database block entities into GraphQL-compatible format
 *
 * This file is responsible for preparing block data from the database to be returned through
 * the GraphQL API. It transforms a BlockOutput from the repository into a format that matches
 * the Block type in the GraphQL schema, including placeholders for fields that will be resolved
 * by field resolvers.
 */

import {
  Block,
  BlockEventsConnection,
  BlockTransactionsConnection,
  FungibleChainAccount,
} from '../../config/graphql-types';
import { BlockOutput } from '../../repository/application/block-repository';

/**
 * Transforms a database block entity into a GraphQL-compatible format
 *
 * This function takes a BlockOutput from the database repository and converts it into
 * a structure that matches the Block type in the GraphQL schema. It preserves all the
 * scalar properties from the original block entity and adds placeholder objects for
 * related entities that will be resolved by separate field resolvers.
 *
 * The placeholder objects (parent, events, minerAccount, transactions) allow the
 * GraphQL resolver system to identify which fields need to be resolved, while avoiding
 * unnecessary database queries for fields that aren't requested in the client query.
 *
 * @param output - The block entity from the database repository
 * @returns A GraphQL-compatible block object with placeholders for related entities
 */
export const buildBlockOutput = (output: BlockOutput) => {
  return {
    ...output,
    canonical: output.canonical ?? false,
    // for resolvers
    parent: {} as Block,
    events: {} as BlockEventsConnection,
    minerAccount: {} as FungibleChainAccount,
    transactions: {} as BlockTransactionsConnection,
  };
};
