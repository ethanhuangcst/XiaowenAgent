export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  successRate: number;
  usageCount: number;
  tags: string[];
  category: 'outline' | 'content' | 'image' | 'publish' | 'system' | 'tool';
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptFeedback {
  templateId: string;
  rating: number;
  feedback: string;
  timestamp: Date;
}

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private feedbackHistory: PromptFeedback[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'outline-default',
        name: '默认大纲优化模板',
        description: '适用于大多数内容的大纲优化模板',
        template: `你是{background}

请优化以下大纲，确保每篇都包含以下字段：
- Key Message：核心观点（一句话）
- Hook：吸引技巧（开头3秒吸引技巧，必须深度结合背景信息中的真实经历，让读者与作者的背景产生强烈共鸣）
- Tags：标签（2-3个热门标签，使用微信运营大牛的技能，设计更容易吸粉、引流的标签）

原始大纲：
{outline}

{requirements}

请返回优化后的Markdown格式大纲，格式如下：

# 系列标题

## 第N篇：文章标题

### Key Message: 核心观点
### Hook: 吸引技巧（基于真实经历，产生共鸣）
### Tags: #标签1 #标签2

---

请确保：
1. 每篇都有Key Message、Hook和Tags
2. Key Message简洁有力，直击痛点
3. Hook必须深度结合背景信息中的真实经历：
   - 提取背景中的关键经历、成就、挑战
   - 用具体的故事或数据引发共鸣
   - 让读者感受到作者的专业性和真实性
   - 避免空洞的表述，用具体细节打动读者
4. Tags使用微信运营大牛的技能：
   - 选择热门话题标签，提高曝光率
   - 使用精准定位标签，吸引目标用户
   - 添加情绪共鸣标签，增加互动率
   - 结合时事热点标签，提升传播力
   - 避免过于宽泛的标签，追求精准引流
5. 内容真实可信，避免空洞理论`,
        variables: ['background', 'outline', 'requirements'],
        successRate: 0.8,
        usageCount: 0,
        tags: ['通用', '大纲', '优化'],
        category: 'outline',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'outline-story',
        name: '故事化大纲模板',
        description: '适用于故事化内容的大纲优化模板',
        template: `你是{background}，擅长讲故事。

请将以下大纲优化为故事化内容，确保每篇都包含：
- Key Message：核心观点（一句话）
- Hook：故事开头（用真实经历引发共鸣）
- Tags：标签（2-3个热门标签）

原始大纲：
{outline}

{requirements}

请返回优化后的Markdown格式大纲，强调故事性和情感共鸣。`,
        variables: ['background', 'outline', 'requirements'],
        successRate: 0.75,
        usageCount: 0,
        tags: ['故事', '情感', '共鸣'],
        category: 'outline',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'outline-professional',
        name: '专业干货模板',
        description: '适用于专业干货内容的大纲优化模板',
        template: `你是{background}，专业领域专家。

请优化以下大纲为专业干货内容，确保每篇都包含：
- Key Message：核心观点（一句话）
- Hook：专业洞察（用专业视角引发思考）
- Tags：标签（2-3个专业标签）

原始大纲：
{outline}

{requirements}

请返回优化后的Markdown格式大纲，强调专业性和实用价值。`,
        variables: ['background', 'outline', 'requirements'],
        successRate: 0.85,
        usageCount: 0,
        tags: ['专业', '干货', '实用'],
        category: 'outline',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'content-default',
        name: '默认内容生成模板',
        description: '适用于大多数内容的内容生成模板',
        template: `你是{background}

基于以下大纲生成内容：

{outline}

用户偏好：
{preferences}

成功案例参考：
{successfulCases}

请生成以下内容：

## 公众号文章
要求：
- 字数：500字以内
- 风格：{preferences.writingStyle}
- 调性：{preferences.preferredTone}
- 内容：全文
- 格式：Markdown

## 视频号图文
要求：
- 数量：6-7张图片
- 每张：带标题的文字图片
- 内容：文章概要
- 格式：Markdown

请确保：
1. 内容真实可信，避免空洞理论
2. 使用用户偏好的风格和调性
3. 参考成功案例的优点
4. 公众号文章和视频号图文内容一致

请返回Markdown格式的内容。`,
        variables: ['background', 'outline', 'preferences', 'successfulCases'],
        successRate: 0.8,
        usageCount: 0,
        tags: ['通用', '内容', '生成'],
        category: 'content',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'content-story',
        name: '故事化内容模板',
        description: '适用于故事化内容的内容生成模板',
        template: `你是{background}，擅长讲故事。

基于以下大纲生成故事化内容：

{outline}

用户偏好：
{preferences}

请生成以下内容：

## 公众号文章
要求：
- 字数：500字以内
- 风格：故事化、情感化
- 开头：用真实经历引发共鸣
- 内容：全文
- 格式：Markdown

## 视频号图文
要求：
- 数量：6-7张图片
- 每张：带标题的文字图片
- 内容：故事概要
- 格式：Markdown

请确保：
1. 强调故事性和情感共鸣
2. 用真实经历打动读者
3. 内容真实可信

请返回Markdown格式的内容。`,
        variables: ['background', 'outline', 'preferences'],
        successRate: 0.75,
        usageCount: 0,
        tags: ['故事', '情感', '共鸣'],
        category: 'content',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'content-professional',
        name: '专业干货内容模板',
        description: '适用于专业干货内容的内容生成模板',
        template: `你是{background}，专业领域专家。

基于以下大纲生成专业干货内容：

{outline}

用户偏好：
{preferences}

请生成以下内容：

## 公众号文章
要求：
- 字数：500字以内
- 风格：专业、实用
- 开头：用专业洞察引发思考
- 内容：全文
- 格式：Markdown

## 视频号图文
要求：
- 数量：6-7张图片
- 每张：带标题的文字图片
- 内容：干货概要
- 格式：Markdown

请确保：
1. 强调专业性和实用价值
2. 提供可操作的建议
3. 内容真实可信

请返回Markdown格式的内容。`,
        variables: ['background', 'outline', 'preferences'],
        successRate: 0.85,
        usageCount: 0,
        tags: ['专业', '干货', '实用'],
        category: 'content',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-extract-experiences',
        name: '提取关键经历工具模板',
        description: '用于Hook优化工具提取关键经历',
        template: `分析以下背景信息，提取关键经历、成就、挑战：

背景：{background}

请返回JSON数组格式，例如：
["经历1", "经历2", "经历3"]

只返回JSON数组，不要其他内容。`,
        variables: ['background'],
        successRate: 0.85,
        usageCount: 0,
        tags: ['工具', '分析', '背景'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-analyze-resonance',
        name: '分析共鸣点工具模板',
        description: '用于Hook优化工具分析共鸣点',
        template: `分析目标读者和核心观点，确定共鸣点：

目标读者：{targetAudience}
核心观点：{keyMessage}

请返回JSON数组格式，例如：
["共鸣点1", "共鸣点2", "共鸣点3"]

只返回JSON数组，不要其他内容。`,
        variables: ['targetAudience', 'keyMessage'],
        successRate: 0.8,
        usageCount: 0,
        tags: ['工具', '分析', '共鸣'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-generate-hooks',
        name: '生成Hook候选工具模板',
        description: '用于Hook优化工具生成Hook候选',
        template: `基于以下信息生成5个Hook候选：

关键经历：{keyExperiences}
共鸣点：{resonancePoints}
核心观点：{keyMessage}

要求：
1. 每个Hook必须结合具体的关键经历
2. 必须触发至少一个共鸣点
3. 开头3秒吸引读者
4. 真实可信，避免空洞

请返回JSON数组格式：
[
  {
    "hook": "Hook内容",
    "score": 0.8,
    "reasoning": "评分理由"
  }
]

只返回JSON数组，不要其他内容。`,
        variables: ['keyExperiences', 'resonancePoints', 'keyMessage'],
        successRate: 0.75,
        usageCount: 0,
        tags: ['工具', '生成', 'Hook'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-evaluate-hook',
        name: '评估Hook工具模板',
        description: '用于Hook优化工具评估Hook质量',
        template: `评估以下Hook的质量：

Hook：{hook}

评估标准：
1. 吸引力（1-10分）
2. 真实性（1-10分）
3. 共鸣度（1-10分）

请返回JSON格式：
{
  "attractiveness": 8,
  "authenticity": 9,
  "resonance": 7,
  "totalScore": 8.0,
  "reasoning": "评估理由"
}

只返回JSON，不要其他内容。`,
        variables: ['hook'],
        successRate: 0.8,
        usageCount: 0,
        tags: ['工具', '评估', 'Hook'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-analyze-relevance',
        name: '分析热门话题相关性工具模板',
        description: '用于热门话题搜索工具分析相关性',
        template: `分析以下内容与热门话题的相关性：

内容：
{content}

关键词：
{keywords}

热门话题：
{hotTopics}

请分析每个热门话题与内容的相关性，返回JSON格式：
{
  "topics": [
    {
      "topic": "话题名称",
      "relevance": 0.9,
      "popularity": 85,
      "suggestedTags": ["#标签1", "#标签2"],
      "reasoning": "相关性理由"
    }
  ]
}

只返回JSON，不要其他内容。`,
        variables: ['content', 'keywords', 'hotTopics'],
        successRate: 0.85,
        usageCount: 0,
        tags: ['工具', '分析', '热门话题'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-prompt-default',
        name: '默认System Prompt',
        description: '默认的System Prompt模板',
        template: '你是{background}，{expertise}。',
        variables: ['background', 'expertise'],
        successRate: 0.9,
        usageCount: 0,
        tags: ['系统', '默认'],
        category: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'system-prompt-expert',
        name: '专家System Prompt',
        description: '专家角色的System Prompt模板',
        template: '你是{role}，{expertise}。请{instruction}。',
        variables: ['role', 'expertise', 'instruction'],
        successRate: 0.85,
        usageCount: 0,
        tags: ['系统', '专家'],
        category: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-optimize-prompt',
        name: 'Prompt优化工具模板',
        description: '用于优化Prompt模板的工具模板',
        template: `你是一个Prompt优化专家。请分析用户的编辑偏好，并优化Prompt模板。

原始Prompt模板：
{originalTemplate}

原始生成结果：
{originalResult}

用户编辑后：
{editedResult}

用户反馈：
{feedback}

请分析：
1. 用户对哪些部分进行了编辑？
2. 编辑反映了什么偏好？
3. 如何优化Prompt模板，使其更符合用户期望？

请返回优化后的Prompt模板，保持原有的变量格式（{background}, {outline}, {requirements}）。`,
        variables: ['originalTemplate', 'originalResult', 'editedResult', 'feedback'],
        successRate: 0.8,
        usageCount: 0,
        tags: ['工具', '优化', 'Prompt'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-create-template',
        name: '创建模板工具模板',
        description: '用于从成功案例创建新模板的工具模板',
        template: `你是一个Prompt模板设计专家。请根据以下成功案例创建一个新的Prompt模板。

成功案例：
- 大纲：{outline}
- 内容：{content}
- 浏览量：{views}
- 互动量：{engagement}

请创建一个Prompt模板，能够生成类似的高质量内容。

要求：
1. 使用变量格式：{background}, {outline}, {requirements}
2. 强调成功案例中的优点
3. 确保模板可重用
4. 提供清晰的指导

请返回完整的Prompt模板。`,
        variables: ['outline', 'content', 'views', 'engagement'],
        successRate: 0.85,
        usageCount: 0,
        tags: ['工具', '创建', '模板'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tool-analyze-preference',
        name: '分析用户偏好工具模板',
        description: '用于分析用户编辑偏好的工具模板',
        template: `请分析用户的编辑偏好。

原始内容：
{originalContent}

编辑后内容：
{editedContent}

请分析：
1. 语言风格偏好（正式/口语/专业/通俗）
2. 内容结构偏好（简洁/详细/故事化/干货）
3. 表达方式偏好（直接/委婉/数据驱动/情感化）
4. 其他值得注意的偏好

请返回JSON格式的分析结果。`,
        variables: ['originalContent', 'editedContent'],
        successRate: 0.8,
        usageCount: 0,
        tags: ['工具', '分析', '偏好'],
        category: 'tool',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  selectBestTemplate(context: {
    category: PromptTemplate['category'];
    tags?: string[];
    background?: string;
  }): PromptTemplate {
    const candidates = this.getTemplatesByCategory(context.category);
    
    if (candidates.length === 0) {
      throw new Error(`No templates found for category: ${context.category}`);
    }

    // 计算每个模板的得分
    const scoredTemplates = candidates.map(template => {
      let score = template.successRate;
      
      // 如果有标签匹配，增加得分
      if (context.tags) {
        const tagMatches = context.tags.filter(tag => 
          template.tags.some(t => t.includes(tag) || tag.includes(t))
        ).length;
        score += tagMatches * 0.1;
      }
      
      // 如果背景信息匹配，增加得分
      if (context.background && template.tags.some(tag => 
        context.background!.includes(tag)
      )) {
        score += 0.15;
      }
      
      return { template, score };
    });

    // 选择得分最高的模板
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0].template;
  }

  renderTemplate(template: PromptTemplate, variables: Record<string, string>): string {
    let rendered = template.template;
    
    template.variables.forEach(varName => {
      const value = variables[varName] || '';
      const regex = new RegExp(`{${varName}}`, 'g');
      rendered = rendered.replace(regex, value);
    });
    
    return rendered;
  }

  recordFeedback(templateId: string, rating: number, feedback: string): void {
    this.feedbackHistory.push({
      templateId,
      rating,
      feedback,
      timestamp: new Date()
    });

    // 更新模板的成功率
    const template = this.templates.get(templateId);
    if (template) {
      const totalRatings = this.feedbackHistory
        .filter(f => f.templateId === templateId)
        .reduce((sum, f) => sum + f.rating, 0);
      const count = this.feedbackHistory
        .filter(f => f.templateId === templateId).length;
      
      template.successRate = totalRatings / (count * 5); // 假设rating是1-5
      template.usageCount++;
      template.updatedAt = new Date();
    }
  }

  addTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): PromptTemplate {
    const id = `template-${Date.now()}`;
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.templates.set(id, newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<PromptTemplate>): PromptTemplate | undefined {
    const template = this.templates.get(id);
    if (!template) return undefined;
    
    const updated = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };
    
    this.templates.set(id, updated);
    return updated;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  getTemplateStats(): {
    totalTemplates: number;
    averageSuccessRate: number;
    totalUsage: number;
    categoryStats: Record<string, number>;
  } {
    const templates = this.getAllTemplates();
    
    return {
      totalTemplates: templates.length,
      averageSuccessRate: templates.reduce((sum, t) => sum + t.successRate, 0) / templates.length,
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
      categoryStats: templates.reduce((stats, t) => {
        stats[t.category] = (stats[t.category] || 0) + 1;
        return stats;
      }, {} as Record<string, number>)
    };
  }
}
