import zod from "zod";
import { TransferOutput } from "../../application/transfer-repository";
import { convertStringToDate } from "../../../utils/date";

const schema = zod.object({
  id: zod.number(),
  transferAmount: zod.string(),
  blockHash: zod.string(),
  chainId: zod.number(),
  creationTime: zod.string(),
  height: zod.number(),
  moduleName: zod.string(),
  moduleHash: zod.string(),
  // orderIndex: zod.number(),
  receiverAccount: zod.string(),
  senderAccount: zod.string(),
  requestKey: zod.string(),
  pactId: zod.string().nullable(),
});

const getBase64ID = (
  blockHash: string,
  chainId: number,
  orderIndex: number,
  moduleHash: string,
  requestKey: string,
): string => {
  const inputString = `Transfer:[\"${blockHash}\",\"${chainId}\",\"${orderIndex}\",\"${moduleHash}\",\"${requestKey}\"]`;
  const base64ID = Buffer.from(inputString, "utf-8").toString("base64");
  return base64ID;
};

function validate(row: any): TransferOutput {
  const res = schema.parse(row);
  return {
    id: getBase64ID(
      res.blockHash,
      res.chainId,
      0, // orderIndex
      res.moduleHash,
      res.requestKey,
    ),
    amount: res.transferAmount,
    blockHash: res.blockHash,
    moduleName: res.moduleName,
    orderIndex: 0, // orderIndex
    receiverAccount: res.receiverAccount,
    senderAccount: res.senderAccount,
    transferId: res.id.toString(),
    pactId: res.pactId,
  };
}

export const transferSchemaValidator = { validate };