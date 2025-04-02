import { ResolverContext } from '../config/apollo-server-config';
import { buildBlockOutput } from './output/build-block-output';
import { buildEventOutput } from './output/build-event-output';
import { buildFungibleAccount } from './output/build-fungible-account-output';
import { buildFungibleChainAccount } from './output/build-fungible-chain-account-output';
import { buildNonFungibleAccount } from './output/build-non-fungible-account-output';
import { buildNonFungibleChainAccount } from './output/build-non-fungible-chain-account-output';
import { buildTransactionOutput } from './output/build-transaction-output';
import { buildTransferOutput } from './output/build-transfer-output';

export const getNode = async (context: ResolverContext, id: string) => {
  const decodedString = Buffer.from(id, 'base64').toString('utf-8');

  const [type, params] = decodedString.split(/:(.+)/);

  if (type === 'Block') {
    const output = await context.blockRepository.getBlockByHash(params);

    return buildBlockOutput(output);
  }

  if (type === 'Event') {
    const [blockHash, orderIndex, requestKey] = JSON.parse(params);
    const output = await context.eventRepository.getEvent({
      hash: blockHash,
      orderIndex,
      requestKey,
    });

    return buildEventOutput(output);
  }

  if (type === 'FungibleAccount') {
    const [_fungible, accountName] = JSON.parse(params);
    const output = await context.balanceRepository.getAccountInfo_NODE(accountName);
    return buildFungibleAccount(output);
  }

  if (type === 'FungibleChainAccount') {
    const [chainId, fungibleName, accountName] = JSON.parse(params);
    const output = await context.balanceRepository.getChainsAccountInfo_NODE(
      accountName,
      fungibleName,
      [chainId],
    );
    return buildFungibleChainAccount(output[0]);
  }

  if (type === 'Transaction') {
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
    const [requestKey, orderIndex] = JSON.parse(params);
    const [output] = await context.transactionRepository.getSigners(requestKey, orderIndex);
    return output;
  }

  if (type === 'NonFungibleAccount') {
    const account = await context.balanceRepository.getNonFungibleAccountInfo(params);
    const nftsInfoParams = (account?.nonFungibleTokenBalances ?? []).map(n => ({
      tokenId: n.tokenId,
      chainId: n.chainId,
    }));

    const nftsInfo = await context.pactGateway.getNftsInfo(
      nftsInfoParams ?? [],
      account?.accountName ?? '',
    );
    const output = buildNonFungibleAccount(account, nftsInfo);
    return output;
  }

  if (type === 'NonFungibleChainAccount') {
    const [chainId, accountName] = JSON.parse(params);
    const account = await context.balanceRepository.getNonFungibleChainAccountInfo(
      accountName,
      chainId,
    );

    if (!account) return null;

    const nftsInfoParams = (account?.nonFungibleTokenBalances ?? []).map(n => ({
      tokenId: n.tokenId,
      chainId: n.chainId,
    }));

    const nftsInfo = await context.pactGateway.getNftsInfo(
      nftsInfoParams ?? [],
      account?.accountName ?? '',
    );
    return buildNonFungibleChainAccount(account, nftsInfo);
  }

  if (type === 'NonFungibleTokenBalance') {
    const [tokenId, accountName, chainId] = JSON.parse(params);
    const account = await context.balanceRepository.getNonFungibleTokenBalance(
      accountName,
      chainId,
      tokenId,
    );

    if (!account) return null;

    const nftsInfoParams = [{ tokenId, chainId }];

    const [nftsInfo] = await context.pactGateway.getNftsInfo(
      nftsInfoParams ?? [],
      account?.accountName ?? '',
    );

    return {
      id: account.id,
      accountName: account.accountName,
      chainId: account.chainId,
      balance: account.balance,
      tokenId: account.tokenId,
      version: nftsInfo.version,
      // TODO
      guard: {
        keys: [],
        predicate: '',
        raw: JSON.stringify('{}'),
      },
      info: {
        precision: nftsInfo.precision,
        supply: nftsInfo.supply,
        uri: nftsInfo.uri,
      },
    };
  }

  return null;
};
