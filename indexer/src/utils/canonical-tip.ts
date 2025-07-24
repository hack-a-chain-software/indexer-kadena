import BlockRepository, {
  BlockOutput,
} from '@/kadena-server/repository/application/block-repository';

interface MarkCanonicalTipParams {
  tipBlock: BlockOutput;
  blocksWithHigherHeightOfTipBlock: BlockOutput[];
  blocksWithSameHeightOfTipBlock: BlockOutput[];
  blockRepository: BlockRepository;
}

export interface CanonicalCounts {
  blocksBecameCanonical: number;
  blocksBecameNonCanonical: number;
  transactionsBecameCanonical: number;
  transactionsBecameNonCanonical: number;
}

export async function markCanonicalTip({
  tipBlock,
  blocksWithHigherHeightOfTipBlock,
  blocksWithSameHeightOfTipBlock,
  blockRepository,
}: MarkCanonicalTipParams): Promise<CanonicalCounts> {
  const changes: { block: BlockOutput; canonical: boolean }[] = [];
  let blocksBecameCanonical = 0;
  let blocksBecameNonCanonical = 0;
  let transactionsBecameCanonical = 0;
  let transactionsBecameNonCanonical = 0;

  // Mark all blocks with higher height as non-canonical
  for (const block of blocksWithHigherHeightOfTipBlock) {
    if (block.canonical) {
      blocksBecameNonCanonical++;
      transactionsBecameNonCanonical += block.numTransactions;
    }
    changes.push({ block, canonical: false });
  }

  if (changes.length > 0) {
    await blockRepository.updateCanonicalStatus({
      blocks: changes.map(change => ({
        hash: change.block.hash,
        canonical: change.canonical,
      })),
    });
    changes.length = 0;
  }

  // Process the tip block and its ancestors iteratively
  let currentBlock = tipBlock;
  let currentSameHeightBlocks = blocksWithSameHeightOfTipBlock;

  while (currentBlock) {
    // Mark all blocks with same height as non-canonical except the current block
    for (const block of currentSameHeightBlocks) {
      if (block.hash !== currentBlock.hash) {
        if (block.canonical) {
          blocksBecameNonCanonical++;
          transactionsBecameNonCanonical += block.numTransactions;
        }
        changes.push({ block, canonical: false });
      }
    }

    // don't consider the tip block canonical change as a counter update
    if (currentBlock.canonical === false) {
      blocksBecameCanonical++;
      transactionsBecameCanonical += currentBlock.numTransactions;
    }
    changes.push({ block: currentBlock, canonical: true });

    if (changes.length > 0) {
      await blockRepository.updateCanonicalStatus({
        blocks: changes.map(change => ({
          hash: change.block.hash,
          canonical: change.canonical,
        })),
      });
      changes.length = 0;
    }

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
  }

  return {
    blocksBecameCanonical,
    blocksBecameNonCanonical,
    transactionsBecameCanonical,
    transactionsBecameNonCanonical,
  };
}
