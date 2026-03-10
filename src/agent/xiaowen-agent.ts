import { AgentStateMachine } from './state-machine.js';
import { AgentDecisionEngine } from './decision-engine.js';
import { createLLMTool, LLMConfig, LLMTool } from './llm-tool.js';
import { AgentMemorySystem } from './memory-system.js';

export interface AgentConfig {
  llm: LLMConfig;
}

export class XiaowenAgent {
  private stateMachine: AgentStateMachine;
  private decisionEngine: AgentDecisionEngine;
  private llmTool: LLMTool;
  private memorySystem: AgentMemorySystem;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.stateMachine = new AgentStateMachine();
    this.decisionEngine = new AgentDecisionEngine();
    this.llmTool = createLLMTool(config.llm);
    this.memorySystem = new AgentMemorySystem();
  }

  async start(): Promise<void> {
    console.log('🤖 XiaowenAgent 启动');
    console.log('当前状态:', this.stateMachine.getState());
  }

  async optimizeOutline(outline: string, requirements?: string): Promise<string> {
    console.log('📝 开始优化大纲...');
    
    this.stateMachine.transition('PLANNING', '优化大纲');
    
    const prompt = `请优化以下大纲：

${outline}

${requirements ? `优化要求：${requirements}` : ''}

请返回优化后的Markdown格式大纲。`;

    try {
      this.stateMachine.transition('EXECUTING', '调用LLM');
      
      const response = await this.llmTool.execute(prompt, '你是微信公众号涨粉专家，擅长优化文章大纲。');
      
      this.stateMachine.transition('CONFIRMING', '等待用户确认');
      
      this.memorySystem.learn({
        action: 'optimize_outline',
        outline: outline,
        result: response.content
      });
      
      return response.content;
    } catch (error) {
      this.stateMachine.forceTransition('IDLE');
      throw error;
    }
  }

  async generateContent(outline: string): Promise<{ article: string; videoPost: string }> {
    console.log('✍️ 开始生成内容...');
    
    this.stateMachine.transition('PLANNING', '生成内容');
    
    const preferences = this.memorySystem.getPreferences();
    const relevantMemory = this.memorySystem.getRelevantMemory(outline);
    
    const articlePrompt = `基于以下大纲生成公众号文章：

${outline}

要求：
- 字数：500字以内
- 风格：${preferences.writingStyle || '专业友好'}
- 调性：${preferences.preferredTone || '简洁明了'}
- 参考：${relevantMemory.successfulCases.length > 0 ? relevantMemory.successfulCases[0].content : '无'}

请返回Markdown格式的文章内容。`;

    const videoPostPrompt = `基于以下大纲生成视频号图文：

${outline}

要求：
- 数量：6-7张图片
- 每张：带标题的文字图片
- 内容：文章概要
- 风格：${preferences.writingStyle || '专业友好'}

请返回Markdown格式的图文内容，格式如下：
# 图片1标题
图片1文字内容

# 图片2标题
图片2文字内容
...`;

    try {
      this.stateMachine.transition('EXECUTING', '调用LLM');
      
      const [articleResponse, videoPostResponse] = await Promise.all([
        this.llmTool.execute(articlePrompt, '你是微信公众号涨粉专家，擅长撰写爆款文章。'),
        this.llmTool.execute(videoPostPrompt, '你是视频号图文专家，擅长制作吸引人的图文内容。')
      ]);
      
      this.stateMachine.transition('CONFIRMING', '等待用户确认');
      
      this.memorySystem.learn({
        action: 'generate_content',
        outline: outline,
        article: articleResponse.content,
        videoPost: videoPostResponse.content
      });
      
      return {
        article: articleResponse.content,
        videoPost: videoPostResponse.content
      };
    } catch (error) {
      this.stateMachine.forceTransition('IDLE');
      throw error;
    }
  }

  confirm(approved: boolean, feedback?: string): void {
    console.log(approved ? '✅ 用户确认' : '❌ 用户拒绝');
    
    this.decisionEngine.confirm(approved);
    
    if (feedback) {
      this.memorySystem.learn({ feedback }, feedback);
    }
    
    const currentState = this.stateMachine.getState();
    if (currentState.status !== 'IDLE') {
      this.stateMachine.transition('IDLE');
    }
  }

  getState() {
    return {
      agentState: this.stateMachine.getState(),
      currentStep: this.decisionEngine.getCurrentStep(),
      preferences: this.memorySystem.getPreferences()
    };
  }

  getMemory() {
    return this.memorySystem.getMemory();
  }

  getHistory(limit: number = 10) {
    return this.memorySystem.getHistory(limit);
  }

  getSuccessfulCases(limit: number = 5) {
    return this.memorySystem.getSuccessfulCases(limit);
  }

  reset(): void {
    this.stateMachine.reset();
    this.memorySystem.clear();
    console.log('🔄 Agent已重置');
  }
}
