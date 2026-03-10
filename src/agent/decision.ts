import { AgentState, Task, Confirmation } from './state-machine.js';
import { db } from '../db/client.js';
import { generateJson } from '../lib/llm.js';

export interface Action {
  type: 'REQUEST_CONFIRMATION' | 'EXECUTE_TASK' | 'COMPLETE' | 'LEARN';
  payload: any;
}

export interface DecisionContext {
  project: any;
  posts: any[];
  currentTask: Task | null;
  pendingConfirmations: Confirmation[];
  isCriticalDecision: boolean;
}

export class DecisionEngine {
  async decide(state: AgentState): Promise<Action> {
    const context = await this.analyzeState(state);
    
    if (this.needsConfirmation(context)) {
      return {
        type: 'REQUEST_CONFIRMATION',
        payload: {
          type: this.getConfirmationType(context),
          content: context.currentTask?.result
        }
      };
    }
    
    return this.planNextAction(context);
  }
  
  private async analyzeState(state: AgentState): Promise<DecisionContext> {
    if (!state.currentProjectId) {
      throw new Error('No active project');
    }
    
    const project = await db.project.findById(state.currentProjectId);
    const posts = await db.post.findByProjectId(state.currentProjectId);
    
    return {
      project,
      posts,
      currentTask: state.currentTask,
      pendingConfirmations: state.pendingConfirmations,
      isCriticalDecision: this.isCriticalDecision(state)
    };
  }
  
  private needsConfirmation(context: DecisionContext): boolean {
    if (!context.currentTask) return false;
    
    return (
      context.currentTask.status === 'COMPLETED' &&
      ['GENERATE_OUTLINE', 'GENERATE_CONTENT', 'GENERATE_IMAGE'].includes(context.currentTask.type)
    );
  }
  
  private isCriticalDecision(state: AgentState): boolean {
    if (!state.currentTask) return false;
    
    const criticalTasks = ['GENERATE_OUTLINE', 'GENERATE_CONTENT', 'PUBLISH'];
    return criticalTasks.includes(state.currentTask.type);
  }
  
  private getConfirmationType(context: DecisionContext): Confirmation['type'] {
    if (!context.currentTask) return 'CONTENT_APPROVAL';
    
    switch (context.currentTask.type) {
      case 'GENERATE_OUTLINE':
        return 'OUTLINE_APPROVAL';
      case 'GENERATE_CONTENT':
        return 'CONTENT_APPROVAL';
      case 'GENERATE_IMAGE':
        return 'IMAGE_APPROVAL';
      case 'PUBLISH':
        return 'PUBLISH_APPROVAL';
      default:
        return 'CONTENT_APPROVAL';
    }
  }
  
  private async planNextAction(context: DecisionContext): Promise<Action> {
    const { project, posts } = context;
    
    if (project.status === 'Draft' && project.outline) {
      return {
        type: 'EXECUTE_TASK',
        payload: {
          type: 'GENERATE_OUTLINE',
          tool: 'llm_generate',
          params: {
            prompt: project.prompt,
            outline: project.outline
          }
        }
      };
    }
    
    if (project.status === 'Outline') {
      const pendingPosts = posts.filter(p => p.status === 'Pending');
      if (pendingPosts.length > 0) {
        return {
          type: 'EXECUTE_TASK',
          payload: {
            type: 'GENERATE_CONTENT',
            tool: 'llm_generate',
            params: {
              post: pendingPosts[0]
            }
          }
        };
      }
    }
    
    if (project.status === 'Content') {
      return {
        type: 'COMPLETE',
        payload: {
          projectId: project.id,
          status: 'Ready'
        }
      };
    }
    
    return {
      type: 'COMPLETE',
      payload: {}
    };
  }
}
