export interface HookOptimizerInput {
  background: string;
  keyMessage: string;
  targetAudience?: string;
}

export interface HookOptimizerOutput {
  hook: string;
  reasoning: string;
  confidence: number;
  keyExperiences: string[];
  resonancePoints: string[];
}

export interface HookCandidate {
  hook: string;
  score: number;
  reasoning: string;
}

export class HookOptimizerTool {
  name = 'optimize_hook';
  description = '优化Hook，结合背景信息产生共鸣';
  
  private llmTool: any;
  private promptTemplateManager: any;

  constructor(llmTool: any, promptTemplateManager: any) {
    this.llmTool = llmTool;
    this.promptTemplateManager = promptTemplateManager;
  }

  async execute(input: HookOptimizerInput): Promise<HookOptimizerOutput> {
    console.log('🔧 开始优化Hook...');
    
    // 1. 提取关键经历
    const keyExperiences = await this.extractKeyExperiences(input.background);
    console.log('提取的关键经历:', keyExperiences);
    
    // 2. 分析共鸣点
    const resonancePoints = await this.analyzeResonance(
      input.targetAudience || '微信公众号读者',
      input.keyMessage
    );
    console.log('分析的共鸣点:', resonancePoints);
    
    // 3. 生成Hook候选
    const hookCandidates = await this.generateHookCandidates(
      keyExperiences,
      resonancePoints,
      input.keyMessage
    );
    console.log('生成的Hook候选:', hookCandidates.length);
    
    // 4. 评估Hook
    const evaluatedHooks = await this.evaluateHooks(hookCandidates);
    
    // 5. 选择最佳Hook
    const bestHook = this.selectBestHook(evaluatedHooks);
    
    console.log('✅ Hook优化完成');
    
    return {
      hook: bestHook.hook,
      reasoning: bestHook.reasoning,
      confidence: bestHook.score,
      keyExperiences: keyExperiences,
      resonancePoints: resonancePoints
    };
  }

  private async extractKeyExperiences(background: string): Promise<string[]> {
    // 使用动态模板
    const template = this.promptTemplateManager.getTemplate('tool-extract-experiences');
    if (!template) {
      console.error('未找到模板: tool-extract-experiences');
      return [];
    }
    
    const prompt = this.promptTemplateManager.renderTemplate(template, {
      background: background
    });

    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: '背景分析专家',
      expertise: '擅长从背景信息中提取关键经历、成就和挑战',
      instruction: '请分析背景信息并提取关键要素'
    });

    try {
      const response = await this.llmTool.execute(prompt, systemPrompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('提取关键经历失败:', error);
      return [];
    }
  }

  private async analyzeResonance(
    targetAudience: string,
    keyMessage: string
  ): Promise<string[]> {
    // 使用动态模板
    const template = this.promptTemplateManager.getTemplate('tool-analyze-resonance');
    if (!template) {
      console.error('未找到模板: tool-analyze-resonance');
      return [];
    }
    
    const prompt = this.promptTemplateManager.renderTemplate(template, {
      targetAudience: targetAudience,
      keyMessage: keyMessage
    });

    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: '读者心理分析专家',
      expertise: '擅长分析目标读者的心理需求和共鸣点',
      instruction: '请分析读者心理并确定共鸣点'
    });

    try {
      const response = await this.llmTool.execute(prompt, systemPrompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('分析共鸣点失败:', error);
      return [];
    }
  }

  private async generateHookCandidates(
    keyExperiences: string[],
    resonancePoints: string[],
    keyMessage: string
  ): Promise<HookCandidate[]> {
    // 使用动态模板
    const template = this.promptTemplateManager.getTemplate('tool-generate-hooks');
    if (!template) {
      console.error('未找到模板: tool-generate-hooks');
      return [];
    }
    
    const prompt = this.promptTemplateManager.renderTemplate(template, {
      keyExperiences: JSON.stringify(keyExperiences),
      resonancePoints: JSON.stringify(resonancePoints),
      keyMessage: keyMessage
    });

    // 使用动态System Prompt
    const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
    const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
      role: 'Hook创作专家',
      expertise: '擅长创作吸引人的开头，能够在3秒内抓住读者注意力',
      instruction: '请创作多个Hook候选'
    });

    try {
      const response = await this.llmTool.execute(prompt, systemPrompt);
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('生成Hook候选失败:', error);
      return [];
    }
  }

  private async evaluateHooks(hooks: HookCandidate[]): Promise<HookCandidate[]> {
    // 对每个Hook进行更深入的评估
    const evaluatedHooks = await Promise.all(
      hooks.map(async (hook) => {
        // 使用动态模板
        const template = this.promptTemplateManager.getTemplate('tool-evaluate-hook');
        if (!template) {
          console.error('未找到模板: tool-evaluate-hook');
          return hook;
        }
        
        const prompt = this.promptTemplateManager.renderTemplate(template, {
          hook: hook.hook
        });

        // 使用动态System Prompt
        const systemTemplate = this.promptTemplateManager.getTemplate('system-prompt-expert');
        const systemPrompt = this.promptTemplateManager.renderTemplate(systemTemplate, {
          role: 'Hook评估专家',
          expertise: '擅长评估Hook的吸引力、真实性和共鸣度',
          instruction: '请评估Hook的质量'
        });

        try {
          const response = await this.llmTool.execute(prompt, systemPrompt);
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const evaluation = JSON.parse(jsonMatch[0]);
            return {
              ...hook,
              score: evaluation.totalScore,
              reasoning: evaluation.reasoning
            };
          }
          return hook;
        } catch (error) {
          console.error('评估Hook失败:', error);
          return hook;
        }
      })
    );

    return evaluatedHooks;
  }

  private selectBestHook(hooks: HookCandidate[]): HookCandidate {
    if (hooks.length === 0) {
      return {
        hook: '默认Hook',
        score: 0.5,
        reasoning: '没有生成有效的Hook候选'
      };
    }

    return hooks.sort((a, b) => b.score - a.score)[0];
  }
}
