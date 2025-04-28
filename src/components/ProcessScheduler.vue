<template>
  <div class="process-scheduler">
    <h2>进程调度可视化</h2>

    <div class="scheduler-controls" v-if="!isSimulationRunning">
      <ProcessForm
        :processes="processes"
        @add-process="addProcess"
        @remove-process="removeProcess"
        @clear-processes="clearProcesses"
        @start-simulation="startSimulation"
      />

      <div class="algorithm-selector card">
        <h3>
          <span class="icon" v-html="ICON_ALGORITHM"></span>
          选择调度算法
        </h3>
        <div class="algorithm-options">
          <div
            v-for="algorithm in availableAlgorithms"
            :key="algorithm.name"
            class="algorithm-option"
            :class="{ active: selectedAlgorithm === algorithm }"
            @click="selectedAlgorithm = algorithm"
          >
            <div class="algorithm-icon">
              <span v-html="getAlgorithmIcon(algorithm.name)"></span>
            </div>
            <div class="algorithm-info">
              <div class="algorithm-name">{{ algorithm.name }}</div>
              <div class="algorithm-description">{{ algorithm.description }}</div>
            </div>
          </div>
        </div>

        <div class="time-quantum-control" v-if="selectedAlgorithm && selectedAlgorithm.name === 'Round Robin'">
          <label for="timeQuantum">
            <span class="icon" v-html="ICON_ROUND_ROBIN"></span>
            时间片长度:
          </label>
          <input
            type="number"
            id="timeQuantum"
            v-model="timeQuantum"
            min="1"
            max="10"
            @change="updateRoundRobinTimeQuantum"
          >
          <small>每个进程运行的时间单位数，超过后切换到下一个进程</small>
        </div>
      </div>
    </div>

    <div class="simulation-container" v-if="isSimulationRunning">
      <div class="simulation-header card">
        <h3>
          <span class="icon" v-html="ICON_ALGORITHM"></span>
          {{ selectedAlgorithm.name }} 模拟
        </h3>
        <div class="simulation-controls">
          <div class="time-display">
            <span class="icon" v-html="ICON_CLOCK"></span>
            时间: {{ currentTime }}
          </div>
          <button
            @click="stepSimulation"
            :disabled="isSimulationComplete"
            class="btn-secondary"
            title="向前执行一个时间单位"
          >
            <span v-html="ICON_STEP"></span>
            单步
          </button>
          <button
            @click="runSimulation"
            :disabled="isSimulationComplete || isAutoRunning"
            class="btn-primary"
            title="自动运行模拟"
          >
            <span v-html="ICON_RUN"></span>
            运行
          </button>
          <button
            @click="pauseSimulation"
            :disabled="!isAutoRunning"
            class="btn-warning"
            title="暂停自动模拟"
          >
            <span v-html="ICON_PAUSE"></span>
            暂停
          </button>
          <button
            @click="resetSimulation"
            class="btn-accent"
            title="重置模拟到开始状态"
          >
            <span v-html="ICON_RESET"></span>
            重置
          </button>
          <button
            @click="stopSimulation"
            class="btn-danger"
            title="停止模拟并返回设置界面"
          >
            <span v-html="ICON_STOP"></span>
            停止
          </button>
          <div class="speed-control">
            <label for="simulationSpeed" title="调整模拟速度">
              <span class="icon" v-html="ICON_SPEED"></span>
              速度:
            </label>
            <input
              type="range"
              id="simulationSpeed"
              v-model="simulationSpeed"
              min="1"
              max="10"
            >
          </div>
        </div>
      </div>

      <GanttChart
        :timeline="timeline"
        :processes="processes"
      />

      <div class="queues-container">
        <ProcessQueue
          title="就绪队列"
          :processes="readyQueue"
          queue-type="ready"
          :show-priority="showPriority"
          :get-process-color="getProcessColor"
        />

        <ProcessQueue
          title="运行中进程"
          :processes="runningProcess ? [runningProcess] : []"
          queue-type="running"
          :show-priority="showPriority"
          :get-process-color="getProcessColor"
        />

        <ProcessQueue
          title="已完成进程"
          :processes="completedProcesses"
          queue-type="completed"
          :show-priority="showPriority"
          :get-process-color="getProcessColor"
        />
      </div>

      <ProcessStats
        :processes="processes"
        :stats="stats"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount } from 'vue';
