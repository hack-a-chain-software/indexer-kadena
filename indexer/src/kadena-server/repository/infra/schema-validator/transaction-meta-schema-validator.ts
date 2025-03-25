import zod from 'zod';
import { TransactionMetaOutput } from '../../application/transaction-repository';

const schema = zod.object({
  chainId: zod.number(),
  creationTime: zod.string(),
  gasLimit: zod.string().nullable(),
  gasPrice: zod.string().nullable(),
  sender: zod.string(),
  ttl: zod.string().nullable(),
});

function validate(row: any): TransactionMetaOutput {
  const res = schema.parse(row);
  return {
    chainId: res.chainId,
    creationTime: new Date(Number(res.creationTime) / 1000),
    gasLimit: res.gasLimit ?? 0,
    gasPrice: Number(res.gasPrice) ?? 0,
    sender: res.sender,
    ttl: res.ttl ?? 0,
  };
}

export const transactionMetaValidator = { validate };
