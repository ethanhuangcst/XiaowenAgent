import { createLLMTool, LLMConfig, LLMTool } from './llm-tool.js';

export interface SimpleAgentConfig {
  llm: LLMConfig;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface GeneratedContent {
  index: number;
  title: string;
  content: string;
  type: 'article' | 'video' | 'both';
  createdAt: Date;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
  execute: (params: any) => Promise<any>;
}

export class SimpleAgent {
  private llmTool: LLMTool;
  private conversationHistory: Message[] = [];
  private generatedContents: Map<number, GeneratedContent> = new Map();
  private tools: Map<string, Tool> = new Map();
  private context: {
    background?: string;
    outline?: string;
    theme?: string;
    type?: string;
    totalArticles?: number;
  } = {};

  constructor(config: SimpleAgentConfig) {
    this.llmTool = createLLMTool(config.llm);
    this.registerExternalTools();
    this.initWelcomeMessage();
  }

  private registerExternalTools(): void {
    this.registerTool({
      name: 'get_hot_news',
      description: '获取当前各平台热门话题（知乎、微博、抖音、B站等）',
      parameters: {
        type: 'object',
        properties: {
          platforms: {
            type: 'array',
            description: '平台列表，如 [1,2,5,6] 分别代表知乎、36氪、微博、抖音'
          }
        },
        required: ['platforms']
      },
      execute: async (params: { platforms: number[] }) => {
        try {
          const response = await fetch('http://localhost:3000/api/mcp/hotnews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sources: params.platforms })
          });
          
          if (!response.ok) {
            throw new Error(`获取热门话题失败: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('获取热门话题失败:', error);
          return { error: '获取热门话题失败，请稍后重试' };
        }
      }
    });

    this.registerTool({
      name: 'web_search',
      description: '搜索互联网获取实时信息',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索关键词'
          }
        },
        required: ['query']
      },
      execute: async (params: { query: string }) => {
        try {
          const response = await fetch('http://localhost:3000/api/mcp/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: params.query })
          });
          
          if (!response.ok) {
            throw new Error(`搜索失败: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('搜索失败:', error);
          return { error: '搜索失败，请稍后重试' };
        }
      }
    });

    this.registerTool({
      name: 'visit_webpage',
      description: '访问网页获取详细内容',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: '网页URL'
          }
        },
        required: ['url']
      },
      execute: async (params: { url: string }) => {
        try {
          const response = await fetch('http://localhost:3000/api/mcp/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: params.url })
          });
          
          if (!response.ok) {
            throw new Error(`访问网页失败: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('访问网页失败:', error);
          return { error: '访问网页失败，请稍后重试' };
        }
      }
    });

    this.registerTool({
      name: 'analyze_content_trends',
      description: '分析内容趋势，提供创作建议',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            description: '关键词列表'
          },
          platform: {
            type: 'string',
            description: '目标平台（wechat/bilibili/douyin）'
          }
        },
        required: ['keywords', 'platform']
      },
      execute: async (params: { keywords: string[]; platform: string }) => {
        const hotNews = await this.tools.get('get_hot_news')?.execute({
          platforms: [1, 5, 6]
        });
        
        if (!hotNews || hotNews.error) {
          return { error: '无法获取热门话题' };
        }

        const relevantTopics = this.filterRelevantTopics(hotNews, params.keywords);
        
        return {
          relevantHotTopics: relevantTopics,
          suggestions: this.generateSuggestions(relevantTopics, params.platform)
        };
      }
    });

    this.registerTool({
      name: 'optimize_content',
      description: '优化文案内容，提升吸引力和可读性',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '需要优化的文案内容'
          },
          optimization_type: {
            type: 'string',
            description: '优化类型：hook（开头）、title（标题）、readability（可读性）、engagement（互动性）'
          },
          target_platform: {
            type: 'string',
            description: '目标平台：wechat（公众号）、bilibili（B站）、douyin（抖音）'
          }
        },
        required: ['content', 'optimization_type']
      },
      execute: async (params: { content: string; optimization_type: string; target_platform?: string }) => {
        try {
          const response = await fetch('http://localhost:3000/api/mcp/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          });
          
          if (!response.ok) {
            throw new Error(`文案优化失败: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('文案优化失败:', error);
          return { error: '文案优化失败，请稍后重试' };
        }
      }
    });