import ProcessForm from './ProcessForm.vue';
import GanttChart from './GanttChart.vue';
import ProcessQueue from './ProcessQueue.vue';
import ProcessStats from './ProcessStats.vue';
import { getAvailableAlgorithms, RoundRobinScheduler } from '../utils/schedulingAlgorithms';
import { ProcessState } from '../utils/processModel';
import {
  ICON_ALGORITHM,
  ICON_STEP,
  ICON_RUN,
  ICON_PAUSE,
  ICON_RESET,
  ICON_STOP,
  ICON_CLOCK,
  ICON_SPEED,
  ICON_ROUND_ROBIN,
  ICON_PRIORITY
} from '../utils/icons';

export default {
  name: 'ProcessScheduler',
  components: {
    ProcessForm,
    GanttChart,
    ProcessQueue,
    ProcessStats
  },
  setup() {
    // Process management
    const processes = ref([]);
    const addProcess = (process) => {
      processes.value.push(process);
    };
    const removeProcess = (index) => {
      processes.value.splice(index, 1);
    };
    const clearProcesses = () => {
      processes.value = [];
    };

    // Algorithm selection
    const availableAlgorithms = ref(getAvailableAlgorithms());
    const selectedAlgorithm = ref(availableAlgorithms.value[0]);
    const timeQuantum = ref(2);

    const updateRoundRobinTimeQuantum = () => {
      if (selectedAlgorithm.value && selectedAlgorithm.value.name === 'Round Robin') {
        // Find the Round Robin algorithm and update its time quantum
        const index = availableAlgorithms.value.findIndex(alg => alg.name === 'Round Robin');
        if (index !== -1) {
          availableAlgorithms.value[index] = new RoundRobinScheduler(parseInt(timeQuantum.value));
          selectedAlgorithm.value = availableAlgorithms.value[index];
        }
      }
    };

    // Simulation state
    const isSimulationRunning = ref(false);
    const isSimulationComplete = ref(false);
    const isAutoRunning = ref(false);
    const simulationSpeed = ref(5);
    const simulationInterval = ref(null);
    const currentTime = ref(0);
    const timeline = ref([]);
    const readyQueue = ref([]);
    const runningProcess = ref(null);
    const completedProcesses = ref([]);
    const stats = ref({
      averageTurnaroundTime: 0,
      averageWaitingTime: 0,
      throughput: 0
    });

    // Show priority based on algorithm
    const showPriority = computed(() => {
      return selectedAlgorithm.value && selectedAlgorithm.value.name.includes('Priority');
    });

    // Process colors for visualization
    const processColors = {};
    const colorPalette = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
      '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#34495e'
    ];

    const getProcessColor = (processId) => {
      if (!processId) return '#f0f0f0'; // Idle color

      if (!processColors[processId]) {
        const colorIndex = Object.keys(processColors).length % colorPalette.length;
        processColors[processId] = colorPalette[colorIndex];
      }

      return processColors[processId];
    };

    // Get appropriate icon for each algorithm
    const getAlgorithmIcon = (algorithmName) => {
      if (algorithmName.includes('Priority')) {
        return ICON_PRIORITY;
      } else if (algorithmName === 'Round Robin') {
        return ICON_ROUND_ROBIN;
      } else {
        return ICON_ALGORITHM;
      }
    };

    // Simulation control
    const startSimulation = () => {
      if (processes.value.length === 0) return;

      // Initialize the algorithm with our processes
      selectedAlgorithm.value.initialize(processes.value);

      // Reset simulation state
      isSimulationRunning.value = true;
      isSimulationComplete.value = false;
      currentTime.value = 0;
      timeline.value = [];

      // Update UI with initial state
      updateSimulationState();
    };

    const stepSimulation = () => {
      if (isSimulationComplete.value) return;

      // Execute one step of the algorithm
      selectedAlgorithm.value.step();

      // Update UI
      updateSimulationState();

      // Check if simulation is complete
      if (selectedAlgorithm.value.isFinished) {
        isSimulationComplete.value = true;
        pauseSimulation();
      }
    };

    const runSimulation = () => {
      if (isSimulationComplete.value || isAutoRunning.value) return;

      isAutoRunning.value = true;

      // Calculate interval based on speed (1-10)
      // Speed 1 = 1000ms, Speed 10 = 100ms
      const interval = 1100 - (simulationSpeed.value * 100);

      simulationInterval.value = setInterval(() => {
        stepSimulation();

        if (isSimulationComplete.value) {
          pauseSimulation();
        }
      }, interval);
    };

    const pauseSimulation = () => {
      if (simulationInterval.value) {
        clearInterval(simulationInterval.value);
        simulationInterval.value = null;
      }
      isAutoRunning.value = false;
    };

    const resetSimulation = () => {
      pauseSimulation();

      // Reset all processes
      processes.value.forEach(process => process.reset());

      // Restart simulation
      startSimulation();
    };

    const stopSimulation = () => {
      pauseSimulation();
      isSimulationRunning.value = false;
      isSimulationComplete.value = false;
    };

    const updateSimulationState = () => {
      // Update current time
      currentTime.value = selectedAlgorithm.value.currentTime;

      // Update timeline
      timeline.value = [...selectedAlgorithm.value.timeline];

      // Update process queues
      readyQueue.value = selectedAlgorithm.value.readyQueue.map(p => ({ ...p }));
      runningProcess.value = selectedAlgorithm.value.runningProcess ? { ...selectedAlgorithm.value.runningProcess } : null;
      completedProcesses.value = selectedAlgorithm.value.completedProcesses.map(p => ({ ...p }));

      // Update statistics
      stats.value = { ...selectedAlgorithm.value.calculateStats() };
    };

    // Clean up on component unmount
    onBeforeUnmount(() => {
      if (simulationInterval.value) {
        clearInterval(simulationInterval.value);
      }
    });

    return {
      // Process management
      processes,
      addProcess,
      removeProcess,
      clearProcesses,

      // Algorithm selection
      availableAlgorithms,
      selectedAlgorithm,
      timeQuantum,
      updateRoundRobinTimeQuantum,
      getAlgorithmIcon,

      // Simulation state
      isSimulationRunning,
      isSimulationComplete,
      isAutoRunning,
      simulationSpeed,
      currentTime,
      timeline,
      readyQueue,
      runningProcess,
      completedProcesses,
      stats,
      showPriority,

      // Visualization
      getProcessColor,

      // Simulation control
      startSimulation,
      stepSimulation,
      runSimulation,
      pauseSimulation,
      resetSimulation,
      stopSimulation,

      // Icons
      ICON_ALGORITHM,
      ICON_STEP,
      ICON_RUN,
      ICON_PAUSE,
      ICON_RESET,
      ICON_STOP,
      ICON_CLOCK,
      ICON_SPEED,
      ICON_ROUND_ROBIN,
      ICON_PRIORITY
    };
  }
};
</script>

