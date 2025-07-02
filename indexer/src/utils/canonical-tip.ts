import BlockRepository from '@/kadena-server/repository/application/block-repository';

interface Block {
  hash: string;
  height: number;
  chainId: string;
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

  await blockRepository.updateCanonicalStatus({
    blocks: changes.map(change => ({
      hash: change.block.hash,
      canonical: change.canonical,
    })),
  });

  changes.length = 0;

  // Process the tip block and its ancestors iteratively
  let currentBlock = tipBlock;
  let currentSameHeightBlocks = blocksWithSameHeightOfTipBlock;
  let iteration = 0;

  while (currentBlock) {
    iteration++;

    // Mark all blocks with same height as non-canonical except the current block
    for (const block of currentSameHeightBlocks) {
      if (block.hash !== currentBlock.hash) {
        changes.push({ block, canonical: false });
      }
    }

    // Mark the current block as canonical
    changes.push({ block: currentBlock, canonical: true });

    await blockRepository.updateCanonicalStatus({
      blocks: changes.map(change => ({
        hash: change.block.hash,
        canonical: change.canonical,
      })),
    });

    changes.length = 0;

    // Get parent block to check its canonical status
    const parentBlock = await blockRepository.getBlockByHash(currentBlock.parentHash);

    if (!parentBlock || parentBlock.canonical !== false) {
      break;
    }

    // Get blocks at the same height as the parent for the next iteration
    const blocksWithSameHeight = await blockRepository.getBlocksWithSameHeight(
      currentBlock.height - 1,
      currentBlock.chainId,
    );

    // Move to parent block and update same height blocks for next iteration
    currentBlock = parentBlock;
    currentSameHeightBlocks = blocksWithSameHeight;

    await blockRepository.updateCanonicalStatus({
      blocks: changes.map(change => ({
        hash: change.block.hash,
        canonical: change.canonical,
      })),
    });

    changes.length = 0;
  }

  return changes;
}
