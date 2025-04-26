import { ProcessState } from './processModel';

/**
 * Base class for all scheduling algorithms
 */
class SchedulingAlgorithm {
  constructor() {
    this.name = 'Base Algorithm';
    this.description = 'Base scheduling algorithm';
  }

  /**
   * Initialize the simulation
   * @param {Array} processes - Array of processes to schedule
   */
  initialize(processes) {
    // Create deep copies of processes to avoid modifying the originals
    this.processes = processes.map(p => p.clone());
    this.currentTime = 0;
    this.readyQueue = [];
    this.waitingQueue = [];
    this.completedProcesses = [];
    this.runningProcess = null;
    this.timeline = [];
    this.isFinished = false;
  }

  /**
   * Run the entire simulation until completion
   */
  runFullSimulation() {
    this.initialize(this.processes);
    
    while (!this.isFinished) {
      this.step();
    }
    
    return {
      timeline: this.timeline,
      processes: this.processes,
      stats: this.calculateStats()
    };
  }

  /**
   * Execute a single step of the simulation
   */
  step() {
    // Move arriving processes to ready queue
    this.checkArrivingProcesses();
    
    // Select the next process to run (algorithm-specific)
    this.selectNextProcess();
    
    // Execute the current process for one time unit
    this.executeCurrentProcess();
    
    // Check if simulation is complete
    this.checkCompletion();
  }

  /**
   * Check for processes arriving at the current time
   */
  checkArrivingProcesses() {
    const arrivingProcesses = this.processes.filter(
      p => p.state === ProcessState.NEW && p.arrivalTime <= this.currentTime
    );
    
    for (const process of arrivingProcesses) {
      process.state = ProcessState.READY;
      this.readyQueue.push(process);
    }
  }

  /**
   * Select the next process to run (to be implemented by subclasses)
   */
  selectNextProcess() {
    throw new Error('Method not implemented');
  }

  /**
   * Execute the current process for one time unit
   */
  executeCurrentProcess() {
    if (this.runningProcess) {
      // Record execution in timeline
      this.timeline.push({
        time: this.currentTime,
        processId: this.runningProcess.id,
        processName: this.runningProcess.name
      });
      
      // If this is the first time the process is running
      if (this.runningProcess.startTime === -1) {
        this.runningProcess.startTime = this.currentTime;
      }
      
      // Execute for one time unit
      this.runningProcess.remainingTime--;
      
      // Check if process is complete
      if (this.runningProcess.remainingTime <= 0) {
        this.runningProcess.finishTime = this.currentTime + 1;
        this.runningProcess.state = ProcessState.COMPLETED;
        this.runningProcess.calculateTurnaroundTime();
        this.runningProcess.calculateWaitingTime();
        
        // Add to completed processes
        this.completedProcesses.push(this.runningProcess);
        this.runningProcess = null;
      }
    } else {
      // CPU idle
      this.timeline.push({
        time: this.currentTime,
        processId: null,
        processName: 'Idle'
      });
    }
    
    // Update waiting time for processes in ready queue
    for (const process of this.readyQueue) {
      if (process.state === ProcessState.READY) {
        process.waitingTime++;
      }
    }
    
    // Increment current time
    this.currentTime++;
  }

  /**
   * Check if the simulation is complete
   */
  checkCompletion() {
    if (
      this.completedProcesses.length === this.processes.length ||
      (this.readyQueue.length === 0 && !this.runningProcess && 
       this.processes.every(p => p.state === ProcessState.COMPLETED || 
                                 p.arrivalTime > this.currentTime))
    ) {
      this.isFinished = true;
    }
  }

  /**
   * Calculate statistics for the simulation
   */
  calculateStats() {
    const completedProcesses = this.processes.filter(
      p => p.state === ProcessState.COMPLETED
    );
    
    if (completedProcesses.length === 0) {
      return {
        averageTurnaroundTime: 0,
        averageWaitingTime: 0,
        throughput: 0
      };
    }
    
    const totalTurnaroundTime = completedProcesses.reduce(
      (sum, p) => sum + p.turnaroundTime, 0
    );
    
    const totalWaitingTime = completedProcesses.reduce(
      (sum, p) => sum + p.waitingTime, 0
    );
    
    return {
      averageTurnaroundTime: totalTurnaroundTime / completedProcesses.length,
      averageWaitingTime: totalWaitingTime / completedProcesses.length,
      throughput: completedProcesses.length / this.currentTime
    };
  }
}

