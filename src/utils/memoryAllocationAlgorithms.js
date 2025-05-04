import { MemoryBlock, MemoryBlockState, generateMemoryBlockId } from './memoryModel';

/**
 * Base class for all memory allocation algorithms
 */
class MemoryAllocationAlgorithm {
  constructor() {
    this.name = 'Base Algorithm';
    this.description = 'Base memory allocation algorithm';
  }

  /**
   * Initialize the memory
   * @param {number} totalSize - Total size of memory
   * @param {Array} initialBlocks - Optional initial blocks
   */
  initialize(totalSize, initialBlocks = null) {
    if (initialBlocks) {
      this.blocks = initialBlocks.map(block => block.clone());
    } else {
      // Create a single free block representing all memory
      this.blocks = [
        new MemoryBlock(generateMemoryBlockId(), 0, totalSize, MemoryBlockState.FREE)
      ];
    }
    this.requests = [];
    this.history = [];
  }

  /**
   * Allocate memory for a request
   * @param {MemoryRequest} request - Memory allocation request
   * @returns {boolean} True if allocation was successful
   */
  allocate(request) {
    // To be implemented by subclasses
    return false;
  }

  /**
   * Deallocate memory for a process
   * @param {string} processId - ID of the process
   * @returns {boolean} True if deallocation was successful
   */
  deallocate(processId) {
    let success = false;
    
    // Find all blocks allocated to this process
    const allocatedBlocks = this.blocks.filter(block => 
      block.state === MemoryBlockState.ALLOCATED && block.processId === processId
    );
    
    // Free each block
    allocatedBlocks.forEach(block => {
      block.free();
      success = true;
    });
    
    // Mark requests as deallocated
    this.requests
      .filter(req => req.processId === processId && req.allocated)
      .forEach(req => req.markDeallocated());
    
    // Merge adjacent free blocks
    this.mergeAdjacentFreeBlocks();
    
    // Add to history
    if (success) {
      this.history.push({
        action: 'deallocate',
        processId,
        time: new Date().getTime()
      });
    }
    
    return success;
  }

  /**
   * Merge adjacent free blocks to reduce fragmentation
   */
  mergeAdjacentFreeBlocks() {
    // Sort blocks by start address
    this.blocks.sort((a, b) => a.startAddress - b.startAddress);
    
    let i = 0;
    while (i < this.blocks.length - 1) {
      const currentBlock = this.blocks[i];
      const nextBlock = this.blocks[i + 1];
      
      // If both blocks are free and adjacent, merge them
      if (
        currentBlock.state === MemoryBlockState.FREE &&
        nextBlock.state === MemoryBlockState.FREE &&
        currentBlock.endAddress + 1 === nextBlock.startAddress
      ) {
        // Create a new merged block
        const mergedBlock = new MemoryBlock(
          generateMemoryBlockId(),
          currentBlock.startAddress,
          currentBlock.size + nextBlock.size,
          MemoryBlockState.FREE
        );
        
        // Replace the two blocks with the merged block
        this.blocks.splice(i, 2, mergedBlock);
      } else {
        i++;
      }
    }
  }

  /**
   * Get the current state of memory
   * @returns {Object} Current memory state
   */
  getMemoryState() {
    return {
      blocks: this.blocks.map(block => block.clone()),
      requests: this.requests.map(req => req.clone()),
      history: [...this.history]
    };
  }
}

/**
 * First Fit memory allocation algorithm
 * Allocates the first free block that is large enough
 */
export class FirstFitAlgorithm extends MemoryAllocationAlgorithm {
  constructor() {
    super();
    this.name = '首次适应算法 (First Fit)';
    this.description = '分配第一个足够大的空闲块';
  }

  allocate(request) {
    // Sort blocks by start address to ensure we check from the beginning of memory
    this.blocks.sort((a, b) => a.startAddress - b.startAddress);
    
    // Find the first free block that can fit the request
    const blockIndex = this.blocks.findIndex(block => block.canFit(request.size));
    
    if (blockIndex === -1) {
      // No suitable block found
      return false;
    }
    
    const block = this.blocks[blockIndex];
    
    // If the block is exactly the size we need, just allocate it
    if (block.size === request.size) {
      block.allocate(request.processId, request.size);
      request.markAllocated(block.id);
    } else {
      // Split the block: one part allocated, one part free
      const allocatedBlock = new MemoryBlock(
        generateMemoryBlockId(),
        block.startAddress,
        request.size,
        MemoryBlockState.ALLOCATED,
        request.processId
      );
      
      const remainingBlock = new MemoryBlock(
        generateMemoryBlockId(),
        block.startAddress + request.size,
        block.size - request.size,
        MemoryBlockState.FREE
      );
      
      // Replace the original block with the two new blocks
      this.blocks.splice(blockIndex, 1, allocatedBlock, remainingBlock);
      
      // Mark the request as allocated
      request.markAllocated(allocatedBlock.id);
    }
    
    // Add the request to our list
    this.requests.push(request);
    
    // Add to history
    this.history.push({
      action: 'allocate',
      requestId: request.id,
      processId: request.processId,
      size: request.size,
      time: new Date().getTime()
    });
    
    return true;
  }
}

