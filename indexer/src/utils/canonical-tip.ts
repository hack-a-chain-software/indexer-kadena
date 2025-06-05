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

const TARGET_HEIGHT = 5000000;

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

  // Calculate total height range to process
  const startHeight = currentBlock.height;
  const heightDifference = startHeight - TARGET_HEIGHT;

  while (currentBlock) {
    const start = Date.now();
    iteration++;

    console.log(
      `[DEBUG] Processing block at height ${currentBlock.height}, hash ${currentBlock.hash}`,
    );

    // Mark all blocks with same height as non-canonical except the current block
    for (const block of currentSameHeightBlocks) {
      if (block.hash !== currentBlock.hash) {
        changes.push({ block, canonical: false });
      }
    }

    // Mark the current block as canonical
    changes.push({ block: currentBlock, canonical: true });

    console.log(`[DEBUG] Updating canonical status for ${changes.length} blocks`);
    await blockRepository.updateCanonicalStatus({
      blocks: changes.map(change => ({
        hash: change.block.hash,
        canonical: change.canonical,
      })),
    });
    console.log('[DEBUG] Canonical status updated');

    changes.length = 0;

    // Get parent block to check its canonical status
    // console.log(`[DEBUG] Looking up parent block with hash ${currentBlock.parentHash}`);
    const parentBlock = await blockRepository.getBlockParent(currentBlock.parentHash);
    console.log(
      `[DEBUG] Parent block lookup result: ${parentBlock ? 'found' : 'not found'}, canonical: ${parentBlock?.canonical}`,
    );

    if (!parentBlock || parentBlock.canonical !== false) {
      console.log('[DEBUG] Breaking loop - parent block not found or already canonical');
      break;
    }

    // Get blocks at the same height as the parent for the next iteration
    // console.log(`[DEBUG] Getting blocks at height ${currentBlock.height - 1}`);
    const blocksWithSameHeight = await blockRepository.getBlocksWithSameHeight(
      currentBlock.height - 1,
      currentBlock.chainId,
    );
    console.log(`[DEBUG] Found ${blocksWithSameHeight.length} blocks at same height as parent`);

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

    // Calculate and show progress
    const currentProgress = ((startHeight - currentBlock.height) / heightDifference) * 100;
    console.log(
      `Progress: ${currentProgress.toFixed(2)}% (Height: ${currentBlock.height}) (${Date.now() - start}ms)`,
    );
  }

  return changes;
}