/**
 * First-Come, First-Served (FCFS) scheduling algorithm
 */
export class FCFSScheduler extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'First-Come, First-Served (FCFS)';
    this.description = 'Processes are executed in the order they arrive';
  }

  selectNextProcess() {
    if (!this.runningProcess && this.readyQueue.length > 0) {
      // Sort by arrival time
      this.readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime);
      
      // Select the first process
      this.runningProcess = this.readyQueue.shift();
      this.runningProcess.state = ProcessState.RUNNING;
    }
  }
}

/**
 * Shortest Job First (SJF) scheduling algorithm
 */
export class SJFScheduler extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'Shortest Job First (SJF)';
    this.description = 'Non-preemptive scheduling based on burst time';
  }

  selectNextProcess() {
    if (!this.runningProcess && this.readyQueue.length > 0) {
      // Sort by burst time
      this.readyQueue.sort((a, b) => a.burstTime - b.burstTime);
      
      // Select the process with shortest burst time
      this.runningProcess = this.readyQueue.shift();
      this.runningProcess.state = ProcessState.RUNNING;
    }
  }
}

/**
 * Shortest Remaining Time First (SRTF) scheduling algorithm
 */
export class SRTFScheduler extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'Shortest Remaining Time First (SRTF)';
    this.description = 'Preemptive version of SJF';
  }

  selectNextProcess() {
    // Add current running process back to ready queue if it exists
    if (this.runningProcess) {
      this.runningProcess.state = ProcessState.READY;
      this.readyQueue.push(this.runningProcess);
      this.runningProcess = null;
    }
    
    if (this.readyQueue.length > 0) {
      // Sort by remaining time
      this.readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
      
      // Select the process with shortest remaining time
      this.runningProcess = this.readyQueue.shift();
      this.runningProcess.state = ProcessState.RUNNING;
    }
  }
}

/**
 * Priority Scheduling algorithm
 */
export class PriorityScheduler extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'Priority Scheduling';
    this.description = 'Non-preemptive scheduling based on priority (lower value = higher priority)';
  }

  selectNextProcess() {
    if (!this.runningProcess && this.readyQueue.length > 0) {
      // Sort by priority (lower value = higher priority)
      this.readyQueue.sort((a, b) => a.priority - b.priority);
      
      // Select the process with highest priority
      this.runningProcess = this.readyQueue.shift();
      this.runningProcess.state = ProcessState.RUNNING;
    }
  }
}

/**
 * Round Robin scheduling algorithm
 */
export class RoundRobinScheduler extends SchedulingAlgorithm {
  constructor(timeQuantum = 2) {
    super();
    this.name = 'Round Robin';
    this.description = `Time-sharing algorithm with time quantum of ${timeQuantum}`;
    this.timeQuantum = timeQuantum;
    this.currentQuantum = 0;
  }

  initialize(processes) {
    super.initialize(processes);
    this.currentQuantum = 0;
  }

  selectNextProcess() {
    // If a process is running and its quantum is not expired, continue running it
    if (this.runningProcess && this.currentQuantum < this.timeQuantum) {
      return;
    }
    
    // If a process is running but its quantum is expired, put it back in the ready queue
    if (this.runningProcess) {
      this.runningProcess.state = ProcessState.READY;
      this.readyQueue.push(this.runningProcess);
      this.runningProcess = null;
    }
    
    // Select the next process from the ready queue (FIFO order)
    if (this.readyQueue.length > 0) {
      this.runningProcess = this.readyQueue.shift();
      this.runningProcess.state = ProcessState.RUNNING;
      this.currentQuantum = 0;
    }
  }

  executeCurrentProcess() {
    super.executeCurrentProcess();
    if (this.runningProcess) {
      this.currentQuantum++;
    }
  }
}

/**
 * Get all available scheduling algorithms
 * @returns {Array} Array of scheduling algorithm instances
 */
export function getAvailableAlgorithms() {
  return [
    new FCFSScheduler(),
    new SJFScheduler(),
    new SRTFScheduler(),
    new PriorityScheduler(),
    new RoundRobinScheduler(2)
  ];
}
