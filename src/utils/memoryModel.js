/**
 * Memory block states
 */
export const MemoryBlockState = {
  FREE: 'free',
  ALLOCATED: 'allocated'
};

/**
 * Memory block class representing a block of memory
 */
export class MemoryBlock {
  constructor(id, startAddress, size, state = MemoryBlockState.FREE, processId = null) {
    this.id = id;
    this.startAddress = startAddress;
    this.size = size;
    this.state = state;
    this.processId = processId;
    this.endAddress = startAddress + size - 1;
    this.internalFragmentation = 0;
  }

  /**
   * Allocate this block to a process
   * @param {string} processId - ID of the process
   * @param {number} requestedSize - Size requested by the process
   */
  allocate(processId, requestedSize) {
    this.state = MemoryBlockState.ALLOCATED;
    this.processId = processId;
    // Calculate internal fragmentation (wasted space within the block)
    this.internalFragmentation = this.size - requestedSize;
  }

  /**
   * Free this block
   */
  free() {
    this.state = MemoryBlockState.FREE;
    this.processId = null;
    this.internalFragmentation = 0;
  }

  /**
   * Check if this block can fit a given size
   * @param {number} size - Size to check
   * @returns {boolean} True if the block can fit the size
   */
  canFit(size) {
    return this.state === MemoryBlockState.FREE && this.size >= size;
  }

  /**
   * Clone the memory block
   * @returns {MemoryBlock} A new MemoryBlock instance with the same properties
   */
  clone() {
    return new MemoryBlock(
      this.id,
      this.startAddress,
      this.size,
      this.state,
      this.processId
    );
  }
}

/**
 * Memory allocation request class
 */
export class MemoryRequest {
  constructor(id, processId, size) {
    this.id = id;
    this.processId = processId;
    this.size = size;
    this.allocated = false;
    this.blockId = null;
  }

  /**
   * Mark this request as allocated
   * @param {string} blockId - ID of the allocated block
   */
  markAllocated(blockId) {
    this.allocated = true;
    this.blockId = blockId;
  }

  /**
   * Mark this request as deallocated
   */
  markDeallocated() {
    this.allocated = false;
    this.blockId = null;
  }

  /**
   * Clone the memory request
   * @returns {MemoryRequest} A new MemoryRequest instance with the same properties
   */
  clone() {
    const cloned = new MemoryRequest(this.id, this.processId, this.size);
    cloned.allocated = this.allocated;
    cloned.blockId = this.blockId;
    return cloned;
  }
}

/**
 * Generate a unique ID for a memory block
 * @returns {string} A unique ID
 */
export function generateMemoryBlockId() {
  return 'mb_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a unique ID for a memory request
 * @returns {string} A unique ID
 */
export function generateMemoryRequestId() {
  return 'mr_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Calculate external fragmentation
 * @param {Array} blocks - Array of memory blocks
 * @returns {number} Total external fragmentation
 */
export function calculateExternalFragmentation(blocks) {
  // External fragmentation is the sum of all free blocks that are too small to satisfy any request
  // For simplicity, we'll consider blocks smaller than a threshold (e.g., 10 units) as external fragmentation
  const THRESHOLD = 10;
  return blocks
    .filter(block => block.state === MemoryBlockState.FREE && block.size < THRESHOLD)
    .reduce((total, block) => total + block.size, 0);
}

/**
 * Calculate total internal fragmentation
 * @param {Array} blocks - Array of memory blocks
 * @returns {number} Total internal fragmentation
 */
export function calculateTotalInternalFragmentation(blocks) {
  return blocks
    .filter(block => block.state === MemoryBlockState.ALLOCATED)
    .reduce((total, block) => total + block.internalFragmentation, 0);
}

/**
 * Calculate memory utilization
 * @param {Array} blocks - Array of memory blocks
 * @returns {number} Memory utilization percentage
 */
export function calculateMemoryUtilization(blocks) {
  const totalMemory = blocks.reduce((total, block) => total + block.size, 0);
  const usedMemory = blocks
    .filter(block => block.state === MemoryBlockState.ALLOCATED)
    .reduce((total, block) => total + block.size, 0);
  
  return totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
}
