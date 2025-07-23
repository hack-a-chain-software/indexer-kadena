/**
 * Utilities for Node interface resolution in the GraphQL API
 *
 * This file implements the Relay Global Object Identification specification,
 * which allows clients to fetch any entity in the system using a global ID.
 * It provides a central function for decoding global IDs and retrieving the
 * corresponding objects from the appropriate repositories.
 *
 * The implementation supports all entity types that implement the Node interface
 * in the GraphQL schema, including:
 * - Blocks
 * - Events
 * - Transactions
 * - Transfers
 * - FungibleAccounts
 * - FungibleChainAccounts
 * - NonFungibleAccounts
 * - NonFungibleChainAccounts
 * - NonFungibleTokenBalances
 * - Signers
 */

import { ResolverContext } from '../config/apollo-server-config';
import { QueryPoolArgs } from '../config/graphql-types';
import { buildBlockOutput } from './output/build-block-output';
import { buildEventOutput } from './output/build-event-output';
import { buildFungibleAccount } from './output/build-fungible-account-output';
import { buildFungibleChainAccount } from './output/build-fungible-chain-account-output';
import { buildNonFungibleAccount } from './output/build-non-fungible-account-output';
import { buildNonFungibleChainAccount } from './output/build-non-fungible-chain-account-output';
import { buildTransactionOutput } from './output/build-transaction-output';
import { buildTransferOutput } from './output/build-transfer-output';

/**
 * Resolves a Node by its global ID across all supported entity types
 *
 * This function implements the core of the Relay Global Object Identification specification.
 * It decodes the base64-encoded global ID to extract the type and parameters,
 * then retrieves the corresponding entity from the appropriate repository.
 *
 * The function handles different entity types with specialized processing:
 * - For each entity type, it parses the necessary parameters from the ID
 * - It calls the appropriate repository method to fetch the entity data
 * - It transforms the database entity into a GraphQL-compatible format using builder functions
 * - For some entity types (like NonFungibleAccounts), it fetches additional data from external sources
 *
 * The encoding format for global IDs is: base64(type:parameters)
 * Where parameters can be a simple string or a JSON-encoded array of values.
 *
 * @param context - The resolver context containing repository access
 * @param id - The base64-encoded global ID
 * @returns The resolved entity or null if not found or unrecognized type
 */
export const getNode = async (context: ResolverContext, id: string) => {
  const decodedString = Buffer.from(id, 'base64').toString('utf-8');

  const [type, params] = decodedString.split(/:(.+)/);

  if (type === 'Block') {
    // Resolve Block node - only requires the block hash as a parameter
    const output = await context.blockRepository.getBlockByHash(params);
    if (!output) {
      throw new Error('[ERROR][DB][DATA_MISSING] Block not found.');
    }
    return buildBlockOutput(output);
  }

  if (type === 'Event') {
    // Resolve Event node - requires blockHash, orderIndex, and requestKey
    const [blockHash, orderIndex, requestKey] = JSON.parse(params);
    const output = await context.eventRepository.getEvent({
      hash: blockHash,
      orderIndex,
      requestKey,
    });
    return buildEventOutput(output);
  }

  if (type === 'FungibleAccount') {
    // Resolve FungibleAccount node - requires account name
    const [_fungible, accountName] = JSON.parse(params);
    const output = await context.balanceRepository.getAccountInfo_NODE(accountName);
    return buildFungibleAccount(output);
  }

  if (type === 'FungibleChainAccount') {
    // Resolve FungibleChainAccount node - requires chainId, fungibleName, and accountName
    const [chainId, fungibleName, accountName] = JSON.parse(params);
    const output = await context.balanceRepository.getChainsAccountInfo_NODE(
      accountName,
      fungibleName,
      [chainId],
    );
    return buildFungibleChainAccount(output[0]);
  }

  if (type === 'Transaction') {
    // Resolve Transaction node - requires blockHash and requestKey
    const [blockHash, requestKey] = JSON.parse(params);
    const output = await context.transactionRepository.getTransactionsByRequestKey({
      requestKey,
      blockHash,
    });

    const outputs = output.map(t => buildTransactionOutput(t));
    return {
      ...outputs[0],
      orphanedTransactions: outputs.slice(1),
    };
  }

  if (type === 'Transfer') {
    // Resolve Transfer node - requires blockHash, chainId, orderIndex, moduleHash, and requestKey
    const [blockHash, chainId, orderIndex, moduleHash, requestKey] = JSON.parse(params);
    const output = await context.transferRepository.getTransfers({
      blockHash,
      chainId,
      orderIndex,
      moduleHash,
      requestKey,
      first: 1,
      last: 1,
    });
    return buildTransferOutput(output.edges[0].node);
  }

  if (type === 'Signer') {
    // Resolve Signer node - requires requestKey and orderIndex
    const [requestKey, orderIndex] = JSON.parse(params);
    const [output] = await context.transactionRepository.getSigners({ requestKey, orderIndex });
    return output;
  }

  if (type === 'NonFungibleAccount') {
    // Resolve NonFungibleAccount node - requires account name
    // Also fetches additional NFT information from the blockchain
    const account = await context.balanceRepository.getNonFungibleAccountInfo(params);

    if (!account) return null;

    const nftsInfo = await context.pactGateway.getNftsInfo(
      account.accountName,
      account.nonFungibleTokenBalances,
    );
    const output = buildNonFungibleAccount(account, nftsInfo);
    return output;
  }

  if (type === 'NonFungibleChainAccount') {
    // Resolve NonFungibleChainAccount node - requires chainId and accountName
    // Also fetches additional NFT information from the blockchain
    const [chainId, accountName] = JSON.parse(params);
    const account = await context.balanceRepository.getNonFungibleChainAccountInfo(
      accountName,
      chainId,
    );

    if (!account) return null;

    const nftsInfo = await context.pactGateway.getNftsInfo(
      account.accountName,
      account.nonFungibleTokenBalances,
    );
    return buildNonFungibleChainAccount(account, nftsInfo);
  }

  if (type === 'NonFungibleTokenBalance') {
    // Resolve NonFungibleTokenBalance node - requires tokenId, accountName, and chainId
    // Also fetches additional NFT token information from the blockchain
    const [tokenId, accountName, chainId] = JSON.parse(params);
    const account = await context.balanceRepository.getNonFungibleTokenBalance(
      accountName,
      chainId,
      tokenId,
    );

    if (!account) return null;

    const [nftsInfo] = await context.pactGateway.getNftsInfo(account.accountName, [account]);

    return {
      id: account.id,
      accountName: account.accountName,
      chainId: account.chainId,
      balance: account.balance,
      tokenId: account.tokenId,
      version: nftsInfo.version,
      guard: nftsInfo.guard,
      info: {
        precision: nftsInfo.precision,
        supply: nftsInfo.supply,
        uri: nftsInfo.uri,
      },
    };
  }

  if (type === 'Pool') {
    // Resolve Pool node - requires poolId
    const [poolId] = JSON.parse(params);
    const output = await context.poolRepository.getPool({ id: poolId } as QueryPoolArgs);
    return output;
  }

  return null;
};
