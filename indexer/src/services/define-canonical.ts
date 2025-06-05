import { rootPgPool } from '@/config/database';
import BlockDbRepository from '@/kadena-server/repository/infra/repository/block-db-repository';
import { markCanonicalTip } from '@/utils/canonical-tip';

const blockRepository = new BlockDbRepository();

const HEIGHT_CANONICAL_DEPTH = 5;

export async function defineCanonicalManually({ chainId }: { chainId: string }) {
  const queryOne = `
    SELECT max(height)
    FROM "Blocks"
    WHERE "chainId" = $1;
  `;

  const { rows } = await rootPgPool.query(queryOne, [chainId]);

  const heightToStart = rows[0].max - HEIGHT_CANONICAL_DEPTH;

  const queryTwo = `
    SELECT hash
    FROM "Blocks"
    WHERE "chainId" = $1 AND "height" = $2;
  `;

  const { rows: rowsTwo } = await rootPgPool.query(queryTwo, [chainId, heightToStart]);

  if (rowsTwo.length === 0) {
    throw new Error('No block found');
  }

  if (rows.length > 1) {
    throw new Error('More than one block found');
  }

  const tipBlockHash = rowsTwo[0].hash;

  const tipBlock = await blockRepository.getBlockByHash(tipBlockHash);
  console.log('maxHeight', rows[0].max);
  console.log('tipBlockHeight', tipBlock.height);
  console.log('tipBlockHash', tipBlockHash);
  await defineCanonical({ blockHash: tipBlock.hash });
}

export async function defineCanonicalInStreaming(blockHash: string) {
  const canonicalTipHash = await blockRepository.getBlockNParent(HEIGHT_CANONICAL_DEPTH, blockHash);
  if (!canonicalTipHash) {
    console.log('[ERROR][DATA][DATA_CORRUPT] Error defining canonical in streaming:', blockHash);
    return;
  }
  await defineCanonical({
    blockHash: canonicalTipHash,
  });
}

export default async function defineCanonical({ blockHash }: { blockHash: string }) {
  try {
    const tipBlock = await blockRepository.getBlockByHash(blockHash);
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
