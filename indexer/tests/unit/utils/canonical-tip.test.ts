import { markCanonicalTip } from '../../../src/utils/canonical-tip';
import BlockRepository from '../../../src/kadena-server/repository/application/block-repository';
import { BlockOutput } from '../../../src/kadena-server/repository/application/block-repository';

class InMemoryBlockRepository implements Partial<BlockRepository> {
  private blocks: Map<string, BlockOutput> = new Map();

  constructor(initialBlocks: BlockOutput[]) {
    initialBlocks.forEach(block => this.blocks.set(block.hash, block));
  }

  async getBlockByHash(hash: string): Promise<BlockOutput> {
    const block = this.blocks.get(hash);
    if (!block) {
      throw new Error('Block not found.');
    }

    return block;
  }

  async getBlockParent(parentHash: string): Promise<BlockOutput | null> {
    const block = this.blocks.get(parentHash);
    return block ?? null;
  }

  async getBlocksWithSameHeight(height: number, chainId: string): Promise<BlockOutput[]> {
    return Array.from(this.blocks.values()).filter(
      b => b.height === height && b.chainId === chainId,
    );
  }

  getBlockChain(): string {
    const blocks = Array.from(this.blocks.values());
    const blocksByHash = new Map(blocks.map(b => [b.hash, b]));

    // Find all leaf blocks (blocks that are not parents)
    const leafBlocks = blocks.filter(block => !blocks.some(b => b.parentHash === block.hash));

    // For each leaf, trace back to root to build the chain
    const chains = leafBlocks.map(leaf => {
      const chain: BlockOutput[] = [];
      let current: BlockOutput | undefined = leaf;

      while (current) {
        chain.unshift(current);
        current = blocksByHash.get(current.parentHash);
      }

      return chain;
    });

    // Format the chains
    const formattedChains = chains.map(chain => {
      const blocks = chain.map(block => `${block.hash}${block.canonical ? '(C)' : ''}`);
      return blocks.join(' -> ');
    });

    return '\nBlockchain Structure:\n' + formattedChains.join('\n');
  }

  async updateCanonicalStatus({
    blocks,
  }: {
    blocks: { hash: string; canonical: boolean }[];
  }): Promise<void> {
    blocks.forEach(({ hash, canonical }) => {
      const block = this.blocks.get(hash);
      if (block) {
        // Create a new block object with the updated canonical status
        const updatedBlock = {
          ...block,
          canonical: canonical,
        };
        // Replace the old block with the new one
        this.blocks.set(hash, updatedBlock);
      }
    });
  }
}

