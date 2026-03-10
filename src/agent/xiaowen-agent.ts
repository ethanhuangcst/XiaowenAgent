import { AgentStateMachine } from './state-machine.js';
import { AgentDecisionEngine } from './decision-engine.js';
import { createLLMTool, LLMConfig, LLMTool } from './llm-tool.js';
import { AgentMemorySystem } from './memory-system.js';
import { PromptTemplateManager } from './prompt-template-manager.js';
import { ToolManager } from './tools/index.js';

export interface AgentConfig {
  llm: LLMConfig;
}

export class XiaowenAgent {
  private stateMachine: AgentStateMachine;
  private decisionEngine: AgentDecisionEngine;
  private llmTool: LLMTool;
  private memorySystem: AgentMemorySystem;
  private promptTemplateManager: PromptTemplateManager;
  private toolManager: ToolManager;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.stateMachine = new AgentStateMachine();
    this.decisionEngine = new AgentDecisionEngine();
    this.llmTool = createLLMTool(config.llm);
    this.memorySystem = new AgentMemorySystem();
    this.promptTemplateManager = new PromptTemplateManager();
    this.toolManager = new ToolManager(this.llmTool, this.promptTemplateManager);
  }

  async start(): Promise<void> {
    console.log('🤖 XiaowenAgent 启动');
    console.log('当前状态:', this.stateMachine.getState());
  }

  async optimizeOutline(outline: string, requirements?: string, background?: string): Promise<string> {
    console.log('📝 开始优化大纲...');
    
    this.stateMachine.transition('PLANNING', '优化大纲');
    
    // 选择最佳Prompt模板
    const template = this.promptTemplateManager.selectBestTemplate({
      category: 'outline',
      background: background
    });
    
    console.log(`使用模板: ${template.name} (成功率: ${(template.successRate * 100).toFixed(1)}%)`);
    
    // 渲染Prompt
    const prompt = this.promptTemplateManager.renderTemplate(template, {
      background: background || 'Ethan Huang，国际顶尖敏捷专家，精通Scrum, XP, TDD, ATDD, BDD等敏捷实践，研究SDD (Spec Driven Development)，有200+小时AI辅助开发实践经验。',
      outline: outline,
      requirements: requirements || ''
    });

    try {
      this.stateMachine.transition('EXECUTING', '调用LLM');
      
      // 使用动态System Prompt
      const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-default');
      if (!systemTemplate) {
        throw new Error('Template not found: system-prompt-default');
      }
      const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
        background: background || 'Ethan Huang，国际顶尖敏捷专家，有200+小时AI辅助开发实践经验',
        expertise: '擅长优化文章大纲，确保内容结构清晰、逻辑严密'
      });
      
      let response = await this.llmTool.execute(prompt, systemPrompt);
      
      // 使用工具优化Hook和标签
      const optimizedResult = await this.optimizeHookAndTagsWithTools(
        response.content,
        background || 'Ethan Huang，国际顶尖敏捷专家，有200+小时AI辅助开发实践经验。'
      );
      
      this.stateMachine.transition('CONFIRMING', '等待用户确认');
      
      this.memorySystem.learn({
        action: 'optimize_outline',
        outline: outline,
        result: optimizedResult,
        templateId: template.id
      });
      
      return optimizedResult;
    } catch (error) {
      this.stateMachine.forceTransition('IDLE');
      throw error;
    }
  }

  private async optimizeHookAndTagsWithTools(
    outline: string,
    background: string
  ): Promise<string> {
    console.log('🔧 使用工具优化Hook和标签...');
    
    try {
      // 1. 提取Key Message
      const keyMessageMatch = outline.match(/### Key Message:\s*(.+)/);
      const keyMessage = keyMessageMatch ? keyMessageMatch[1].trim() : '';
      
      if (!keyMessage) {
        console.log('未找到Key Message，跳过工具优化');
        return outline;
      }
      
      // 2. 使用Hook优化工具
      console.log('📞 调用Hook优化工具...');
      const hookResult = await this.toolManager.callTool('optimize_hook', {
        background: background,
        keyMessage: keyMessage,
        targetAudience: '微信公众号读者'
      });
      
      console.log('✅ Hook优化完成:', hookResult.hook);
      
      // 3. 使用热门话题搜索工具
      console.log('📞 调用热门话题搜索工具...');
      const keywords = this.extractKeywords(outline);
      const hotTopicResult = await this.toolManager.callTool('search_hot_topics', {
        content: outline,
        keywords: keywords,
        platform: 'wechat'
      });
      
      console.log('✅ 热门话题搜索完成:', hotTopicResult.recommendedTags);
      
      // 4. 替换优化后的Hook和标签
      let optimizedOutline = outline;
      
      // 替换Hook
      optimizedOutline = optimizedOutline.replace(
        /### Hook:\s*.+/,
        `### Hook: ${hookResult.hook}`
      );
      
      // 替换Tags
      optimizedOutline = optimizedOutline.replace(
        /### Tags:\s*.+/,
        `### Tags: ${hotTopicResult.recommendedTags.join(' ')}`
      );
      
      console.log('🎉 Hook和标签优化完成');
      
      return optimizedOutline;
    } catch (error) {
      console.error('❌ 工具优化失败，使用原始结果:', error);
      return outline;
    }
  }

  private extractKeywords(outline: string): string[] {
    // 简单的关键词提取逻辑
    const keywords: string[] = [];
    
    // 提取标题中的关键词
    const titleMatch = outline.match(/##\s*第\d+篇：(.+)/);
    if (titleMatch) {
      keywords.push(titleMatch[1].trim());
    }
    
    // 提取Key Message中的关键词
    const keyMessageMatch = outline.match(/### Key Message:\s*(.+)/);
    if (keyMessageMatch) {
      keywords.push(keyMessageMatch[1].trim());
    }
    
    // 提取标签中的关键词
    const tagsMatch = outline.match(/### Tags:\s*(.+)/);
    if (tagsMatch) {
      const tags = tagsMatch[1].match(/#(\S+)/g);
      if (tags) {
        keywords.push(...tags.map(t => t.replace('#', '')));
      }
    }
    
    return keywords;
  }

  async generateContent(outline: string, background?: string): Promise<{ article: string; videoPost: string }> {
    console.log('✍️ 开始生成内容...');
    
    this.stateMachine.transition('PLANNING', '生成内容');
    
    // 选择最佳模板
    const template = this.promptTemplateManager.selectBestTemplate({
      category: 'content',
      background: background
    });
    
    console.log(`使用模板: ${template.name} (成功率: ${(template.successRate * 100).toFixed(1)}%)`);
    
    // 获取用户偏好和成功案例
    const preferences = this.memorySystem.getPreferences();
    const relevantMemory = this.memorySystem.getRelevantMemory(outline);
    const successfulCases = relevantMemory.successfulCases.length > 0 
      ? relevantMemory.successfulCases[0].content 
      : '无';
    
    // 渲染Prompt
    const prompt = this.promptTemplateManager.renderTemplate(template, {
      background: background || 'Ethan Huang，国际顶尖敏捷专家，有200+小时AI辅助开发实践经验。',
      outline: outline,
      preferences: JSON.stringify(preferences, null, 2),
      successfulCases: successfulCases
    });

    try {
      this.stateMachine.transition('EXECUTING', '调用LLM');
      
      // 使用动态System Prompt
      const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-default');
      if (!systemTemplate) {
        throw new Error('Template not found: system-prompt-default');
      }
      const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
        background: background || 'Ethan Huang，国际顶尖敏捷专家，有200+小时AI辅助开发实践经验',
        expertise: '擅长撰写高质量的公众号文章和视频号图文内容'
      });
      
      const response = await this.llmTool.execute(prompt, systemPrompt);
      
      this.stateMachine.transition('CONFIRMING', '等待用户确认');
      
      this.memorySystem.learn({
        action: 'generate_content',
        outline: outline,
        result: response.content,
        templateId: template.id
      });
      
      // 解析返回的内容，分离公众号文章和视频号图文
      const content = response.content;
      const parts = content.split(/##\s*视频号图文/);
      
      const article = parts[0].replace(/##\s*公众号文章/, '').trim();
      const videoPost = parts[1] ? parts[1].trim() : '';
      
      return {
        article: article,
        videoPost: videoPost
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

  async optimizePromptBasedOnFeedback(
    templateId: string,
    originalResult: string,
    editedResult: string,
    feedback: string
  ): Promise<void> {
    console.log('🔧 开始优化Prompt模板...');
    
    const template = this.promptTemplateManager.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // 使用动态模板
    const toolTemplate = this.promptTemplateManager.getTemplate('tool-optimize-prompt');
    if (!toolTemplate) {
      throw new Error('Template not found: tool-optimize-prompt');
    }
    
    const analysisPrompt = this.promptTemplateManager.renderTemplate(toolTemplate, {
      originalTemplate: template.template,
      originalResult: originalResult,
      editedResult: editedResult,
      feedback: feedback
    });

    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    if (!systemTemplate) {
      throw new Error('Template not found: system-prompt-expert');
    }
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: 'Prompt优化专家',
      expertise: '擅长分析用户偏好和优化Prompt模板',
      instruction: '请根据用户的编辑和反馈优化Prompt模板'
    });

    try {
      const response = await this.llmTool.execute(analysisPrompt, systemPrompt);
      
      this.promptTemplateManager.updateTemplate(templateId, {
        template: response.content
      });
      
      this.memorySystem.learn({
        action: 'optimize_prompt',
        templateId: templateId,
        originalResult: originalResult,
        editedResult: editedResult,
        feedback: feedback
      });
      
      console.log('✅ Prompt模板优化完成');
    } catch (error) {
      console.error('❌ Prompt模板优化失败:', error);
      throw error;
    }
  }

  async createTemplateFromSuccess(
    successfulCase: {
      outline: string;
      content: string;
      views: number;
      engagement: number;
    }
  ): Promise<string> {
    console.log('📝 从成功案例创建新模板...');
    
    // 使用动态模板
    const toolTemplate = this.promptTemplateManager.getTemplate('tool-create-template');
    if (!toolTemplate) {
      throw new Error('Template not found: tool-create-template');
    }
    
    const createPrompt = this.promptTemplateManager.renderTemplate(toolTemplate, {
      outline: successfulCase.outline,
      content: successfulCase.content,
      views: successfulCase.views.toString(),
      engagement: successfulCase.engagement.toString()
    });

    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    if (!systemTemplate) {
      throw new Error('Template not found: system-prompt-expert');
    }
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: 'Prompt模板设计专家',
      expertise: '擅长从成功案例中提取最佳实践并创建可重用的模板',
      instruction: '请根据成功案例创建一个新的Prompt模板'
    });

    try {
      const response = await this.llmTool.execute(createPrompt, systemPrompt);
      
      const newTemplate = this.promptTemplateManager.addTemplate({
        name: `成功案例模板-${Date.now()}`,
        description: `基于浏览量${successfulCase.views}的成功案例创建`,
        template: response.content,
        variables: ['background', 'outline', 'requirements'],
        successRate: 0.9,
        usageCount: 0,
        tags: ['自动生成', '成功案例'],
        category: 'outline'
      });
      
      console.log(`✅ 新模板创建成功: ${newTemplate.id}`);
      return newTemplate.id;
    } catch (error) {
      console.error('❌ 创建模板失败:', error);
      throw error;
    }
  }

  async learnFromUserEdit(
    originalContent: string,
    editedContent: string
  ): Promise<void> {
    console.log('📚 学习用户编辑偏好...');
    
    // 使用动态模板
    const toolTemplate = this.promptTemplateManager.getTemplate('tool-analyze-preference');
    if (!toolTemplate) {
      throw new Error('Template not found: tool-analyze-preference');
    }
    
    const analysisPrompt = this.promptTemplateManager.renderTemplate(toolTemplate, {
      originalContent: originalContent,
      editedContent: editedContent
    });

    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    if (!systemTemplate) {
      throw new Error('Template not found: system-prompt-expert');
    }
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: '用户偏好分析专家',
      expertise: '擅长分析用户编辑行为并提取偏好模式',
      instruction: '请分析用户的编辑偏好'
    });

    try {
      const response = await this.llmTool.execute(analysisPrompt, systemPrompt);
      
      this.memorySystem.learn({
        action: 'learn_user_preference',
        editAnalysis: response.content,
        timestamp: new Date()
      });
      
      console.log('✅ 用户偏好学习完成');
    } catch (error) {
      console.error('❌ 用户偏好学习失败:', error);
      throw error;
    }
  }

  getPromptTemplateManager(): PromptTemplateManager {
    return this.promptTemplateManager;
  }

  async chat(message: string, context?: {
    background?: string;
    outline?: string;
    requirements?: string;
    optimizedOutline?: string;
  }): Promise<string> {
    console.log('💬 开始对话...');
    
    // 检查当前状态，如果不是IDLE，先重置
    const currentState = this.stateMachine.getState();
    if (currentState.status !== 'IDLE') {
      console.log('当前状态不是IDLE，先重置状态');
      this.stateMachine.forceTransition('IDLE');
    }
    
    this.stateMachine.transition('PLANNING', '对话');
    
    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    if (!systemTemplate) {
      throw new Error('Template not found: system-prompt-expert');
    }
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: '智能助手',
      expertise: '擅长理解用户需求并提供帮助',
      instruction: '请根据用户的消息和上下文提供有用的回复'
    });
    
    // 构建包含上下文的Prompt
    const prompt = `背景信息：${context?.background || '无'}

输入大纲：${context?.outline || '无'}

优化要求：${context?.requirements || '无'}

优化后的大纲：${context?.optimizedOutline || '无'}

用户反馈：${message}

请根据用户的反馈，优化大纲或提供建议。

重要规则：
1. 如果用户反馈是关于大纲优化的，请返回完整的大纲（包含Key Message、Hook、Tags）
2. 保持大纲的Markdown格式（# 标题，## 子标题等）
3. 确保每篇内容都包含：Key Message、Hook、Tags
4. 如果用户要求添加新内容（如"下期预告"），请保持原有格式并添加新内容
5. 不要删除或省略任何必需的字段（Key Message、Hook、Tags）`;

    try {
      this.stateMachine.transition('EXECUTING', '调用LLM');
      
      const response = await this.llmTool.execute(prompt, systemPrompt);
      
      this.stateMachine.transition('CONFIRMING', '等待用户确认');
      
      // 学习用户反馈
      this.memorySystem.learn({
        action: 'chat',
        message: message,
        context: context,
        response: response.content,
        timestamp: new Date()
      });
      
      return response.content;
    } catch (error) {
      this.stateMachine.forceTransition('IDLE');
      throw error;
    }
  }
}