<style scoped>
.process-scheduler {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 0;
}

h2 {
  margin-bottom: 2rem;
  text-align: center;
  color: var(--color-heading);
  font-size: 2rem;
  font-weight: 700;
}

h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--color-heading);
  font-size: 1.25rem;
  font-weight: 600;
}

h3 .icon {
  color: var(--color-primary);
}

/* Scheduler controls */
.scheduler-controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Algorithm selector */
.algorithm-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.algorithm-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--button-border-radius);
  background-color: var(--color-background-mute);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.algorithm-option:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
}

.algorithm-option.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary-dark);
}

.algorithm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 6px;
  flex-shrink: 0;
}

.algorithm-info {
  flex: 1;
}

.algorithm-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.algorithm-description {
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
}

.time-quantum-control {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
}

.time-quantum-control label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.time-quantum-control input {
  width: 80px;
  padding: 0.5rem;
}

.time-quantum-control small {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

/* Simulation container */
.simulation-container {
  margin-top: 2rem;
}

.simulation-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.simulation-header h3 {
  margin-bottom: 1rem;
}

.simulation-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.time-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background-color: var(--color-background-mute);
  border-radius: var(--button-border-radius);
  color: var(--color-heading);
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.speed-control label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.speed-control input {
  width: 100px;
}

/* Queue container */
.queues-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .scheduler-controls {
    grid-template-columns: 1fr 1fr;
  }

  .simulation-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .simulation-header h3 {
    margin-bottom: 0;
  }

  .time-quantum-control {
    flex-direction: row;
    align-items: center;
  }
}

@media (max-width: 767px) {
  .simulation-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .simulation-controls button {
    width: 100%;
  }

  .speed-control {
    width: 100%;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>
