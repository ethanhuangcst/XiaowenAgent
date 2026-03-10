export type AgentStatus = 'IDLE' | 'PLANNING' | 'EXECUTING' | 'CONFIRMING';

export interface Task {
  id: string;
  type: 'GENERATE_OUTLINE' | 'GENERATE_CONTENT' | 'GENERATE_IMAGE' | 'PUBLISH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result?: any;
}

export interface Confirmation {
  id: string;
  type: 'OUTLINE_APPROVAL' | 'CONTENT_APPROVAL' | 'IMAGE_APPROVAL' | 'PUBLISH_APPROVAL';
  content: any;
  approved: boolean | null;
}

export interface AgentState {
  status: AgentStatus;
  currentTask: Task | null;
  pendingConfirmations: Confirmation[];
  currentProjectId?: string;
  lastUpdate: Date;
}

export class AgentStateMachine {
  private state: AgentState;

  constructor() {
    this.state = {
      status: 'IDLE',
      currentTask: null,
      pendingConfirmations: [],
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
    if (task) {
      this.state.currentTask = {
        id: `task-${Date.now()}`,
        type: 'GENERATE_OUTLINE',
        status: 'IN_PROGRESS'
      };
    }
    this.state.lastUpdate = new Date();
  }

  forceTransition(newStatus: AgentStatus, task?: string): void {
    this.state.status = newStatus;
    if (task) {
      this.state.currentTask = {
        id: `task-${Date.now()}`,
        type: 'GENERATE_OUTLINE',
        status: 'IN_PROGRESS'
      };
    }
    this.state.lastUpdate = new Date();
  }

  reset(): void {
    this.state = {
      status: 'IDLE',
      currentTask: null,
      pendingConfirmations: [],
      lastUpdate: new Date()
    };
  }
}
