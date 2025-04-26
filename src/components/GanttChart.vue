<template>
  <div class="gantt-chart card">
    <h3>
      <span class="icon" v-html="ICON_CHART"></span>
      Gantt Chart
    </h3>
    <div class="chart-container" ref="chartContainer">
      <div class="timeline">
        <div
          v-for="time in timelineLength"
          :key="time"
          class="time-marker"
          :class="{ 'current-time': time - 1 === currentTimePosition }"
        >
          {{ time - 1 }}
        </div>
      </div>

      <div class="chart">
        <div
          v-for="(segment, index) in processSegments"
          :key="index"
          class="process-segment"
          :style="{
            width: `${segment.duration * segmentWidth}px`,
            backgroundColor: segment.processId ? getProcessColor(segment.processId) : 'var(--color-background-mute)'
          }"
          :title="`${segment.processName} (${segment.startTime} - ${segment.endTime})`"
        >
          <span class="segment-label">{{ segment.processName }}</span>
        </div>
      </div>
    </div>

    <div class="chart-legend" v-if="processes.length > 0">
      <div
        v-for="process in processes"
        :key="process.id"
        class="legend-item"
      >
        <div
          class="color-box"
          :style="{ backgroundColor: getProcessColor(process.id) }"
        ></div>
        <span>{{ process.name }}</span>
      </div>
      <div class="legend-item">
        <div class="color-box" style="backgroundColor: var(--color-background-mute)"></div>
        <span>Idle</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { ICON_STATS } from '../utils/icons';

// Custom chart icon
const ICON_CHART = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;

export default {
  name: 'GanttChart',
  props: {
    timeline: {
      type: Array,
      required: true
    },
    processes: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const chartContainer = ref(null);
    const segmentWidth = ref(40); // Width of each time unit in pixels

    // Get the current time position for highlighting
    const currentTimePosition = computed(() => {
      return props.timeline.length > 0 ? props.timeline.length - 1 : 0;
    });

    // Calculate the total timeline length
    const timelineLength = computed(() => {
      return props.timeline.length > 0 ? props.timeline.length + 1 : 1;
    });

    // Process the timeline data into segments for the Gantt chart
    const processSegments = computed(() => {
      if (props.timeline.length === 0) return [];

      const segments = [];
      let currentProcessId = null;
      let currentStartTime = 0;

      for (let i = 0; i < props.timeline.length; i++) {
        const timePoint = props.timeline[i];

        if (timePoint.processId !== currentProcessId) {
          // If there was a previous process, add it as a segment
          if (i > 0) {
            segments.push({
              processId: currentProcessId,
              processName: props.timeline[i - 1].processName,
              startTime: currentStartTime,
              endTime: i,
              duration: i - currentStartTime
            });
          }

          // Start a new segment
          currentProcessId = timePoint.processId;
          currentStartTime = i;
        }
      }

      // Add the last segment
      segments.push({
        processId: currentProcessId,
        processName: props.timeline[props.timeline.length - 1].processName,
        startTime: currentStartTime,
        endTime: props.timeline.length,
        duration: props.timeline.length - currentStartTime
      });

      return segments;
    });

    // Generate a color for each process
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

    // Adjust chart width when timeline changes
    watch(() => props.timeline.length, () => {
      if (chartContainer.value) {
        chartContainer.value.style.width = `${timelineLength.value * segmentWidth.value}px`;
      }
    });

    onMounted(() => {
      if (chartContainer.value) {
        chartContainer.value.style.width = `${timelineLength.value * segmentWidth.value}px`;
      }
    });

    return {
      chartContainer,
      segmentWidth,
      timelineLength,
      currentTimePosition,
      processSegments,
      getProcessColor,
      ICON_CHART,
      ICON_STATS
    };
  }
};
</script>

<style scoped>
.gantt-chart {
  overflow-x: auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.gantt-chart:hover {
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

.chart-container {
  min-width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
  background-color: var(--color-background-mute);
  border-radius: var(--input-border-radius);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}

.chart-container::-webkit-scrollbar {
  height: 8px;
}

.chart-container::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 4px;
}

.chart-container::-webkit-scrollbar-thumb {
  background: var(--color-border-hover);
  border-radius: 4px;
}

.chart-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-light);
}

.timeline {
  display: flex;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 0.75rem;
  padding-bottom: 0.25rem;
}

.time-marker {
  width: 40px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  padding-bottom: 0.25rem;
  color: var(--color-text-light);
  position: relative;
}

.time-marker.current-time {
  color: var(--color-primary);
  font-weight: 700;
}

.time-marker.current-time::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
}

.chart {
  display: flex;
  height: 50px;
}

.process-segment {
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

.process-segment:hover {
  transform: translateY(-2px);
  z-index: 10;
  box-shadow: var(--shadow-sm);
}

.segment-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 0.5rem;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
  background-color: var(--color-background-mute);
  padding: 1rem;
  border-radius: var(--input-border-radius);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background-color: var(--color-background);
  border-radius: var(--input-border-radius);
  box-shadow: var(--shadow-sm);
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
