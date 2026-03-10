export interface HotTopicSearchInput {
  content: string;
  keywords: string[];
  platform: 'wechat' | 'weibo' | 'douyin';
}

export interface HotTopic {
  topic: string;
  relevance: number;
  popularity: number;
  suggestedTags: string[];
}

export interface HotTopicSearchOutput {
  hotTopics: HotTopic[];
  recommendedTags: string[];
  searchTime: Date;
}

export class HotTopicSearchTool {
  name = 'search_hot_topics';
  description = '搜索热门话题，生成相关标签';
  
  private llmTool: any;
  private promptTemplateManager: any;

  constructor(llmTool: any, promptTemplateManager: any) {
    this.llmTool = llmTool;
    this.promptTemplateManager = promptTemplateManager;
  }

  async execute(input: HotTopicSearchInput): Promise<HotTopicSearchOutput> {
    console.log('🔍 开始搜索热门话题...');
    
    // 1. 获取当前热门话题（模拟数据，实际应该调用API）
    const trendingTopics = await this.fetchTrendingTopics(input.platform);
    console.log('获取的热门话题:', trendingTopics.length);
    
    // 2. 分析内容与热门话题的相关性
    const relevantTopics = await this.analyzeRelevance(
      input.content,
      input.keywords,
      trendingTopics
    );
    console.log('相关热门话题:', relevantTopics.length);
    
    // 3. 生成标签建议
    const recommendedTags = await this.generateTagSuggestions(relevantTopics);
    console.log('推荐标签:', recommendedTags);
    
    return {
      hotTopics: relevantTopics,
      recommendedTags: recommendedTags,
      searchTime: new Date()
    };
  }

  private async fetchTrendingTopics(platform: string): Promise<string[]> {
    // 模拟数据 - 宜际应该调用微信热搜API
    const mockTopics: Record<string, string[]> = {
      'wechat': [
        'AI人工智能',
        'ChatGPT',
        '数字化转型',
        '敏捷开发',
        '程序员成长',
        '技术趋势',
        '职场技能',
        '效率提升',
        '创新思维',
        '学习方法'
      ],
      'weibo': [
        'AI热点',
        '科技新闻',
        '职场话题',
        '学习成长'
      ],
      'douyin': [
        'AI教程',
        '技术分享',
        '职场干货'
      ]
    };

    return mockTopics[platform] || mockTopics['wechat'];
  }

  private async analyzeRelevance(
    content: string,
    keywords: string[],
    trendingTopics: string[]
  ): Promise<HotTopic[]> {
    // 使用动态模板
    const template = this.promptTemplateManager.getTemplate('tool-analyze-relevance');
    if (!template) {
      console.error('未找到模板: tool-analyze-relevance');
      return [];
    }
    
    const prompt = this.promptTemplateManager.renderTemplate(template, {
      content: content,
      keywords: keywords.join(', '),
      hotTopics: trendingTopics.join('\n')
    });

    try {
      // 使用动态System Prompt
      const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
      const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
        role: '热门话题分析专家',
        expertise: '擅长分析内容与热门话题的相关性，并推荐最佳标签',
        instruction: '请分析内容与热门话题的相关性'
      });
      
      const response = await this.llmTool.execute(prompt, systemPrompt);
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return result.topics || [];
      }
      
      return [];
    } catch (error) {
      console.error('分析相关性失败:', error);
      return [];
    }
  }

  private async generateTagSuggestions(relevantTopics: HotTopic[]): Promise<string[]> {
    const allTags = relevantTopics.flatMap(t => t.suggestedTags);
    const uniqueTags = [...new Set(allTags)];
    
    // 按相关性排序，选择最相关的标签
    return uniqueTags.slice(0, 5);
  }
}
