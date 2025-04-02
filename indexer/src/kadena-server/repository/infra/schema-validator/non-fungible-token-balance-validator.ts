import zod from 'zod';
import { INonFungibleTokenBalance } from '../../application/balance-repository';

const nonFungibleTokenBalanceSchema = zod.object({
  id: zod.number(),
  account: zod.string(),
  chainId: zod.number(),
  tokenId: zod.string(),
  balance: zod.string(),
  module: zod.string(),
});

const getBase64ID = (tokenId: string, accountName: string, chainId: number): string => {
  const inputString = `NonFungibleTokenBalance:[\"${tokenId}\",\"${accountName}\",\"${chainId}\"]`;
  const base64ID = Buffer.from(inputString, 'utf-8').toString('base64');
  return base64ID;
};

const validate = (row: any): INonFungibleTokenBalance => {
  const res = nonFungibleTokenBalanceSchema.parse(row);
  return {
    id: getBase64ID(res.tokenId, res.account, res.chainId),
    accountName: res.account,
    balance: Number(res.balance),
    chainId: res.chainId.toString(),
    module: res.module,
    tokenId: res.tokenId,
  };
};

export const nonFungibleTokenBalanceValidator = {
  validate,
};
