<template>
  <div class="process-form card">
    <h3>创建进程</h3>
    <form @submit.prevent="addProcess">
      <div class="form-group">
        <label for="processName">
          <span class="icon" v-html="ICON_PROCESS"></span>
          进程名称:
        </label>
        <input
          type="text"
          id="processName"
          v-model="process.name"
          required
          placeholder="P1"
        >
      </div>

      <div class="form-group">
        <label for="arrivalTime">
          <span class="icon" v-html="ICON_ARRIVAL"></span>
          到达时间:
        </label>
        <input
          type="number"
          id="arrivalTime"
          v-model="process.arrivalTime"
          min="0"
          required
          placeholder="0"
        >
      </div>

      <div class="form-group">
        <label for="burstTime">
          <span class="icon" v-html="ICON_BURST"></span>
          执行时间:
        </label>
        <input
          type="number"
          id="burstTime"
          v-model="process.burstTime"
          min="1"
          required
          placeholder="4"
        >
      </div>

      <div class="form-group">
        <label for="priority">
          <span class="icon" v-html="ICON_PRIORITY_ATTR"></span>
          优先级:
        </label>
        <input
          type="number"
          id="priority"
          v-model="process.priority"
          min="0"
          placeholder="0"
        >
        <small>数值越小 = 优先级越高</small>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-success">
          <span v-html="ICON_ADD"></span>
          添加进程
        </button>
        <button type="button" class="btn-secondary" @click="generateRandomProcess">
          <span v-html="ICON_RANDOM"></span>
          随机进程
        </button>
      </div>
    </form>

    <div class="process-list">
      <h3>进程列表</h3>
      <div v-if="processes.length > 0" class="table-container">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>到达时间</th>
              <th>执行时间</th>
              <th>优先级</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(process, index) in processes" :key="process.id">
              <td>{{ process.name }}</td>
              <td>{{ process.arrivalTime }}</td>
              <td>{{ process.burstTime }}</td>
              <td>{{ process.priority }}</td>
              <td>
                <button @click="removeProcess(index)" class="btn-danger btn-sm">
                  <span v-html="ICON_REMOVE"></span>
                  移除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty-message">尚未添加任何进程。</p>

      <div class="process-actions">
        <button
          @click="$emit('start-simulation')"
          class="btn-primary"
          :disabled="processes.length === 0"
        >
          <span v-html="ICON_START"></span>
          开始模拟
        </button>
        <button
          @click="clearProcesses"
          class="btn-warning"
          :disabled="processes.length === 0"
        >
          <span v-html="ICON_CLEAR"></span>
          清空全部
        </button>
        <button
          @click="generateExampleSet"
          class="btn-accent"
        >
          <span v-html="ICON_EXAMPLE"></span>
          生成示例集
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { Process, generateProcessId } from '../utils/processModel';
import {
  ICON_ADD,
  ICON_REMOVE,
  ICON_CLEAR,
  ICON_RANDOM,
  ICON_EXAMPLE,
  ICON_START,
  ICON_ARRIVAL,
  ICON_BURST,
  ICON_PRIORITY_ATTR
} from '../utils/icons';

// Custom process icon
const ICON_PROCESS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;

export default {
  name: 'ProcessForm',
  props: {
    processes: {
      type: Array,
      required: true
    }
  },
  emits: ['add-process', 'remove-process', 'clear-processes', 'start-simulation'],
  setup(props, { emit }) {
    const process = ref({
      name: '',
      arrivalTime: 0,
      burstTime: 1,
      priority: 0
    });

    const addProcess = () => {
      const newProcess = new Process(
        generateProcessId(),
        process.value.name,
        process.value.arrivalTime,
        process.value.burstTime,
        process.value.priority
      );

      emit('add-process', newProcess);

      // Reset form
      process.value = {
        name: '',
        arrivalTime: 0,
        burstTime: 1,
        priority: 0
      };
    };

    const removeProcess = (index) => {
      emit('remove-process', index);
    };

    const clearProcesses = () => {
      emit('clear-processes');
    };

    const generateRandomProcess = () => {
      const randomName = `P${Math.floor(Math.random() * 100)}`;
      const randomArrivalTime = Math.floor(Math.random() * 10);
      const randomBurstTime = Math.floor(Math.random() * 10) + 1; // Minimum 1
      const randomPriority = Math.floor(Math.random() * 10);

      process.value = {
        name: randomName,
        arrivalTime: randomArrivalTime,
        burstTime: randomBurstTime,
        priority: randomPriority
      };
    };

    const generateExampleSet = () => {
      clearProcesses();

      const exampleProcesses = [
        new Process(generateProcessId(), 'P1', 0, 5, 3),
        new Process(generateProcessId(), 'P2', 1, 3, 1),
        new Process(generateProcessId(), 'P3', 2, 8, 4),
        new Process(generateProcessId(), 'P4', 3, 2, 2),
        new Process(generateProcessId(), 'P5', 4, 4, 5)
      ];

      exampleProcesses.forEach(p => {
        emit('add-process', p);
      });
    };

    return {
      // Process data and methods
      process,
      addProcess,
      removeProcess,
      clearProcesses,
      generateRandomProcess,
      generateExampleSet,

      // Icons
      ICON_PROCESS,
      ICON_ADD,
      ICON_REMOVE,
      ICON_CLEAR,
      ICON_RANDOM,
      ICON_EXAMPLE,
      ICON_START,
      ICON_ARRIVAL,
      ICON_BURST,
      ICON_PRIORITY_ATTR
    };
  }
};
</script>

<style scoped>
/* We're using the global card class for the form container */
.process-form {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.process-form:hover {
  transform: translateY(-2px);
}

h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-heading);
}

label .icon {
  display: inline-flex;
  color: var(--color-primary);
}

small {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Small button variant */
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

/* Process list styling */
.process-list {
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 1rem;
  border-radius: var(--input-border-radius);
  box-shadow: var(--shadow-sm);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
}

th {
  font-weight: 600;
  background-color: var(--color-background-mute);
  color: var(--color-heading);
  position: sticky;
  top: 0;
}

tr:nth-child(even) {
  background-color: var(--color-background-soft);
}

tr:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.process-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.empty-message {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
  color: var(--color-text-light);
  font-style: italic;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .form-group {
    flex-direction: row;
    align-items: center;
  }

  label {
    width: 150px;
    margin-bottom: 0;
  }

  input {
    flex: 1;
  }

  small {
    margin-left: 150px;
  }

  .process-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 767px) {
  .process-actions {
    flex-direction: column;
  }

  .process-actions button {
    width: 100%;
  }
}
</style>
