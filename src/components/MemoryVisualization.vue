<template>
  <div class="memory-visualization card">
    <h3>
      <span class="icon" v-html="ICON_MEMORY"></span>
      内存可视化
    </h3>
    <div class="memory-container" ref="memoryContainer">
      <div class="memory-blocks">
        <div
          v-for="block in blocks"
          :key="block.id"
          class="memory-block"
          :class="{ 'allocated': block.state === 'allocated', 'free': block.state === 'free' }"
          :style="{ 
            width: `${calculateBlockWidth(block.size)}%`,
            backgroundColor: block.state === 'allocated' ? getBlockColor(block.processId) : 'var(--color-background-mute)'
          }"
          :title="`${block.startAddress}-${block.endAddress} (${block.size} 单位)`"
        >
          <div class="block-info">
            <div class="block-name">
              {{ block.state === 'allocated' ? `进程 ${getProcessName(block.processId)}` : '空闲' }}
            </div>
            <div class="block-size">{{ block.size }} 单位</div>
            <div class="block-address">{{ block.startAddress }}-{{ block.endAddress }}</div>
            <div class="block-fragmentation" v-if="block.state === 'allocated' && block.internalFragmentation > 0">
              内部碎片: {{ block.internalFragmentation }} 单位
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="memory-stats">
      <div class="stat-item">
        <span class="stat-label">
          <span class="icon" v-html="ICON_SIZE"></span>
          总内存:
        </span>
        <span class="stat-value">{{ totalMemory }} 单位</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">
          <span class="icon" v-html="ICON_MEMORY_ALLOCATE"></span>
          已分配:
        </span>
        <span class="stat-value">{{ allocatedMemory }} 单位 ({{ memoryUtilization.toFixed(1) }}%)</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">
          <span class="icon" v-html="ICON_MEMORY_FREE"></span>
          空闲:
        </span>
        <span class="stat-value">{{ freeMemory }} 单位</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">
          <span class="icon" v-html="ICON_FRAGMENTATION"></span>
          内部碎片:
        </span>
        <span class="stat-value">{{ internalFragmentation }} 单位</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">
          <span class="icon" v-html="ICON_FRAGMENTATION"></span>
          外部碎片:
        </span>
        <span class="stat-value">{{ externalFragmentation }} 单位</span>
      </div>
    </div>

    <div class="memory-legend" v-if="blocks.length > 0">
      <div class="legend-title">图例:</div>
      <div class="legend-items">
        <div
          v-for="processId in usedProcessIds"
          :key="processId"
          class="legend-item"
        >
          <div
            class="color-box"
            :style="{ backgroundColor: getBlockColor(processId) }"
          ></div>
          <span>进程 {{ getProcessName(processId) }}</span>
        </div>
        <div class="legend-item">
          <div class="color-box" style="backgroundColor: var(--color-background-mute)"></div>
          <span>空闲</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { MemoryBlockState } from '../utils/memoryModel';
import {
  ICON_MEMORY,
  ICON_MEMORY_BLOCK,
  ICON_MEMORY_ALLOCATE,
  ICON_MEMORY_FREE,
  ICON_FRAGMENTATION,
  ICON_SIZE
} from '../utils/icons';

