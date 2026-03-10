import { AgentStateMachine, AgentStatus } from './state-machine.js';

export type WorkflowStep = 
  | 'OPTIMIZE_OUTLINE'
  | 'CONFIRM_OUTLINE'
  | 'GENERATE_CONTENT'
  | 'CONFIRM_CONTENT'
  | 'SCHEDULE_PUBLISH'
  | 'COMPLETE';

export interface Decision {
  step: WorkflowStep;
  action: string;
  params?: any;
}

export class AgentDecisionEngine {
  private stateMachine: AgentStateMachine;
  private currentStep: WorkflowStep;

  constructor() {
    this.stateMachine = new AgentStateMachine();
    this.currentStep = 'OPTIMIZE_OUTLINE';
  }

  decide(): Decision {
    const status = this.stateMachine.getState().status;

    switch (this.currentStep) {
      case 'OPTIMIZE_OUTLINE':
        return this.decideOptimizeOutline(status);
      
      case 'CONFIRM_OUTLINE':
        return this.decideConfirmOutline(status);
      
      case 'GENERATE_CONTENT':
        return this.decideGenerateContent(status);
      
      case 'CONFIRM_CONTENT':
        return this.decideConfirmContent(status);
      
      case 'SCHEDULE_PUBLISH':
        return this.decideSchedulePublish(status);
      
      case 'COMPLETE':
        return {
          step: 'COMPLETE',
          action: '工作流已完成'
        };
      
      default:
        throw new Error(`Unknown step: ${this.currentStep}`);
    }
  }

  private decideOptimizeOutline(status: AgentStatus): Decision {
    if (status === 'IDLE') {
      this.stateMachine.transition('PLANNING', '优化大纲');
      return {
        step: 'OPTIMIZE_OUTLINE',
        action: '调用LLM优化大纲',
        params: {
          task: 'optimize_outline'
        }
      };
    }
    
    if (status === 'PLANNING') {
      this.stateMachine.transition('EXECUTING', '调用LLM');
      return {
        step: 'OPTIMIZE_OUTLINE',
        action: '执行大纲优化',
        params: {
          task: 'execute_optimization'
        }
      };
    }
    
    if (status === 'EXECUTING') {
      this.stateMachine.transition('CONFIRMING', '等待用户确认大纲');
      this.currentStep = 'CONFIRM_OUTLINE';
      return {
        step: 'CONFIRM_OUTLINE',
        action: '等待用户确认大纲'
      };
    }

    return {
      step: 'OPTIMIZE_OUTLINE',
      action: '等待状态转换'
    };
  }

  private decideConfirmOutline(status: AgentStatus): Decision {
    if (status === 'CONFIRMING') {
      return {
        step: 'CONFIRM_OUTLINE',
        action: '等待用户确认大纲'
      };
    }

    return {
      step: 'CONFIRM_OUTLINE',
      action: '等待用户确认'
    };
  }

  private decideGenerateContent(status: AgentStatus): Decision {
    if (status === 'IDLE') {
      this.stateMachine.transition('PLANNING', '生成内容');
      return {
        step: 'GENERATE_CONTENT',
        action: '准备生成内容',
        params: {
          task: 'prepare_content_generation'
        }
      };
    }

    if (status === 'PLANNING') {
      this.stateMachine.transition('EXECUTING', '调用LLM生成内容');
      return {
        step: 'GENERATE_CONTENT',
        action: '生成公众号文章和视频号图文',
        params: {
          task: 'generate_content'
        }
      };
    }

    if (status === 'EXECUTING') {
      this.stateMachine.transition('CONFIRMING', '等待用户确认内容');
      this.currentStep = 'CONFIRM_CONTENT';
      return {
        step: 'CONFIRM_CONTENT',
        action: '等待用户确认内容'
      };
    }

    return {
      step: 'GENERATE_CONTENT',
      action: '等待状态转换'
    };
  }

  private decideConfirmContent(status: AgentStatus): Decision {
    if (status === 'CONFIRMING') {
      return {
        step: 'CONFIRM_CONTENT',
        action: '等待用户确认内容'
      };
    }

    return {
      step: 'CONFIRM_CONTENT',
      action: '等待用户确认'
    };
  }

  private decideSchedulePublish(status: AgentStatus): Decision {
    if (status === 'IDLE') {
      this.stateMachine.transition('PLANNING', '定时发布');
      return {
        step: 'SCHEDULE_PUBLISH',
        action: '准备发布',
        params: {
          task: 'prepare_publish'
        }
      };
    }

    if (status === 'PLANNING') {
      this.stateMachine.transition('EXECUTING', '调用发布API');
      return {
        step: 'SCHEDULE_PUBLISH',
        action: '发布到公众号、视频号、朋友圈',
        params: {
          task: 'execute_publish'
        }
      };
    }

    if (status === 'EXECUTING') {
      this.stateMachine.transition('IDLE');
      this.currentStep = 'COMPLETE';
      return {
        step: 'COMPLETE',
        action: '工作流已完成'
      };
    }

    return {
      step: 'SCHEDULE_PUBLISH',
      action: '等待状态转换'
    };
  }

  confirm(approved: boolean): void {
    if (approved) {
      this.stateMachine.transition('IDLE');
      
      if (this.currentStep === 'CONFIRM_OUTLINE') {
        this.currentStep = 'GENERATE_CONTENT';
      } else if (this.currentStep === 'CONFIRM_CONTENT') {
        this.currentStep = 'SCHEDULE_PUBLISH';
      }
    } else {
      if (this.currentStep === 'CONFIRM_OUTLINE') {
        this.currentStep = 'OPTIMIZE_OUTLINE';
        this.stateMachine.transition('PLANNING', '重新优化大纲');
      } else if (this.currentStep === 'CONFIRM_CONTENT') {
        this.currentStep = 'GENERATE_CONTENT';
        this.stateMachine.transition('PLANNING', '重新生成内容');
      }
    }
  }

  getCurrentStep(): WorkflowStep {
    return this.currentStep;
  }

  getState() {
    return this.stateMachine.getState();
  }
}
