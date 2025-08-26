import { GetTransactionsByPactCodeParams } from '../../application/transaction-repository';
import { getPageInfo, getPaginationParams } from '../../pagination';
import { searchTransactionsByPactCode } from '@/search/transactions-by-code.repository';

export class TransactionSearchRepository {
  async getTransactionsByPactCode(params: GetTransactionsByPactCodeParams) {
    const { after: afterEncoded, before: beforeEncoded, first, last, pactCode } = params;

    const { limit, order, after, before } = getPaginationParams({
      after: afterEncoded,
      before: beforeEncoded,
      first,
      last,
    });

    const rows = await searchTransactionsByPactCode({
      pactCode,
      limit,
      order: order as 'ASC' | 'DESC',
      after,
      before,
    });

    const edges = rows.slice(0, limit).map(tx => ({
      cursor: `${tx.creationTime.toString()}:${tx.id.toString()}`,
      node: {
        creationTime: tx.creationTime.toString(),
        requestKey: tx.requestKey,
        chainId: tx.chainId.toString(),
        height: tx.height.toString(),
        canonical: tx.canonical,
        gas: tx.gas,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        sender: tx.sender,
      },
    }));

    return getPageInfo({ edges, order, limit, after, before });
  }
}
