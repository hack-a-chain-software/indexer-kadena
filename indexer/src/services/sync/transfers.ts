import { handleSingleQuery } from '../../kadena-server/utils/raw-query';
import { TransactionAttributes, TransactionCreationAttributes } from '../../models/transaction';
import { TransferAttributes } from '../../models/transfer';
import { getContract, saveContract, syncContract } from './contract';

/**
 * Filters and processes NFT transfer events from a payload's event data. It identifies NFT transfer events based on
 * predefined criteria (e.g., event name and parameter structure), and constructs transfer attribute objects for each.
 *
 * @param {number} chainId - The ID of the blockchain chain.
 * @param {Array} eventsData - The array of event data from a transaction payload.
 * @param {TransactionAttributes} transactionAttributes - Transaction attributes associated with the events.
 * @param {any} receiptInfo - Receipt information associated with the events.
 * @returns {Promise<TransferAttributes[]>} A Promise that resolves to an array of transfer attributes specifically for NFT transfers.
 */
export function getNftTransfers(
  chainId: number,
  eventsData: any,
  transactionAttributes: TransactionAttributes,
) {
  const TRANSFER_NFT_SIGNATURE = 'TRANSFER';
  const TRANSFER_NFT_PARAMS_LENGTH = 4;

  const transferNftSignature = (eventData: any) =>
    eventData.name == TRANSFER_NFT_SIGNATURE &&
    eventData.params.length == TRANSFER_NFT_PARAMS_LENGTH &&
    typeof eventData.params[0] == 'string' &&
    typeof eventData.params[1] == 'string' &&
    typeof eventData.params[2] == 'string' &&
    typeof eventData.params[3] == 'number';

  const transferPromises = eventsData
    .filter(transferNftSignature)
    .map(async (eventData: any, index: number): Promise<TransferAttributes> => {
      const params = eventData.params;
      const tokenId = params[0];
      const from_acct = params[1];
      const to_acct = params[2];
      const amount = params[3];

      const modulename = eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name;

      let contractId = await syncContract(chainId, modulename, tokenId);

      return {
        amount: amount,
        chainId: transactionAttributes.chainId,
        from_acct: from_acct,
        modulehash: eventData.moduleHash,
        modulename: modulename,
        requestkey: transactionAttributes.requestkey,
        to_acct: to_acct,
        hasTokenId: true,
        tokenId: tokenId,
        type: 'poly-fungible',
        contractId: contractId,
        orderIndex: index,
      } as TransferAttributes;
    }) as TransferAttributes[];
  return Promise.all(transferPromises);
}

const requests: Record<string, undefined | boolean> = {};

/**
 * Filters and processes coin transfer events from a payload's event data. Similar to `getNftTransfers`, but focuses on
 * coin-based transactions. It identifies events that represent coin transfers and constructs transfer attribute objects.
 *
 * @param {Array} eventsData - The array of event data from a transaction payload.
 * @param {TransactionAttributes} transactionAttributes - Transaction attributes associated with the events.
 * @param {any} requestKey - Associated to the T.
 * @returns {Promise<TransferAttributes[]>} A Promise that resolves to an array of transfer attributes specifically for coin transfers.
 */
export function getCoinTransfers(
  eventsData: any,
  transactionAttributes: TransactionCreationAttributes,
) {
  const TRANSFER_COIN_SIGNATURE = 'TRANSFER';
  const TRANSFER_COIN_PARAMS_LENGTH = 3;

  const transferCoinSignature = (eventData: any) =>
    eventData.name == TRANSFER_COIN_SIGNATURE &&
    eventData.params.length == TRANSFER_COIN_PARAMS_LENGTH &&
    typeof eventData.params[0] == 'string' &&
    typeof eventData.params[1] == 'string' &&
    typeof eventData.params[2] == 'number';

  const transferPromises = eventsData
    .filter(transferCoinSignature)
    .map(async (eventData: any, index: number): Promise<TransferAttributes> => {
      const modulename = eventData.module.namespace
        ? `${eventData.module.namespace}.${eventData.module.name}`
        : eventData.module.name;
      const chainId = transactionAttributes.chainId;

      let contractId;
      let contract = await getContract(chainId, modulename);

      if (contract) {
        contractId = contract.id;
      } else if (!requests[`(${modulename}.precision)`]) {
        requests[`(${modulename}.precision)`] = true;
        const precisionData = await handleSingleQuery({
          chainId: chainId.toString(),
          code: `(${modulename}.precision)`,
        });
        if (precisionData.result) {
          contractId = await saveContract(
            chainId,
            modulename,
            'fungible',
            null,
            null,
            Number(JSON.parse(precisionData.result).int),
          );
        }
        requests[`(${modulename}.precision)`] = false;
      }

      const params = eventData.params;
      const from_acct = params[0];
      const to_acct = params[1];
      const amount = params[2];
      return {
        amount: amount,
        chainId: transactionAttributes.chainId,
        from_acct: from_acct,
        modulehash: eventData.moduleHash,
        modulename: eventData.module.namespace
          ? `${eventData.module.namespace}.${eventData.module.name}`
          : eventData.module.name,
        requestkey: transactionAttributes.requestkey,
        to_acct: to_acct,
        hasTokenId: false,
        tokenId: undefined,
        type: 'fungible',
        contractId: contractId,
        orderIndex: index,
      } as TransferAttributes;
    }) as TransferAttributes[];
  return Promise.all(transferPromises);
}
