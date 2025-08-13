import { PageInfo, Transfer } from '../../config/graphql-types';
import { PaginationsParams } from '../pagination';
import { ConnectionEdge } from '../types';

export type GetTransfersParams = GetTotalCountParams &
  PaginationsParams & {
    orderIndex?: number | null;
    moduleHash?: string | null;
  };

export type GetTransfersByTransactionIdParams = {
  transactionId: string;
} & PaginationsParams;

export interface GetTotalCountParams {
  accountName?: string | null;
  blockHash?: string | null;
  chainId?: string | null;
  fungibleName?: string | null;
  requestKey?: string | null;
  transactionId?: string | null;
  hasTokenId?: boolean | null;
}

export interface GetCrossChainTransferByPactIdParams {
  pactId: string;
  amount: string;
  receiverAccount: string;
  senderAccount: string;
}

export type TransferOutput = Omit<Transfer, 'block' | 'transaction' | 'crossChainTransfer'> & {
  transferId: string;
  pactId: string | null;
  blockHash: string;
};

export default interface TransferRepository {
  getTransfers(params: GetTransfersParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<TransferOutput>[];
  }>;
  getTransfersByTransactionId(params: GetTransfersByTransactionIdParams): Promise<{
    pageInfo: PageInfo;
    edges: ConnectionEdge<TransferOutput>[];
  }>;
  getCrossChainTransferByPactId(
    params: GetCrossChainTransferByPactIdParams,
  ): Promise<TransferOutput | null>;
  getTotalCountOfTransfers(params: GetTotalCountParams): Promise<number>;
}
