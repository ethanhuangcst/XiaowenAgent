import { EventEmitter } from 'events';
import { db } from '../db/client.js';
import { generateJson } from '../lib/llm.js';

export type AgentStatus = 'IDLE' | 'PLANNING' | 'CONFIRMING' | 'EXECUTING' | 'COMPLETING' | 'LEARNING';

export interface AgentState {
  status: AgentStatus;
  currentProjectId: string | null;
  currentTask: Task | null;
  pendingConfirmations: Confirmation[];
  executionHistory: ExecutionLog[];
}

export interface Task {
  id: string;
  type: 'GENERATE_OUTLINE' | 'GENERATE_CONTENT' | 'GENERATE_IMAGE' | 'PUBLISH' | 'LEARN';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  params: any;
  result?: any;
  error?: string;
}

export interface Confirmation {
  id: string;
  type: 'OUTLINE_APPROVAL' | 'CONTENT_APPROVAL' | 'IMAGE_APPROVAL' | 'PUBLISH_APPROVAL';
  content: any;
  timestamp: Date;
  resolved: boolean;
  approved?: boolean;
  modifications?: any;
}

export interface ExecutionLog {
  timestamp: Date;
  action: string;
  params: any;
  result?: any;
  error?: string;
}

export class AgentCore extends EventEmitter {
  private state: AgentState;
  
  constructor() {
    super();
    this.state = {
      status: 'IDLE',
      currentProjectId: null,
      currentTask: null,
      pendingConfirmations: [],
      executionHistory: []
    };
  }
  
  async start(projectId: string, taskConfig: any) {
    this.state.currentProjectId = projectId;
    this.state.status = 'PLANNING';
    this.emit('stateChange', this.state);
    
    await this.executeTask(taskConfig);
  }
  
  private async executeTask(taskConfig: any) {
    this.state.status = 'EXECUTING';
    this.state.currentTask = {
      id: Math.random().toString(36).substring(2, 9),
      type: taskConfig.task,
      status: 'RUNNING',
      params: taskConfig.params
    };
    this.emit('stateChange', this.state);
    
    try {
      if (taskConfig.task === 'GENERATE_OUTLINE') {
        const result = await this.generateOutline(taskConfig.params);
        this.state.currentTask.result = result;
        this.state.currentTask.status = 'COMPLETED';
        
        // 决策：所有大纲都需要用户确认
        await this.requestConfirmation('OUTLINE_APPROVAL', result);
      }
    } catch (error) {
      this.state.currentTask.status = 'FAILED';
      this.state.currentTask.error = error instanceof Error ? error.message : 'Unknown error';
      this.state.status = 'IDLE';
      this.emit('stateChange', this.state);
    }
  }
  
  private async requestConfirmation(type: Confirmation['type'], content: any) {
    const confirmation: Confirmation = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      content,
      timestamp: new Date(),
      resolved: false
    };
    
    this.state.pendingConfirmations.push(confirmation);
    this.state.status = 'CONFIRMING';
    this.emit('confirmationRequired', confirmation);
    this.emit('stateChange', this.state);
  }
  
  async confirm(confirmationId: string, approved: boolean, modifications?: any) {
    const confirmation = this.state.pendingConfirmations.find(c => c.id === confirmationId);
    if (!confirmation) {
      throw new Error('Confirmation not found');
    }
    
    confirmation.resolved = true;
    confirmation.approved = approved;
    confirmation.modifications = modifications;
    
    if (approved) {
      // 用户批准，保存最终结果
      if (confirmation.type === 'OUTLINE_APPROVAL' && this.state.currentProjectId) {
        await this.saveOutline(confirmation.content, modifications);
      }
      
      this.state.status = 'COMPLETING';
      this.emit('stateChange', this.state);
      
      // 学习用户修改（如果有）
      if (modifications) {
        this.state.status = 'LEARNING';
        this.emit('stateChange', this.state);
        await this.learnFromModifications(confirmation.content, modifications);
      }
      
      this.state.status = 'IDLE';
      this.emit('stateChange', this.state);
    } else {
      // 用户拒绝，返回规划状态
      this.state.status = 'PLANNING';
      this.emit('stateChange', this.state);
    }
  }
  
  private async generateOutline(params: any) {
    const { outline, prompt, providerId } = params;
    
    const system = "你是内容策划专家，请直接输出JSON，不要有任何额外说明。";
    const userPrompt = `基于以下大纲，补充钩子、标签、关键词：

${outline}

返回JSON：
{
  "topic": "优化后的主题",
  "posts": [
    {
      "index": 1,
      "title": "标题",
      "keyMessage": "核心观点",
      "hook": "吸引技巧",
      "tags": ["#标签"],
      "keywords": ["关键词"]
    }
  ]
}`;
    
    const result = await generateJson(system, userPrompt, providerId);
    
    return result;
  }
  
  private async saveOutline(content: any, modifications?: any) {
    if (!this.state.currentProjectId) return;
    
    const project = await db.project.findById(this.state.currentProjectId);
    
    // 如果有修改，使用修改后的内容
    const finalContent = modifications || content;
    
    if (finalContent.topic) {
      await db.project.update(this.state.currentProjectId, { topic: finalContent.topic });
    }
    
    if (finalContent.posts && finalContent.posts.length > 0) {
      // 清除旧的posts
      const existingPosts = await db.post.findByProjectId(this.state.currentProjectId);
      // 注意：这里需要实现删除功能，暂时跳过
      
      for (const postData of finalContent.posts) {
        await db.post.create({
          projectId: this.state.currentProjectId,
          index: postData.index - 1,
          platform: 'WeChat_OA',
          outline: {
            seriesTitle: Array.isArray(postData.seriesTitle) ? postData.seriesTitle[0] : (postData.seriesTitle || project?.topic),
            title: postData.title,
            keyMessage: postData.keyMessage || '',
            hook: postData.hook || '',
            tags: postData.tags || [],
            keywords: postData.keywords || [],
            status: '草稿'
          },
          status: 'Pending'
        });
      }
    }
  }
  
  private async learnFromModifications(original: any, modifications: any) {
    // 简单的学习：记录用户修改
    console.log('Learning from modifications:');
    console.log('Original:', original);
    console.log('Modifications:', modifications);
    
    // TODO: 实现更复杂的学习逻辑
    // 例如：记录用户偏好、常见修改模式等
  }
  
  getState(): AgentState {
    return this.state;
  }
}