describe('markCanonicalTip', () => {
  it('should correctly mark canonical blocks in a simple chain', async () => {
    // Create a simple chain with forks:
    // A -> B -> C -> D
    //           C -> E
    const blockA: BlockOutput = {
      id: '1',
      hash: 'A',
      height: 1,
      parentHash: '',
      chainId: '1',
      creationTime: new Date(),
      difficulty: '1',
      nonce: '1',
      payloadHash: 'hash1',
      target: 'target1',
      weight: 'weight1',
      blockId: 1,
      canonical: false,
      powHash: 'pow1',
      epoch: new Date(),
      flags: '1',
      neighbors: [],
    };
    const blockB: BlockOutput = {
      ...blockA,
      id: '2',
      hash: 'B',
      height: 2,
      parentHash: 'A',
      blockId: 2,
    };
    const blockC: BlockOutput = {
      ...blockA,
      id: '3',
      hash: 'C',
      height: 3,
      parentHash: 'B',
      blockId: 3,
    };
    const blockD: BlockOutput = {
      ...blockA,
      id: '4',
      hash: 'D',
      height: 4,
      parentHash: 'C',
      blockId: 4,
    };

    // Create a fork at height 3: C -> E
    const blockE: BlockOutput = {
      ...blockA,
      id: '5',
      hash: 'E',
      height: 4,
      parentHash: 'C',
      blockId: 5,
    };

    const repository = new InMemoryBlockRepository([blockA, blockB, blockC, blockD, blockE]);

    // Initial state
    console.log('Initial state:', repository.getBlockChain());

    // Mark D as the canonical tip
    const changes = await markCanonicalTip({
      tipBlock: blockD,
      blocksWithHigherHeightOfTipBlock: [],
      blocksWithSameHeightOfTipBlock: [blockE],
      blockRepository: repository as unknown as BlockRepository,
    });

    // // Apply changes to our in-memory repository
    // for (const change of changes) {
    //   const block = await repository.getBlockByHash(change.block.hash);
    //   if (block) {
    //     block.canonical = change.canonical;
    //   }
    // }

    // Final state
    console.log('Final state:', repository.getBlockChain());

    // Verify the results
    const finalBlockD = await repository.getBlockByHash('D');
    const finalBlockE = await repository.getBlockByHash('E');
    const finalBlockC = await repository.getBlockByHash('C');
    const finalBlockB = await repository.getBlockByHash('B');
    const finalBlockA = await repository.getBlockByHash('A');

    expect(finalBlockD?.canonical).toBe(true); // Tip block should be canonical
    expect(finalBlockE?.canonical).toBe(false); // Fork block should not be canonical
    expect(finalBlockC?.canonical).toBe(true); // Parent of tip should be canonical
    expect(finalBlockB?.canonical).toBe(true); // Grandparent of tip should be canonical
    expect(finalBlockA?.canonical).toBe(true); // Great-grandparent of tip should be canonical
  });

  it('should correctly mark canonical blocks in a complex chain with multiple forks', async () => {
    // Create a complex chain with multiple forks:
    // A -> B -> C -> D -> E -> F -> G
    //                D -> K -> L
    //                     E -> P -> Q
    const blockA: BlockOutput = {
      id: '1',
      hash: 'A',
      height: 1,
      parentHash: '',
      chainId: '1',
      creationTime: new Date(),
      difficulty: '1',
      nonce: '1',
      payloadHash: 'hash1',
      target: 'target1',
      weight: 'weight1',
      blockId: 1,
      canonical: false,
      powHash: 'pow1',
      epoch: new Date(),
      flags: '1',
      neighbors: [],
    };

    // Main chain
    const blockB: BlockOutput = {
      ...blockA,
      id: '2',
      hash: 'B',
      height: 2,
      parentHash: 'A',
      blockId: 2,
    };
    const blockC: BlockOutput = {
      ...blockA,
      id: '3',
      hash: 'C',
      height: 3,
      parentHash: 'B',
      blockId: 3,
    };
    const blockD: BlockOutput = {
      ...blockA,
      id: '4',
      hash: 'D',
      height: 4,
      parentHash: 'C',
      blockId: 4,
    };
    const blockE: BlockOutput = {
      ...blockA,
      id: '5',
      hash: 'E',
      height: 5,
      parentHash: 'D',
      blockId: 5,
    };
    const blockF: BlockOutput = {
      ...blockA,
      id: '6',
      hash: 'F',
      height: 6,
      parentHash: 'E',
      blockId: 6,
    };
    const blockG: BlockOutput = {
      ...blockA,
      id: '7',
      hash: 'G',
      height: 7,
      parentHash: 'F',
      blockId: 7,
    };

    // Fork from D
    const blockK: BlockOutput = {
      ...blockA,
      id: '8',
      hash: 'K',
      height: 5,
      parentHash: 'D',
      blockId: 8,
    };
    const blockL: BlockOutput = {
      ...blockA,
      id: '9',
      hash: 'L',
      height: 6,
      parentHash: 'K',
      blockId: 9,
    };

    // Fork from E
    const blockP: BlockOutput = {
      ...blockA,
      id: '10',
      hash: 'P',
      height: 6,
      parentHash: 'E',
      blockId: 10,
    };
    const blockQ: BlockOutput = {
      ...blockA,
      id: '11',
      hash: 'Q',
      height: 7,
      parentHash: 'P',
      blockId: 11,
    };

    const repository = new InMemoryBlockRepository([
      blockA,
      blockB,
      blockC,
      blockD,
      blockE,
      blockF,
      blockG,
      blockK,
      blockL,
      blockP,
      blockQ,
    ]);

    // Initial state
    console.log('Initial state:', repository.getBlockChain());

    // First, mark L as the canonical tip
    const changesForL = await markCanonicalTip({
      tipBlock: blockL,
      blocksWithHigherHeightOfTipBlock: [blockG, blockQ], // G and Q are at height 7
      blocksWithSameHeightOfTipBlock: [blockF, blockP], // F and P are at height 6, same as L
      blockRepository: repository as unknown as BlockRepository,
    });

    // // Apply changes for L using updateCanonicalStatus
    // await repository.updateCanonicalStatus({
    //   blocks: changesForL.map(change => ({
    //     hash: change.block.hash,
    //     canonical: change.canonical,
    //   })),
    // });

    // State after marking L
    console.log('State after marking L as canonical:', repository.getBlockChain());

    // Verify the results after marking L
    const stateAfterL = {
      blockA: await repository.getBlockByHash('A'),
      blockB: await repository.getBlockByHash('B'),
      blockC: await repository.getBlockByHash('C'),
      blockD: await repository.getBlockByHash('D'),
      blockE: await repository.getBlockByHash('E'),
      blockF: await repository.getBlockByHash('F'),
      blockG: await repository.getBlockByHash('G'),
      blockK: await repository.getBlockByHash('K'),
      blockL: await repository.getBlockByHash('L'),
      blockP: await repository.getBlockByHash('P'),
      blockQ: await repository.getBlockByHash('Q'),
    };

    // Verify L's chain is canonical
    expect(stateAfterL.blockL?.canonical).toBe(true); // L is canonical
    expect(stateAfterL.blockK?.canonical).toBe(true); // K is canonical
    expect(stateAfterL.blockD?.canonical).toBe(true); // D is canonical
    expect(stateAfterL.blockC?.canonical).toBe(true); // C is canonical
    expect(stateAfterL.blockB?.canonical).toBe(true); // B is canonical
    expect(stateAfterL.blockA?.canonical).toBe(true); // A is canonical

    // Verify other blocks are non-canonical
    expect(stateAfterL.blockE?.canonical).toBe(false);
    expect(stateAfterL.blockF?.canonical).toBe(false);
    expect(stateAfterL.blockG?.canonical).toBe(false);
    expect(stateAfterL.blockP?.canonical).toBe(false);
    expect(stateAfterL.blockQ?.canonical).toBe(false);

    // Now, mark G as the canonical tip
    const changesForG = await markCanonicalTip({
      tipBlock: blockG,
      blocksWithHigherHeightOfTipBlock: [],
      blocksWithSameHeightOfTipBlock: [blockQ], // Q is at same height as G
      blockRepository: repository as unknown as BlockRepository,
    });

    // // Apply changes for G using updateCanonicalStatus
    // await repository.updateCanonicalStatus({
    //   blocks: changesForG.map(change => ({
    //     hash: change.block.hash,
    //     canonical: change.canonical,
    //   })),
    // });

    // Final state after marking G
    console.log('Final state after marking G as canonical:', repository.getBlockChain());

    // Verify the final results after marking G
    const finalState = {
      blockA: await repository.getBlockByHash('A'),
      blockB: await repository.getBlockByHash('B'),
      blockC: await repository.getBlockByHash('C'),
      blockD: await repository.getBlockByHash('D'),
      blockE: await repository.getBlockByHash('E'),
      blockF: await repository.getBlockByHash('F'),
      blockG: await repository.getBlockByHash('G'),
      blockK: await repository.getBlockByHash('K'),
      blockL: await repository.getBlockByHash('L'),
      blockP: await repository.getBlockByHash('P'),
      blockQ: await repository.getBlockByHash('Q'),
    };

    // Verify G's chain is canonical
    expect(finalState.blockG?.canonical).toBe(true); // G is canonical
    expect(finalState.blockF?.canonical).toBe(true); // F is canonical
    expect(finalState.blockE?.canonical).toBe(true); // E is canonical
    expect(finalState.blockD?.canonical).toBe(true); // D is canonical
    expect(finalState.blockC?.canonical).toBe(true); // C is canonical
    expect(finalState.blockB?.canonical).toBe(true); // B is canonical
    expect(finalState.blockA?.canonical).toBe(true); // A is canonical

    // Verify other blocks are non-canonical
    expect(finalState.blockK?.canonical).toBe(false);
    expect(finalState.blockL?.canonical).toBe(false);
    expect(finalState.blockP?.canonical).toBe(false);
    expect(finalState.blockQ?.canonical).toBe(false);
  });

  it('should be idempotent when marking the same block as canonical twice', async () => {
    // Create a chain with forks:
    // A -> B -> C -> D
    //           C -> E
    const blockA: BlockOutput = {
      id: '1',
      hash: 'A',
      height: 1,
      parentHash: '',
      chainId: '1',
      creationTime: new Date(),
      difficulty: '1',
      nonce: '1',
      payloadHash: 'hash1',
      target: 'target1',
      weight: 'weight1',
      blockId: 1,
      canonical: false,
      powHash: 'pow1',
      epoch: new Date(),
      flags: '1',
      neighbors: [],
    };

    const blockB: BlockOutput = {
      ...blockA,
      id: '2',
      hash: 'B',
      height: 2,
      parentHash: 'A',
      blockId: 2,
    };
    const blockC: BlockOutput = {
      ...blockA,
      id: '3',
      hash: 'C',
      height: 3,
      parentHash: 'B',
      blockId: 3,
    };
    const blockD: BlockOutput = {
      ...blockA,
      id: '4',
      hash: 'D',
      height: 4,
      parentHash: 'C',
      blockId: 4,
    };
    const blockE: BlockOutput = {
      ...blockA,
      id: '5',
      hash: 'E',
      height: 4,
      parentHash: 'C',
      blockId: 5,
    };

    const repository = new InMemoryBlockRepository([blockA, blockB, blockC, blockD, blockE]);

    // Initial state
    console.log('Initial state:', repository.getBlockChain());

    // First time marking D as canonical
    const firstChanges = await markCanonicalTip({
      tipBlock: blockD,
      blocksWithHigherHeightOfTipBlock: [],
      blocksWithSameHeightOfTipBlock: [blockE],
      blockRepository: repository as unknown as BlockRepository,
    });

    // // Apply first changes
    // await repository.updateCanonicalStatus({
    //   blocks: firstChanges.map(change => ({
    //     hash: change.block.hash,
    //     canonical: change.canonical,
    //   })),
    // });

    // State after first marking
    console.log('State after first marking D as canonical:', repository.getBlockChain());

    // Verify the results after first marking
    const stateAfterFirstMarking = {
      blockA: await repository.getBlockByHash('A'),
      blockB: await repository.getBlockByHash('B'),
      blockC: await repository.getBlockByHash('C'),
      blockD: await repository.getBlockByHash('D'),
      blockE: await repository.getBlockByHash('E'),
    };

    // Verify D's chain is canonical after first marking
    expect(stateAfterFirstMarking.blockD?.canonical).toBe(true); // D is canonical
    expect(stateAfterFirstMarking.blockC?.canonical).toBe(true); // C is canonical
    expect(stateAfterFirstMarking.blockB?.canonical).toBe(true); // B is canonical
    expect(stateAfterFirstMarking.blockA?.canonical).toBe(true); // A is canonical

    // Verify other blocks are non-canonical after first marking
    expect(stateAfterFirstMarking.blockE?.canonical).toBe(false);

    // Second time marking D as canonical
    const secondChanges = await markCanonicalTip({
      tipBlock: blockD,
      blocksWithHigherHeightOfTipBlock: [],
      blocksWithSameHeightOfTipBlock: [blockE],
      blockRepository: repository as unknown as BlockRepository,
    });

    // // Apply second changes
    // await repository.updateCanonicalStatus({
    //   blocks: secondChanges.map(change => ({
    //     hash: change.block.hash,
    //     canonical: change.canonical,
    //   })),
    // });

    // State after second marking
    console.log('State after second marking D as canonical:', repository.getBlockChain());

    // Verify the results after second marking
    const stateAfterSecondMarking = {
      blockA: await repository.getBlockByHash('A'),
      blockB: await repository.getBlockByHash('B'),
      blockC: await repository.getBlockByHash('C'),
      blockD: await repository.getBlockByHash('D'),
      blockE: await repository.getBlockByHash('E'),
    };

    // Verify D's chain is canonical after second marking
    expect(stateAfterSecondMarking.blockD?.canonical).toBe(true); // D is canonical
    expect(stateAfterSecondMarking.blockC?.canonical).toBe(true); // C is canonical
    expect(stateAfterSecondMarking.blockB?.canonical).toBe(true); // B is canonical
    expect(stateAfterSecondMarking.blockA?.canonical).toBe(true); // A is canonical

    // Verify other blocks are non-canonical after second marking
    expect(stateAfterSecondMarking.blockE?.canonical).toBe(false);

    // Verify that the state after both operations is identical
    expect(stateAfterSecondMarking).toEqual(stateAfterFirstMarking);
  });
});
