import BlockRepository, {
  BlockOutput,
} from '@/kadena-server/repository/application/block-repository';
import { blockValidator } from '@/kadena-server/repository/infra/schema-validator/block-schema-validator';
import Block from '@/models/block';
import { Op, Transaction } from 'sequelize';

interface MarkCanonicalTipParams {
  tipBlock: BlockOutput;
  blocksWithHigherHeightOfTipBlock: BlockOutput[];
  blocksWithSameHeightOfTipBlock: BlockOutput[];
  blockRepository: BlockRepository;
  tx: Transaction;
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
  tx,
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
    await updateCanonicalStatus(
      changes.map(change => ({
        hash: change.block.hash,
        canonical: change.canonical,
      })),
      tx,
    );
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

    // don't consider the tip block canonical change (canonical = null) as a counter update
    if (currentBlock.canonical === false) {
      blocksBecameCanonical++;
      transactionsBecameCanonical += currentBlock.numTransactions;
    }
    changes.push({ block: currentBlock, canonical: true });

    if (changes.length > 0) {
      await updateCanonicalStatus(
        changes.map(change => ({
          hash: change.block.hash,
          canonical: change.canonical,
        })),
        tx,
      );
      changes.length = 0;
    }

    // Get parent block to check its canonical status
    const parentBlock = await Block.findOne({
      where: {
        hash: currentBlock.parentHash,
      },
      transaction: tx,
    });

    if (!parentBlock || parentBlock.canonical !== false) {
      break;
    }

    // Get blocks at the same height as the parent for the next iteration
    const blocksWithSameHeight = await blockRepository.getBlocksWithSameHeight(
      currentBlock.height - 1,
      currentBlock.chainId,
      tx,
    );

    // Move to parent block and update same height blocks for next iteration
    currentBlock = blockValidator.mapFromSequelize(parentBlock);
    currentSameHeightBlocks = blocksWithSameHeight;
  }

  return {
    blocksBecameCanonical,
    blocksBecameNonCanonical,
    transactionsBecameCanonical,
    transactionsBecameNonCanonical,
  };
}

async function updateCanonicalStatus(
  blocks: { hash: string; canonical: boolean }[],
  tx: Transaction,
) {
  const canonicalHashes = blocks.filter(change => change.canonical).map(change => change.hash);
  const nonCanonicalHashes = blocks.filter(change => !change.canonical).map(change => change.hash);

  if (canonicalHashes.length > 0) {
    await Block.update(
      { canonical: true },
      {
        where: { hash: { [Op.in]: canonicalHashes } },
        transaction: tx,
      },
    );
  }

  if (nonCanonicalHashes.length > 0) {
    await Block.update(
      { canonical: false },
      {
        where: { hash: { [Op.in]: nonCanonicalHashes } },
        transaction: tx,
      },
    );
  }
}
