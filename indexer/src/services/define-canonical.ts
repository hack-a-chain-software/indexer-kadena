import BlockDbRepository from '@/kadena-server/repository/infra/repository/block-db-repository';
import { increaseCounters } from '@/services/counters';
import { markCanonicalTip } from '@/utils/canonical-tip';

const blockRepository = new BlockDbRepository();

export async function defineCanonicalInStreaming(blockHash: string) {
  const tipBlock = await blockRepository.getBlockByHash(blockHash);
  if (!tipBlock) {
    console.error('[ERROR][DATA][DATA_CORRUPT] Error defining canonical in streaming:', blockHash);
    return;
  }

  try {
    const blocksWithSameHeightOfTipBlock = await blockRepository.getBlocksWithSameHeight(
      tipBlock.height,
      tipBlock.chainId,
    );
    const blocksWithHigherHeightOfTipBlock = await blockRepository.getBlocksWithHeightHigherThan(
      tipBlock.height,
      tipBlock.chainId,
    );
    const {
      blocksBecameCanonical,
      blocksBecameNonCanonical,
      transactionsBecameCanonical,
      transactionsBecameNonCanonical,
    } = await markCanonicalTip({
      blockRepository,
      blocksWithSameHeightOfTipBlock,
      blocksWithHigherHeightOfTipBlock,
      tipBlock,
    });

    await increaseCounters({
      canonicalBlocksCount: blocksBecameCanonical - blocksBecameNonCanonical,
      orphansBlocksCount: blocksBecameNonCanonical - blocksBecameCanonical,
      canonicalTransactionsCount: transactionsBecameCanonical - transactionsBecameNonCanonical,
      orphanTransactionsCount: transactionsBecameNonCanonical - transactionsBecameCanonical,
      chainId: tipBlock.chainId,
    });
  } catch (error) {
    console.error('Error defining canonical:', error);
  }
}
