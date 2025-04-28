<template>
  <div class="process-stats card">
    <h3>
      <span class="icon" v-html="ICON_STATS"></span>
      统计信息
    </h3>

    <div class="stats-summary">
      <div class="stat-item">
        <div class="stat-icon" v-html="ICON_TURNAROUND"></div>
        <div class="stat-content">
          <div class="stat-label">平均周转时间</div>
          <div class="stat-value">{{ formatNumber(stats.averageTurnaroundTime) }}</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon" v-html="ICON_WAITING"></div>
        <div class="stat-content">
          <div class="stat-label">平均等待时间</div>
          <div class="stat-value">{{ formatNumber(stats.averageWaitingTime) }}</div>
        </div>
      </div>

      <div class="stat-item">
        <div class="stat-icon" v-html="ICON_THROUGHPUT"></div>
        <div class="stat-content">
          <div class="stat-label">吞吐量</div>
          <div class="stat-value">{{ formatNumber(stats.throughput) }} <span class="stat-unit">进程/时间单位</span></div>
        </div>
      </div>
    </div>

    <div class="process-details" v-if="completedProcesses.length > 0">
      <h4>
        <span class="icon" v-html="ICON_COMPLETED"></span>
        进程详情
      </h4>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>进程</th>
              <th>
                <span class="th-content">
                  <span class="icon" v-html="ICON_ARRIVAL"></span>
                  到达
                </span>
              </th>
              <th>
                <span class="th-content">
                  <span class="icon" v-html="ICON_BURST"></span>
                  执行
                </span>
              </th>
              <th>
                <span class="th-content">
                  <span class="icon" v-html="ICON_COMPLETED"></span>
                  完成
                </span>
              </th>
              <th>
                <span class="th-content">
                  <span class="icon" v-html="ICON_TURNAROUND"></span>
                  周转
                </span>
              </th>
              <th>
                <span class="th-content">
                  <span class="icon" v-html="ICON_WAITING"></span>
                  等待
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="process in completedProcesses" :key="process.id">
              <td>{{ process.name }}</td>
              <td>{{ process.arrivalTime }}</td>
              <td>{{ process.burstTime }}</td>
              <td>{{ process.finishTime }}</td>
              <td>{{ process.turnaroundTime }}</td>
              <td>{{ process.waitingTime }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="no-data" v-else>
      <span class="icon" v-html="ICON_WAITING"></span>
      <p>尚无已完成的进程。运行模拟以查看统计信息。</p>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { ProcessState } from '../utils/processModel';
import {
  ICON_STATS,
  ICON_TURNAROUND,
  ICON_WAITING,
  ICON_THROUGHPUT,
  ICON_COMPLETED,
  ICON_ARRIVAL,
  ICON_BURST
} from '../utils/icons';

export default {
  name: 'ProcessStats',
  props: {
    processes: {
      type: Array,
      required: true
    },
    stats: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const completedProcesses = computed(() => {
      return props.processes.filter(p => p.state === ProcessState.COMPLETED);
    });

    const formatNumber = (num) => {
      return Number.isInteger(num) ? num.toString() : num.toFixed(2);
    };

    return {
      completedProcesses,
      formatNumber,

      // Icons
      ICON_STATS,
      ICON_TURNAROUND,
      ICON_WAITING,
      ICON_THROUGHPUT,
      ICON_COMPLETED,
      ICON_ARRIVAL,
      ICON_BURST
    };
  }
};
</script>

<style scoped>
.process-stats {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.process-stats:hover {
  transform: translateY(-2px);
}

h3, h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: var(--color-heading);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
}

h3 .icon, h4 .icon {
  color: var(--color-primary);
}

h4 {
  margin-top: 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* Stats summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: var(--color-background-mute);
  padding: 1.25rem;
  border-radius: var(--input-border-radius);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--color-primary);
  color: white;
  border-radius: 50%;
  padding: 12px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.stat-unit {
  font-size: 0.8rem;
  color: var(--color-text-light);
  font-weight: normal;
}

/* Process details table */
.table-container {
  overflow-x: auto;
  margin-top: 1rem;
  border-radius: var(--input-border-radius);
  box-shadow: var(--shadow-sm);
}

.table-container::-webkit-scrollbar {
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-light);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

th {
  font-weight: 600;
  background-color: var(--color-background-mute);
  color: var(--color-heading);
  position: sticky;
  top: 0;
}

.th-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.th-content .icon {
  color: var(--color-primary);
  opacity: 0.7;
}

tr:nth-child(even) {
  background-color: var(--color-background-soft);
}

tr:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

/* No data message */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
  color: var(--color-text-light);
  margin-top: 2rem;
  gap: 1rem;
}

.no-data .icon {
  color: var(--color-primary);
  opacity: 0.5;
  font-size: 2rem;
}

.no-data p {
  font-size: 1rem;
  max-width: 300px;
  line-height: 1.5;
}
</style>
