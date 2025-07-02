import BlockDbRepository from '@/kadena-server/repository/infra/repository/block-db-repository';
import { markCanonicalTip } from '@/utils/canonical-tip';

const blockRepository = new BlockDbRepository();

const HEIGHT_CANONICAL_DEPTH = process.env.HEIGHT_CANONICAL_DEPTH
  ? Number(process.env.HEIGHT_CANONICAL_DEPTH)
  : 5;

export async function defineCanonicalInStreaming(blockHash: string) {
  const canonicalTipHash = await blockRepository.getBlockNParent(HEIGHT_CANONICAL_DEPTH, blockHash);
  if (!canonicalTipHash) {
    console.log('[ERROR][DATA][DATA_CORRUPT] Error defining canonical in streaming:', blockHash);
    return;
  }
  const tipBlock = await blockRepository.getBlockByHash(canonicalTipHash);
  if (!tipBlock) {
    throw new Error('Tip block not found');
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
    await markCanonicalTip({
      blockRepository,
      blocksWithSameHeightOfTipBlock,
      blocksWithHigherHeightOfTipBlock,
      tipBlock,
    });
  } catch (error) {
    console.error('Error defining canonical:', error);
  }
}