    this.registerTool({
      name: 'analyze_readability',
      description: '分析文案可读性，提供改进建议',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: '需要分析的文案内容'
          }
        },
        required: ['content']
      },
      execute: async (params: { content: string }) => {
        const sentences = params.content.split(/[。！？\n]/).filter(s => s.trim());
        const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
        
        const issues: string[] = [];
        if (avgLength > 50) {
          issues.push('句子过长，建议拆分为短句');
        }
        if (!params.content.includes('\n')) {
          issues.push('缺少段落分隔，建议分段提高可读性');
        }
        
        return {
          readabilityScore: Math.max(0, 100 - avgLength),
          averageSentenceLength: avgLength,
          issues: issues,
          suggestions: [
            '使用短句提高可读性',
            '添加小标题分隔内容',
            '使用列表展示要点'
          ]
        };
      }
    });

    this.registerTool({
      name: 'generate_hooks',
      description: '生成吸引眼球的开头钩子',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: '文案主题'
          },
          style: {
            type: 'string',
            description: '风格：question（提问）、story（故事）、data（数据）、conflict（冲突）'
          },
          count: {
            type: 'number',
            description: '生成数量，默认3个'
          }
        },
        required: ['topic']
      },
      execute: async (params: { topic: string; style?: string; count?: number }) => {
        try {
          const response = await fetch('http://localhost:3000/api/mcp/hooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: params.topic,
              style: params.style || 'question',
              count: params.count || 3
            })
          });
          
          if (!response.ok) {
            throw new Error(`生成钩子失败: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          console.error('生成钩子失败:', error);
          return { error: '生成钩子失败，请稍后重试' };
        }
      }
    });

    console.log(`✅ 已注册 ${this.tools.size} 个外部工具`);
  }

  private filterRelevantTopics(hotNews: any, keywords: string[]): any[] {
    const allTopics: any[] = [];
    
    for (const platform in hotNews) {
      if (Array.isArray(hotNews[platform])) {
        hotNews[platform].forEach((item: any) => {
          const isRelevant = keywords.some(keyword => 
            item.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            item.description?.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (isRelevant) {
            allTopics.push({
              ...item,
              platform: platform
            });
          }
        });
      }
    }
    
    return allTopics.slice(0, 10);
  }

  private generateSuggestions(topics: any[], platform: string): string[] {
    const suggestions: string[] = [];
    
    if (topics.length === 0) {
      suggestions.push('当前没有发现相关的热门话题，建议关注行业动态');
    } else {
      suggestions.push(`发现 ${topics.length} 个相关热门话题，可以结合这些话题创作内容`);
      suggestions.push('建议在标题中融入热门关键词');
      suggestions.push('可以参考热门话题的角度和表达方式');
    }
    
    return suggestions;
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`📝 注册工具: ${tool.name} - ${tool.description}`);
  }

  private initWelcomeMessage(): void {
    const toolDescriptions = Array.from(this.tools.values())
      .map(t => `- **${t.name}**: ${t.description}`)
      .join('\n');

    this.conversationHistory = [{
      role: 'assistant',
      content: `你好！我是小文智能体，你的内容创作助手。

我可以帮你：
1. 优化文章大纲
2. 生成系列文案（公众号文章、视频号图文）
3. 获取热门话题和趋势
4. 搜索互联网获取实时信息
5. 修改和调整内容

当前可用工具：
${toolDescriptions}

请告诉我你的需求，我会根据对话自然地帮助你完成任务。`,
      timestamp: new Date()
    }];
  }

  async chat(userMessage: string): Promise<string> {
    console.log('💬 用户消息:', userMessage);

    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    const systemPrompt = await this.buildDynamicSystemPrompt();
    const conversationContext = this.buildConversationContext();

    try {
      const response = await this.llmTool.execute(
        conversationContext,
        systemPrompt
      );

      let assistantMessage = response.content;

      const toolCalls = this.extractToolCalls(assistantMessage);
      if (toolCalls.length > 0) {
        console.log(`🔧 检测到 ${toolCalls.length} 个工具调用`);
        
        const toolResults: Array<{ name: string; result: any }> = [];
        
        for (const toolCall of toolCalls) {
          const toolResult = await this.executeTool(toolCall.name, toolCall.params);
          toolResults.push({
            name: toolCall.name,
            result: toolResult
          });
        }
        
        const toolResultsContext = toolResults.map(tr => 
          `工具 ${tr.name} 的执行结果：
${JSON.stringify(tr.result, null, 2)}`
        ).join('\n\n');
        
        const followUpPrompt = `我刚刚调用了以下工具：

${toolResultsContext}

请根据这些工具结果，用自然、友好的语言向用户解释结果，并提供有用的见解或建议。

要求：
1. 不要直接显示JSON数据
2. 用简洁明了的语言总结关键信息
3. 提供有价值的见解或建议
4. 如果用户需要更多信息，主动询问
5. 保持对话的自然流畅`;

        const followUpResponse = await this.llmTool.execute(
          followUpPrompt,
          '你是一个友好的助手，擅长将复杂的技术结果转化为易懂的自然语言。'
        );
        
        assistantMessage = followUpResponse.content;
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      });

      this.parseAndUpdateContent(assistantMessage);

      console.log('✅ 智能体回复:', assistantMessage.substring(0, 100) + '...');

      return assistantMessage;
    } catch (error) {
      console.error('❌ LLM调用失败:', error);
      throw error;
    }
  }

  private async buildDynamicSystemPrompt(): Promise<string> {
    const toolDescriptions = Array.from(this.tools.values())
      .map(t => {
        const params = Object.entries(t.parameters.properties)
          .map(([key, val]) => `    - ${key}: ${val.description}`)
          .join('\n');
        return `- **${t.name}**: ${t.description}
  参数：
${params}`;
      })
      .join('\n\n');

    return `你是小文智能体，一个专业、友好、高效的内容创作助手。

## 你的性格特点
- **专业但不生硬** - 深耕内容创作领域，但用通俗易懂的语言表达
- **高效但不急躁** - 快速理解需求，但耐心解释和建议
- **主动但不强势** - 主动提供建议，但尊重用户选择
- **有温度** - 适时使用emoji，让对话更亲切

## 当前状态
- 主题：${this.context.theme || '未设置'}
- 类型：${this.context.type || '未设置'}
- 总篇数：${this.context.totalArticles || 0}
- 已生成：${this.generatedContents.size} 篇
- 背景：${this.context.background || '未设置'}

## 可用工具
${toolDescriptions}

## 工具调用格式
当需要使用工具时，在回复中插入：
\`\`\`
[TOOL:工具名|参数JSON]
\`\`\`
例如：
- 获取热门话题：[TOOL:get_hot_news|{"platforms":[1,5,6]}]
- 搜索信息：[TOOL:web_search|{"query":"关键词"}]
- 访问网页：[TOOL:visit_webpage|{"url":"https://..."}]

## 对话原则
1. **自然对话** - 像真人一样交流，避免机械式回复
2. **主动使用工具** - 当需要外部信息时，主动调用工具
3. **智能理解** - 理解用户意图，不要拘泥于字面意思
4. **简洁清晰** - 回复要简洁明了，重点突出
5. **友好表达** - 用自然语言解释结果，不要直接显示JSON
6. **主动引导** - 提供下一步建议，帮助用户推进任务

## 文案生成规则
- 视频号图文：5-7段精要内容，每段2-3行
- 公众号文章：至少500字，Markdown格式
- BOTH：同时生成两种格式

## 特殊标记（用于系统解析）
生成文案时，在回复末尾添加：
\`\`\`
[CONTENT:index|title|type]
\`\`\`

## 注意事项
- 不要硬性流程，让对话自然流动
- 主动使用工具获取真实信息
- 灵活应对用户需求变化
- 工具调用后，用自然语言解释结果`;
  }

  private buildConversationContext(): string {
    const recentMessages = this.conversationHistory.slice(-10);
    
    let context = '## 对话历史\n\n';
    
    for (const msg of recentMessages) {
      const role = msg.role === 'user' ? '用户' : '助手';
      context += `**${role}**：${msg.content}\n\n`;
    }

    if (this.context.outline) {
      context += `\n## 当前大纲\n\n${this.context.outline}\n`;
    }

    return context;
  }

  private extractToolCalls(message: string): Array<{
    name: string;
    params: any;
    original: string;
  }> {
    const toolCallRegex = /\[TOOL:(\w+)\|(\{[^}]+\})\]/g;
    const calls: Array<{ name: string; params: any; original: string }> = [];
    
    let match;
    while ((match = toolCallRegex.exec(message)) !== null) {
      try {
        calls.push({
          name: match[1],
          params: JSON.parse(match[2]),
          original: match[0]
        });
      } catch (error) {
        console.error('工具调用参数解析失败:', match[0]);
      }
    }
    
    return calls;
  }

  private async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      console.error(`❌ 工具不存在: ${name}`);
      return { error: `工具 ${name} 不存在` };
    }

    try {
      console.log(`🔧 执行工具: ${name}`, params);
      const result = await tool.execute(params);
      console.log(`✅ 工具执行成功`);
      return result;
    } catch (error) {
      console.error(`❌ 工具执行失败: ${name}`, error);
      return { error: `工具执行失败: ${error}` };
    }
  }

  private parseAndUpdateContent(message: string): void {
    const contentMatch = message.match(/\[CONTENT:(\d+)\|([^\|]+)\|(article|video|both)\]/);
    
    if (contentMatch) {
      const index = parseInt(contentMatch[1]);
      const title = contentMatch[2];
      const type = contentMatch[3] as 'article' | 'video' | 'both';
      
      const contentText = message
        .replace(/\[CONTENT:\d+\|[^\|]+\|[^\]]+\]/, '')
        .replace(/```[\s\S]*?```/g, '')
        .trim();

      this.generatedContents.set(index, {
        index,
        title,
        content: contentText,
        type,
        createdAt: new Date()
      });

      console.log(`📝 已保存第${index}篇文案: ${title}`);
    }

    const outlineMatch = message.match(/#\s+.+[\s\S]*?(?=\n\n|$)/);
    if (outlineMatch && message.includes('大纲')) {
      this.context.outline = outlineMatch[0].trim();
      console.log('📋 已更新大纲');
    }

    const themeMatch = message.match(/主题[：:]\s*(.+)/);
    if (themeMatch) {
      this.context.theme = themeMatch[1].trim();
    }

    const typeMatch = message.match(/类型[：:]\s*(公众号|视频号|BOTH)/);
    if (typeMatch) {
      this.context.type = typeMatch[1].trim();
    }

    const countMatch = message.match(/(\d+)\s*篇/);
    if (countMatch) {
      this.context.totalArticles = parseInt(countMatch[1]);
    }
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  getGeneratedContents(): GeneratedContent[] {
    return Array.from(this.generatedContents.values()).sort((a, b) => a.index - b.index);
  }

  getContext() {
    return { ...this.context };
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  reset(): void {
    this.conversationHistory = [];
    this.generatedContents.clear();
    this.context = {};
    this.initWelcomeMessage();
    console.log('🔄 Agent已重置');
  }
}
