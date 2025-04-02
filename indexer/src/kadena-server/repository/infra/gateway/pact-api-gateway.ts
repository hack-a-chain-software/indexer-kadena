import { handleSingleQuery } from '../../../utils/raw-query';
import PactGateway, { GetNftsInfoParams } from '../../gateway/pact-gateway';

export default class PactApiGateway implements PactGateway {
  async getNftsInfo(data: GetNftsInfoParams, account: string) {
    const promises = data.map(async nft => {
      const query = {
        chainId: nft.chainId,
        code: `(marmalade-v2.ledger.get-token-info \"${nft.tokenId}\")`,
      };
      const res = await handleSingleQuery(query);
      const result = JSON.parse(res.result ?? '{}');

      const versionQuery = {
        chainId: nft.chainId,
        code: `(marmalade-v2.ledger.get-version \"${nft.tokenId}\")`,
      };
      const versionRes = await handleSingleQuery(versionQuery);
      const versionResult = JSON.parse(versionRes.result ?? '{}');

      const balanceQuery = {
        chainId: nft.chainId,
        code: `(marmalade-v2.ledger.details "${nft.tokenId}" "${account}")`,
      };
      const balanceRes = await handleSingleQuery(balanceQuery);
      const balanceResult = JSON.parse(balanceRes.result ?? '{}');

      return {
        version: versionResult.int ?? 'unknown',
        uri: result.uri ?? 'unknown',
        supply: result?.supply ? Number(result.supply) : 0,
        precision: result?.precision?.int ? Number(result.precision.int) : 0,
        balance: balanceResult.balance ? Number(balanceResult.balance) : 0,
        guard: {
          keys: balanceResult?.guard?.keys ?? [],
          predicate: balanceResult?.guard?.pred ?? '',
          raw: JSON.stringify({
            keys: balanceResult?.guard?.keys ?? [],
            predicate: balanceResult?.guard?.pred ?? '',
          }),
        },
      };
    });

    const nfts = await Promise.all(promises);
    return nfts;
  }
}
