export type AgentStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'CONFIRMING';

export interface AgentState {
  status: AgentStatus;
  currentTask: string | null;
  lastUpdate: Date;
}

export class AgentStateMachine {
  private state: AgentState;

  constructor() {
    this.state = {
      status: 'IDLE',
      currentTask: null,
      lastUpdate: new Date()
    };
  }

  getState(): AgentState {
    return { ...this.state };
  }

  transition(newStatus: AgentStatus, task?: string): void {
    const validTransitions: Record<AgentStatus, AgentStatus[]> = {
      'IDLE': ['PLANNING'],
      'PLANNING': ['EXECUTING', 'IDLE'],
      'EXECUTING': ['CONFIRMING', 'IDLE'],
      'CONFIRMING': ['IDLE', 'PLANNING']
    };

    if (!validTransitions[this.state.status].includes(newStatus)) {
      throw new Error(`Invalid transition from ${this.state.status} to ${newStatus}`);
    }

    this.state.status = newStatus;
    this.state.currentTask = task || null;
    this.state.lastUpdate = new Date();
  }

  forceTransition(newStatus: AgentStatus, task?: string): void {
    this.state.status = newStatus;
    this.state.currentTask = task || null;
    this.state.lastUpdate = new Date();
  }

  reset(): void {
    this.state = {
      status: 'IDLE',
      currentTask: null,
      lastUpdate: new Date()
    };
  }
}
