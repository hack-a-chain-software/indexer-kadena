import BlockRepository from '@/kadena-server/repository/application/block-repository';

interface Block {
  hash: string;
  height: number;
  parentHash: string;
  canonical: boolean;
}

interface MarkCanonicalTipParams {
  tipBlock: Block;
  blocksWithHigherHeightOfTipBlock: Block[];
  blocksWithSameHeightOfTipBlock: Block[];
  blockRepository: BlockRepository;
}

export async function markCanonicalTip({
  tipBlock,
  blocksWithHigherHeightOfTipBlock,
  blocksWithSameHeightOfTipBlock,
  blockRepository,
}: MarkCanonicalTipParams): Promise<{ block: Block; canonical: boolean }[]> {
  const changes: { block: Block; canonical: boolean }[] = [];

  // Mark all blocks with higher height as non-canonical
  for (const block of blocksWithHigherHeightOfTipBlock) {
    changes.push({ block, canonical: false });
  }

  // Process the tip block and its ancestors iteratively
  let currentBlock = tipBlock;
  let currentSameHeightBlocks = blocksWithSameHeightOfTipBlock;

  while (currentBlock) {
    // Mark all blocks with same height as non-canonical except the current block
    for (const block of currentSameHeightBlocks) {
      if (block !== currentBlock) {
        changes.push({ block, canonical: false });
      }
    }

    // Mark the current block as canonical
    changes.push({ block: currentBlock, canonical: true });

    // Get parent block to check its canonical status
    const parentBlock = await blockRepository.getBlockParent(currentBlock.parentHash);
    if (!parentBlock || parentBlock.canonical !== false) {
      break;
    }

    // Get blocks at the same height as the parent for the next iteration
    const blocksWithSameHeight = await blockRepository.getBlocksWithSameHeight(
      currentBlock.parentHash,
    );

    // Move to parent block and update same height blocks for next iteration
    currentBlock = parentBlock;
    currentSameHeightBlocks = blocksWithSameHeight;
  }

  return changes;
}