export default {
  name: 'MemoryVisualization',
  props: {
    blocks: {
      type: Array,
      required: true
    },
    requests: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const memoryContainer = ref(null);
    
    // Calculate total memory size
    const totalMemory = computed(() => {
      return props.blocks.reduce((total, block) => total + block.size, 0);
    });
    
    // Calculate allocated memory
    const allocatedMemory = computed(() => {
      return props.blocks
        .filter(block => block.state === MemoryBlockState.ALLOCATED)
        .reduce((total, block) => total + block.size, 0);
    });
    
    // Calculate free memory
    const freeMemory = computed(() => {
      return totalMemory.value - allocatedMemory.value;
    });
    
    // Calculate memory utilization percentage
    const memoryUtilization = computed(() => {
      return totalMemory.value > 0 ? (allocatedMemory.value / totalMemory.value) * 100 : 0;
    });
    
    // Calculate internal fragmentation
    const internalFragmentation = computed(() => {
      return props.blocks
        .filter(block => block.state === MemoryBlockState.ALLOCATED)
        .reduce((total, block) => total + block.internalFragmentation, 0);
    });
    
    // Calculate external fragmentation (small free blocks)
    const externalFragmentation = computed(() => {
      const THRESHOLD = 10; // Consider blocks smaller than this as external fragmentation
      return props.blocks
        .filter(block => block.state === MemoryBlockState.FREE && block.size < THRESHOLD)
        .reduce((total, block) => total + block.size, 0);
    });
    
    // Get all process IDs currently using memory
    const usedProcessIds = computed(() => {
      const processIds = new Set();
      props.blocks
        .filter(block => block.state === MemoryBlockState.ALLOCATED)
        .forEach(block => processIds.add(block.processId));
      return Array.from(processIds);
    });
    
    // Color palette for blocks
    const colorPalette = [
      'var(--color-primary)',
      'var(--color-secondary)',
      'var(--color-accent)',
      'var(--color-success)',
      'var(--color-warning)',
      'var(--color-danger)',
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F97316', // Orange
      '#14B8A6', // Teal
      '#06B6D4', // Cyan
      '#6366F1'  // Indigo
    ];
    
    // Map to store colors for each process
    const processColors = {};
    
    // Get color for a process
    const getBlockColor = (processId) => {
      if (!processId) return 'var(--color-background-mute)';
      
      if (!processColors[processId]) {
        const colorIndex = Object.keys(processColors).length % colorPalette.length;
        processColors[processId] = colorPalette[colorIndex];
      }
      
      return processColors[processId];
    };
    
    // Get process name from ID (just use the ID for now)
    const getProcessName = (processId) => {
      if (!processId) return '';
      
      // Extract the process name from the ID (assuming format like "p_abc123")
      return processId.split('_')[1] || processId;
    };
    
    // Calculate block width as percentage of total memory
    const calculateBlockWidth = (blockSize) => {
      return totalMemory.value > 0 ? (blockSize / totalMemory.value) * 100 : 0;
    };
    
    onMounted(() => {
      // Any initialization if needed
    });
    
    return {
      memoryContainer,
      totalMemory,
      allocatedMemory,
      freeMemory,
      memoryUtilization,
      internalFragmentation,
      externalFragmentation,
      usedProcessIds,
      getBlockColor,
      getProcessName,
      calculateBlockWidth,
      
      // Icons
      ICON_MEMORY,
      ICON_MEMORY_BLOCK,
      ICON_MEMORY_ALLOCATE,
      ICON_MEMORY_FREE,
      ICON_FRAGMENTATION,
      ICON_SIZE
    };
  }
};
</script>

<style scoped>
.memory-visualization {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.memory-visualization:hover {
  transform: translateY(-2px);
}

h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: var(--color-heading);
}

h3 .icon {
  color: var(--color-primary);
}

.memory-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}

.memory-blocks {
  display: flex;
  height: 80px;
  width: 100%;
  min-width: 500px;
}

.memory-block {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transition: transform 0.2s ease;
  position: relative;
}

.memory-block:hover {
  transform: translateY(-2px);
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.memory-block.allocated {
  background-color: var(--color-primary);
}

.memory-block.free {
  background-color: var(--color-background-mute);
  color: var(--color-text);
}

.block-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  text-align: center;
  width: 100%;
  font-size: 0.8rem;
}

.block-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.block-size, .block-address, .block-fragmentation {
  font-size: 0.7rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memory-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-mute);
  padding: 0.75rem;
  border-radius: var(--input-border-radius);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.stat-label .icon {
  color: var(--color-primary);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
}

.memory-legend {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.legend-title {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--color-text-light);
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .memory-stats {
    grid-template-columns: 1fr;
  }
}
</style>
