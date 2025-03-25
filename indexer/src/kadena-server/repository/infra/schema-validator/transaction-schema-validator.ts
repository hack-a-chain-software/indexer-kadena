import { getRequiredEnvString } from '../../../../utils/helpers';
import { TransactionOutput } from '../../application/transaction-repository';
import zod from 'zod';

const NETWORK_ID = getRequiredEnvString('SYNC_NETWORK');

const getBase64ID = (blockHash: string, requestKey: string): string => {
  const inputString = `Transaction:[\"${blockHash}\",\"${requestKey}\"]`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

const schema = zod.object({
  id: zod.number(),
  hashTransaction: zod.string(),
  txid: zod.string().nullable(),
  sigs: zod.array(zod.any()).nullable(),
  continuation: zod.any().nullable(),
  eventCount: zod.number(),
  gas: zod.string().nullable(),
  height: zod.number(),
  logs: zod.string(),
  code: zod.any().nullable(),
  data: zod.any().nullable(),
  pactId: zod.string().nullable(),
  proof: zod.string().nullable(),
  step: zod.number().nullable(),
  rollback: zod.boolean().nullable(),
  nonceTransaction: zod.string().nullable(),
  blockHash: zod.string(),
  requestKey: zod.string(),
  result: zod.any(),
});

function validate(row: any): TransactionOutput {
  const res = schema.parse(row);
  const isSuccess = res.result.status === 'success';
  const continuation = JSON.stringify(res.continuation);
  return {
    id: getBase64ID(res.blockHash, res.requestKey),
    databaseTransactionId: res.id.toString(),
    blockHeight: res.height,
    blockHash: res.blockHash,
    hash: res.hashTransaction,
    sigs: res.sigs ?? [],
    result: {
      // TransactionMempoolInfo
      status: '', // TODO

      // TransactionResult
      badResult: !isSuccess ? res.result.data : null,
      continuation: continuation === '{}' ? null : continuation,
      eventCount: res.eventCount,
      transactionId: res.txid ? res.txid : null,
      height: res.height,

      gas: res.gas,
      goodResult: isSuccess ? JSON.stringify(res.result.data) : null,
      logs: res.logs,
    },
    cmd: {
      payload: {
        // ExecutionPayload
        code: JSON.stringify(res.code),

        // ContinuationPayload and ExecutionPayload
        data: JSON.stringify(res.data),

        // ContinuationPayload
        pactId: res.pactId,
        proof: res.proof,
        rollback: res.rollback,
        step: res.step,
      },

      networkId: NETWORK_ID,
      nonce: row.nonceTransaction ?? '',
    },
  };
}

export const transactionValidator = { validate };
