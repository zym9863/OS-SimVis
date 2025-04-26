<template>
  <div class="process-queue card" :class="queueType">
    <h3>
      <span class="icon" v-html="getQueueIcon(queueType)"></span>
      {{ title }}
    </h3>
    <div class="queue-container">
      <div v-if="processes.length === 0" class="empty-queue">
        <span class="icon" v-html="ICON_EMPTY"></span>
        Empty
      </div>
      <div
        v-for="process in processes"
        :key="process.id"
        class="process-item"
        :style="{ backgroundColor: getProcessColor(process.id) }"
      >
        <div class="process-name">{{ process.name }}</div>
        <div class="process-details">
          <div class="detail-item">
            <span class="detail-label">
              <span class="icon" v-html="ICON_ARRIVAL"></span>
              Arrival:
            </span>
            <span class="detail-value">{{ process.arrivalTime }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">
              <span class="icon" v-html="ICON_BURST"></span>
              Burst:
            </span>
            <span class="detail-value">{{ process.burstTime }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">
              <span class="icon" v-html="ICON_REMAINING"></span>
              Remaining:
            </span>
            <span class="detail-value">{{ process.remainingTime }}</span>
          </div>
          <div class="detail-item" v-if="showPriority">
            <span class="detail-label">
              <span class="icon" v-html="ICON_PRIORITY_ATTR"></span>
              Priority:
            </span>
            <span class="detail-value">{{ process.priority }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ICON_READY,
  ICON_RUNNING,
  ICON_COMPLETED,
  ICON_ARRIVAL,
  ICON_BURST,
  ICON_REMAINING,
  ICON_PRIORITY_ATTR
} from '../utils/icons';

// Custom empty icon
const ICON_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;

export default {
  name: 'ProcessQueue',
  props: {
    title: {
      type: String,
      required: true
    },
    processes: {
      type: Array,
      required: true
    },
    queueType: {
      type: String,
      default: 'ready',
      validator: (value) => ['ready', 'running', 'waiting', 'completed'].includes(value)
    },
    showPriority: {
      type: Boolean,
      default: false
    },
    getProcessColor: {
      type: Function,
      required: true
    }
  },
  setup() {
    // Function to get the appropriate icon for each queue type
    const getQueueIcon = (queueType) => {
      switch (queueType) {
        case 'ready':
          return ICON_READY;
        case 'running':
          return ICON_RUNNING;
        case 'completed':
          return ICON_COMPLETED;
        default:
          return ICON_READY;
      }
    };

    return {
      getQueueIcon,
      ICON_EMPTY,
      ICON_ARRIVAL,
      ICON_BURST,
      ICON_REMAINING,
      ICON_PRIORITY_ATTR
    };
  }
};
</script>

<style scoped>
.process-queue {
  flex: 1;
  min-width: 250px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.process-queue:hover {
  transform: translateY(-2px);
}

h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1rem;
}

h3 .icon {
  color: var(--color-primary);
}

.queue-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.queue-container::-webkit-scrollbar {
  width: 6px;
}

.queue-container::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 3px;
}

.queue-container::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: 3px;
}

.queue-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-light);
}

.empty-queue {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
  color: var(--color-text-light);
  gap: 0.5rem;
}

.empty-queue .icon {
  color: var(--color-text-light);
  opacity: 0.7;
  font-size: 1.5rem;
}

.process-item {
  padding: 1rem;
  border-radius: var(--input-border-radius);
  color: white;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.process-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.process-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.process-details {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
  font-size: 0.9rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  opacity: 0.9;
}

.detail-label .icon {
  opacity: 0.8;
}

.detail-value {
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

/* Queue type specific styles */
.process-queue.ready {
  border-top: 4px solid var(--color-primary);
}

.process-queue.ready h3 .icon {
  color: var(--color-primary);
}

.process-queue.running {
  border-top: 4px solid var(--color-success);
}

.process-queue.running h3 .icon {
  color: var(--color-success);
}

.process-queue.waiting {
  border-top: 4px solid var(--color-warning);
}

.process-queue.waiting h3 .icon {
  color: var(--color-warning);
}

.process-queue.completed {
  border-top: 4px solid var(--color-accent);
}

.process-queue.completed h3 .icon {
  color: var(--color-accent);
}

@media (min-width: 768px) {
  .process-details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
