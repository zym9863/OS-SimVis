# OS SimVis

[English](README.md) | [中文](README_zh.md)

A Vue.js-based interactive visualization tool for operating system process scheduling algorithms. This application helps students and educators understand how different CPU scheduling algorithms work through real-time visualization.

## Features

- **Process Creation**: Create custom processes with name, arrival time, burst time, and priority
- **Multiple Scheduling Algorithms**:
  - First-Come, First-Served (FCFS)
  - Shortest Job First (SJF)
  - Shortest Remaining Time First (SRTF)
  - Priority Scheduling
  - Round Robin (with configurable time quantum)
- **Real-time Visualization**:
  - Gantt chart for process execution timeline
  - Process queue visualization
  - Process state tracking
  - Performance statistics (turnaround time, waiting time, throughput)
- **Interactive Controls**:
  - Step-by-step execution
  - Automatic simulation with adjustable speed
  - Reset and restart functionality
- **Example Generator**: Quickly create example process sets for demonstration

## Scheduling Algorithms

| Algorithm | Description |
|-----------|-------------|
| **First-Come, First-Served (FCFS)** | Processes are executed in the order they arrive |
| **Shortest Job First (SJF)** | Non-preemptive scheduling based on burst time |
| **Shortest Remaining Time First (SRTF)** | Preemptive version of SJF |
| **Priority Scheduling** | Non-preemptive scheduling based on priority (lower value = higher priority) |
| **Round Robin** | Time-sharing algorithm with configurable time quantum |

## Project Setup

```sh
# Install dependencies
npm install

# Compile and hot-reload for development
npm run dev

# Compile and minify for production
npm run build
```

## Usage

1. Create processes using the form or generate an example set
2. Select a scheduling algorithm
3. Start the simulation
4. Use the controls to step through, run automatically, or reset the simulation
5. Observe the Gantt chart and statistics to understand how the algorithm works

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize Configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).
