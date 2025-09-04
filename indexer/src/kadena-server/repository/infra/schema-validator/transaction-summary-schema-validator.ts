import { TransactionByPactCodeOutput } from '@/kadena-server/repository/application/transaction-repository';
import { z } from 'zod';

const schema = z.object({
  requestKey: z.string(),
  height: z.number(),
  chainId: z.number(),
  canonical: z.boolean(),
  creationTime: z.string(),
  result: z.any(),
  sender: z.string(),
  gas: z.string(),
  gasLimit: z.string(),
  gasPrice: z.string(),
  code: z.any().nullable(),
});

function validate(row: any): TransactionByPactCodeOutput {
  const res = schema.parse(row);
  const isSuccess = row.result.status === 'success';
  return {
    requestKey: res.requestKey,
    height: res.height,
    chainId: res.chainId,
    canonical: res.canonical,
    creationTime: new Date(Number(res.creationTime) * 1000),
    badResult: !isSuccess ? JSON.stringify(res.result.error) : null,
    sender: res.sender,
    gas: res.gas,
    gasLimit: res.gasLimit,
    gasPrice: res.gasPrice,
    code: res.code ? JSON.stringify(res.code) : null,
  };
}

export const transactionSummaryValidator = { validate };
