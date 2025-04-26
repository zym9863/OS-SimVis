/**
 * Process states
 */
export const ProcessState = {
  NEW: 'new',
  READY: 'ready',
  RUNNING: 'running',
  WAITING: 'waiting',
  COMPLETED: 'completed'
};

/**
 * Process class representing a process in the system
 */
export class Process {
  constructor(id, name, arrivalTime, burstTime, priority = 0) {
    this.id = id;
    this.name = name;
    this.arrivalTime = parseInt(arrivalTime);
    this.burstTime = parseInt(burstTime);
    this.priority = parseInt(priority);
    this.state = ProcessState.NEW;
    
    // For tracking execution
    this.remainingTime = this.burstTime;
    this.startTime = -1;
    this.finishTime = -1;
    this.waitingTime = 0;
    this.turnaroundTime = 0;
    this.lastTimeInQueue = this.arrivalTime;
    this.executionHistory = [];
  }

  /**
   * Add an execution record to the process history
   * @param {number} startTime - Time when process started executing
   * @param {number} endTime - Time when process stopped executing
   */
  addExecution(startTime, endTime) {
    this.executionHistory.push({ startTime, endTime });
  }

  /**
   * Reset the process to its initial state
   */
  reset() {
    this.state = ProcessState.NEW;
    this.remainingTime = this.burstTime;
    this.startTime = -1;
    this.finishTime = -1;
    this.waitingTime = 0;
    this.turnaroundTime = 0;
    this.lastTimeInQueue = this.arrivalTime;
    this.executionHistory = [];
  }

  /**
   * Calculate and update the turnaround time
   */
  calculateTurnaroundTime() {
    if (this.finishTime !== -1) {
      this.turnaroundTime = this.finishTime - this.arrivalTime;
    }
    return this.turnaroundTime;
  }

  /**
   * Calculate and update the waiting time
   */
  calculateWaitingTime() {
    if (this.finishTime !== -1) {
      this.waitingTime = this.turnaroundTime - this.burstTime;
    }
    return this.waitingTime;
  }

  /**
   * Clone the process
   * @returns {Process} A new Process instance with the same properties
   */
  clone() {
    const clonedProcess = new Process(
      this.id,
      this.name,
      this.arrivalTime,
      this.burstTime,
      this.priority
    );
    
    clonedProcess.state = this.state;
    clonedProcess.remainingTime = this.remainingTime;
    clonedProcess.startTime = this.startTime;
    clonedProcess.finishTime = this.finishTime;
    clonedProcess.waitingTime = this.waitingTime;
    clonedProcess.turnaroundTime = this.turnaroundTime;
    clonedProcess.lastTimeInQueue = this.lastTimeInQueue;
    clonedProcess.executionHistory = [...this.executionHistory];
    
    return clonedProcess;
  }
}

/**
 * Generate a unique ID for a process
 * @returns {string} A unique ID
 */
export function generateProcessId() {
  return 'p_' + Math.random().toString(36).substr(2, 9);
}
