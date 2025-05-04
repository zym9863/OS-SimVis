<template>
  <div class="memory-allocator">
    <h2>内存分配可视化</h2>

    <div class="allocator-controls" v-if="!isSimulationRunning">
      <div class="memory-setup card">
        <h3>
          <span class="icon" v-html="ICON_MEMORY"></span>
          内存设置
        </h3>
        <div class="form-group">
          <label for="totalMemory">
            <span class="icon" v-html="ICON_SIZE"></span>
            总内存大小:
          </label>
          <input
            type="number"
            id="totalMemory"
            v-model.number="totalMemory"
            min="10"
            max="1000"
            step="10"
          >
        </div>

        <div class="algorithm-selection">
          <h4>选择分配算法:</h4>
          <div class="algorithms">
            <div
              v-for="algorithm in availableAlgorithms"
              :key="algorithm.name"
              class="algorithm-option"
              :class="{ 'selected': selectedAlgorithm === algorithm }"
              @click="selectedAlgorithm = algorithm"
            >
              <span class="icon" v-html="getAlgorithmIcon(algorithm.name)"></span>
              <div class="algorithm-info">
                <div class="algorithm-name">{{ algorithm.name }}</div>
                <div class="algorithm-description">{{ algorithm.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="memory-actions">
          <button
            @click="startSimulation"
            class="btn-primary"
          >
            <span v-html="ICON_START"></span>
            开始模拟
          </button>
          <button
            @click="generateExampleBlocks"
            class="btn-accent"
          >
            <span v-html="ICON_EXAMPLE"></span>
            生成示例内存
          </button>
        </div>
      </div>
    </div>

    <div class="simulation-container" v-if="isSimulationRunning">
      <div class="simulation-header card">
        <h3>
          <span class="icon" v-html="getAlgorithmIcon(selectedAlgorithm.name)"></span>
          {{ selectedAlgorithm.name }} 模拟
        </h3>
        <div class="simulation-controls">
          <button
            @click="stopSimulation"
            class="btn-danger"
            title="停止模拟并返回设置界面"
          >
            <span v-html="ICON_STOP"></span>
            停止
          </button>
        </div>
      </div>

      <MemoryVisualization
        :blocks="blocks"
        :requests="requests"
      />

      <div class="memory-operations card">
        <h3>
          <span class="icon" v-html="ICON_MEMORY_ALLOCATE"></span>
          内存操作
        </h3>
        <div class="operations-container">
          <div class="allocate-form">
            <h4>申请内存</h4>
            <div class="form-group">
              <label for="processName">
                <span class="icon" v-html="ICON_PROCESS"></span>
                进程名称:
              </label>
              <input
                type="text"
                id="processName"
                v-model="newRequest.processName"
                placeholder="进程名称"
              >
            </div>
            <div class="form-group">
              <label for="requestSize">
                <span class="icon" v-html="ICON_SIZE"></span>
                申请大小:
              </label>
              <input
                type="number"
                id="requestSize"
                v-model.number="newRequest.size"
                min="1"
                :max="totalMemory"
                step="1"
              >
            </div>
            <button
              @click="allocateMemory"
              class="btn-primary"
              :disabled="!canAllocate"
            >
              <span v-html="ICON_MEMORY_ALLOCATE"></span>
              申请内存
            </button>
          </div>

          <div class="deallocate-form">
            <h4>释放内存</h4>
            <div class="allocated-processes" v-if="allocatedProcesses.length > 0">
              <div
                v-for="process in allocatedProcesses"
                :key="process.id"
                class="allocated-process"
              >
                <div class="process-info">
                  <span class="process-name">进程 {{ getProcessName(process.processId) }}</span>
                  <span class="process-size">{{ process.size }} 单位</span>
                </div>
                <button
                  @click="deallocateMemory(process.processId)"
                  class="btn-danger btn-small"
                >
                  <span v-html="ICON_MEMORY_FREE"></span>
                  释放
                </button>
              </div>
            </div>
            <div class="no-processes" v-else>
              <span class="icon" v-html="ICON_MEMORY_FREE"></span>
              <p>尚无已分配的进程</p>
            </div>
          </div>
        </div>
      </div>

      <div class="memory-history card">
        <h3>
          <span class="icon" v-html="ICON_CLOCK"></span>
          操作历史
        </h3>
        <div class="history-list" v-if="history.length > 0">
          <div
            v-for="(entry, index) in history"
            :key="index"
            class="history-entry"
            :class="{ 'allocate': entry.action === 'allocate', 'deallocate': entry.action === 'deallocate' }"
          >
            <span class="icon" v-html="entry.action === 'allocate' ? ICON_MEMORY_ALLOCATE : ICON_MEMORY_FREE"></span>
            <div class="history-content">
              <span class="history-time">{{ formatTime(entry.time) }}</span>
              <span class="history-action">
                {{ entry.action === 'allocate' 
                  ? `进程 ${getProcessName(entry.processId)} 申请了 ${entry.size} 单位内存` 
                  : `进程 ${getProcessName(entry.processId)} 释放了内存` }}
              </span>
            </div>
          </div>
        </div>
        <div class="no-history" v-else>
          <span class="icon" v-html="ICON_WAITING"></span>
          <p>尚无操作历史</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import MemoryVisualization from './MemoryVisualization.vue';
import { MemoryRequest, MemoryBlock, MemoryBlockState, generateMemoryBlockId, generateMemoryRequestId } from '../utils/memoryModel';
import { getAvailableAlgorithms } from '../utils/memoryAllocationAlgorithms';
import {
  ICON_MEMORY,
  ICON_MEMORY_BLOCK,
  ICON_MEMORY_ALLOCATE,
  ICON_MEMORY_FREE,
  ICON_FRAGMENTATION,
  ICON_SIZE,
  ICON_START,
  ICON_STOP,
  ICON_EXAMPLE,
  ICON_CLOCK,
  ICON_WAITING,
  ICON_FIRST_FIT,
  ICON_BEST_FIT,
  ICON_WORST_FIT
} from '../utils/icons';

// Custom process icon
const ICON_PROCESS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;

export default {
  name: 'MemoryAllocator',
  components: {
    MemoryVisualization
  },
  setup() {
    // Memory setup
    const totalMemory = ref(100);
    const blocks = ref([]);
    const requests = ref([]);
    const history = ref([]);
    
    // Simulation state
    const isSimulationRunning = ref(false);
    
    // Algorithm selection
    const availableAlgorithms = ref(getAvailableAlgorithms());
    const selectedAlgorithm = ref(availableAlgorithms.value[0]);
    
    // New memory request
    const newRequest = ref({
      processName: '',
      size: 10
    });
    
    // Get appropriate icon for each algorithm
    const getAlgorithmIcon = (algorithmName) => {
      if (algorithmName.includes('First Fit')) {
        return ICON_FIRST_FIT;
      } else if (algorithmName.includes('Best Fit')) {
        return ICON_BEST_FIT;
      } else if (algorithmName.includes('Worst Fit')) {
        return ICON_WORST_FIT;
      } else {
        return ICON_MEMORY;
      }
    };
    
    // Start the simulation
    const startSimulation = () => {
      // Initialize the algorithm with our memory size
      selectedAlgorithm.value.initialize(totalMemory.value);
      
      // Get initial memory state
      const memoryState = selectedAlgorithm.value.getMemoryState();
      blocks.value = memoryState.blocks;
      requests.value = memoryState.requests;
      history.value = memoryState.history;
      
      // Start the simulation
      isSimulationRunning.value = true;
    };
    
    // Stop the simulation
    const stopSimulation = () => {
      isSimulationRunning.value = false;
      blocks.value = [];
      requests.value = [];
      history.value = [];
    };
    
    // Generate example memory blocks
    const generateExampleBlocks = () => {
      // Set a reasonable memory size
      totalMemory.value = 100;
    };
    
    // Get all processes that have allocated memory
    const allocatedProcesses = computed(() => {
      const processes = [];
      const processIds = new Set();
      
      blocks.value
        .filter(block => block.state === MemoryBlockState.ALLOCATED)
        .forEach(block => {
          if (!processIds.has(block.processId)) {
            processIds.add(block.processId);
            processes.push({
              processId: block.processId,
              size: requests.value.find(req => req.processId === block.processId)?.size || 0
            });
          }
        });
      
      return processes;
    });
    
    // Check if we can allocate memory
    const canAllocate = computed(() => {
      return newRequest.value.processName.trim() !== '' && 
             newRequest.value.size > 0 &&
             newRequest.value.size <= totalMemory.value;
    });
    
    // Allocate memory
    const allocateMemory = () => {
      if (!canAllocate.value) return;
      
      // Generate a process ID
      const processId = `p_${newRequest.value.processName.trim().toLowerCase()}`;
      
      // Create a memory request
      const request = new MemoryRequest(
        generateMemoryRequestId(),
        processId,
        newRequest.value.size
      );
      
      // Try to allocate memory
      const success = selectedAlgorithm.value.allocate(request);
      
      if (success) {
        // Update memory state
        const memoryState = selectedAlgorithm.value.getMemoryState();
        blocks.value = memoryState.blocks;
        requests.value = memoryState.requests;
        history.value = memoryState.history;
        
        // Reset the form
        newRequest.value = {
          processName: '',
          size: 10
        };
      } else {
        alert('无法分配内存！没有足够的连续空闲空间。');
      }
    };
    
    // Deallocate memory
    const deallocateMemory = (processId) => {
      // Try to deallocate memory
      const success = selectedAlgorithm.value.deallocate(processId);
      
      if (success) {
        // Update memory state
        const memoryState = selectedAlgorithm.value.getMemoryState();
        blocks.value = memoryState.blocks;
        requests.value = memoryState.requests;
        history.value = memoryState.history;
      }
    };
    
    // Get process name from ID
    const getProcessName = (processId) => {
      if (!processId) return '';
      
      // Extract the process name from the ID (assuming format like "p_abc123")
      return processId.split('_')[1] || processId;
    };
    
    // Format time for history entries
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    };
    
    return {
      // Memory setup
      totalMemory,
      blocks,
      requests,
      history,
      
      // Simulation state
      isSimulationRunning,
      
      // Algorithm selection
      availableAlgorithms,
      selectedAlgorithm,
      getAlgorithmIcon,
      
      // Memory operations
      newRequest,
      allocatedProcesses,
      canAllocate,
      allocateMemory,
      deallocateMemory,
      getProcessName,
      formatTime,
      
      // Simulation control
      startSimulation,
      stopSimulation,
      generateExampleBlocks,
      
      // Icons
      ICON_PROCESS,
      ICON_MEMORY,
      ICON_MEMORY_BLOCK,
      ICON_MEMORY_ALLOCATE,
      ICON_MEMORY_FREE,
      ICON_FRAGMENTATION,
      ICON_SIZE,
      ICON_START,
      ICON_STOP,
      ICON_EXAMPLE,
      ICON_CLOCK,
      ICON_WAITING
    };
  }
};
</script>

<style scoped>
.memory-allocator {
  width: 100%;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
  text-align: center;
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

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.memory-setup {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--input-border-radius);
  background-color: var(--color-background-mute);
  color: var(--color-text);
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  outline: none;
}

.algorithm-selection {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.algorithms {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.algorithm-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--card-border-radius);
  background-color: var(--color-background-mute);
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.algorithm-option:hover {
  background-color: var(--color-background-soft);
  transform: translateY(-2px);
}

.algorithm-option.selected {
  background-color: var(--color-primary-light);
  color: white;
}

.algorithm-option .icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.algorithm-option.selected .icon {
  color: white;
}

.algorithm-info {
  flex-grow: 1;
}

.algorithm-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.algorithm-description {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.algorithm-option.selected .algorithm-description {
  color: rgba(255, 255, 255, 0.9);
}

.memory-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.memory-actions button {
  flex: 1;
}

.simulation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.simulation-controls {
  display: flex;
  gap: 0.75rem;
}

.memory-operations {
  margin-top: 1.5rem;
}

.operations-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.allocate-form, .deallocate-form {
  display: flex;
  flex-direction: column;
}

.allocated-processes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.allocated-process {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
}

.process-info {
  display: flex;
  flex-direction: column;
}

.process-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.process-size {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.no-processes, .no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
  color: var(--color-text-light);
  text-align: center;
}

.no-processes .icon, .no-history .icon {
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.memory-history {
  margin-top: 1.5rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.history-entry {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
}

.history-entry.allocate {
  border-left: 4px solid var(--color-primary);
}

.history-entry.deallocate {
  border-left: 4px solid var(--color-danger);
}

.history-entry .icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.history-entry.deallocate .icon {
  color: var(--color-danger);
}

.history-content {
  display: flex;
  flex-direction: column;
}

.history-time {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.history-action {
  font-weight: 500;
}

/* Button styles */
button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: var(--button-border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-dark);
}

.btn-accent {
  background-color: var(--color-accent);
  color: white;
}

.btn-accent:hover:not(:disabled) {
  background-color: var(--color-accent-dark);
}

.btn-danger {
  background-color: var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--color-danger-dark);
}

@media (max-width: 768px) {
  .operations-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .memory-actions {
    flex-direction: column;
  }
}
</style>