/**
 * Best Fit memory allocation algorithm
 * Allocates the smallest free block that is large enough
 */
export class BestFitAlgorithm extends MemoryAllocationAlgorithm {
  constructor() {
    super();
    this.name = '最佳适应算法 (Best Fit)';
    this.description = '分配最小的足够大的空闲块';
  }

  allocate(request) {
    // Find all free blocks that can fit the request
    const suitableBlocks = this.blocks.filter(block => block.canFit(request.size));
    
    if (suitableBlocks.length === 0) {
      // No suitable block found
      return false;
    }
    
    // Find the smallest suitable block
    const bestBlock = suitableBlocks.reduce((best, current) => 
      current.size < best.size ? current : best
    );
    
    const blockIndex = this.blocks.findIndex(block => block.id === bestBlock.id);
    
    // If the block is exactly the size we need, just allocate it
    if (bestBlock.size === request.size) {
      bestBlock.allocate(request.processId, request.size);
      request.markAllocated(bestBlock.id);
    } else {
      // Split the block: one part allocated, one part free
      const allocatedBlock = new MemoryBlock(
        generateMemoryBlockId(),
        bestBlock.startAddress,
        request.size,
        MemoryBlockState.ALLOCATED,
        request.processId
      );
      
      const remainingBlock = new MemoryBlock(
        generateMemoryBlockId(),
        bestBlock.startAddress + request.size,
        bestBlock.size - request.size,
        MemoryBlockState.FREE
      );
      
      // Replace the original block with the two new blocks
      this.blocks.splice(blockIndex, 1, allocatedBlock, remainingBlock);
      
      // Mark the request as allocated
      request.markAllocated(allocatedBlock.id);
    }
    
    // Add the request to our list
    this.requests.push(request);
    
    // Add to history
    this.history.push({
      action: 'allocate',
      requestId: request.id,
      processId: request.processId,
      size: request.size,
      time: new Date().getTime()
    });
    
    return true;
  }
}

/**
 * Worst Fit memory allocation algorithm
 * Allocates the largest free block
 */
export class WorstFitAlgorithm extends MemoryAllocationAlgorithm {
  constructor() {
    super();
    this.name = '最坏适应算法 (Worst Fit)';
    this.description = '分配最大的空闲块';
  }

  allocate(request) {
    // Find all free blocks that can fit the request
    const suitableBlocks = this.blocks.filter(block => block.canFit(request.size));
    
    if (suitableBlocks.length === 0) {
      // No suitable block found
      return false;
    }
    
    // Find the largest suitable block
    const worstBlock = suitableBlocks.reduce((worst, current) => 
      current.size > worst.size ? current : worst
    );
    
    const blockIndex = this.blocks.findIndex(block => block.id === worstBlock.id);
    
    // If the block is exactly the size we need, just allocate it
    if (worstBlock.size === request.size) {
      worstBlock.allocate(request.processId, request.size);
      request.markAllocated(worstBlock.id);
    } else {
      // Split the block: one part allocated, one part free
      const allocatedBlock = new MemoryBlock(
        generateMemoryBlockId(),
        worstBlock.startAddress,
        request.size,
        MemoryBlockState.ALLOCATED,
        request.processId
      );
      
      const remainingBlock = new MemoryBlock(
        generateMemoryBlockId(),
        worstBlock.startAddress + request.size,
        worstBlock.size - request.size,
        MemoryBlockState.FREE
      );
      
      // Replace the original block with the two new blocks
      this.blocks.splice(blockIndex, 1, allocatedBlock, remainingBlock);
      
      // Mark the request as allocated
      request.markAllocated(allocatedBlock.id);
    }
    
    // Add the request to our list
    this.requests.push(request);
    
    // Add to history
    this.history.push({
      action: 'allocate',
      requestId: request.id,
      processId: request.processId,
      size: request.size,
      time: new Date().getTime()
    });
    
    return true;
  }
}

/**
 * Get all available memory allocation algorithms
 * @returns {Array} Array of memory allocation algorithm instances
 */
export function getAvailableAlgorithms() {
  return [
    new FirstFitAlgorithm(),
    new BestFitAlgorithm(),
    new WorstFitAlgorithm()
  ];
}
