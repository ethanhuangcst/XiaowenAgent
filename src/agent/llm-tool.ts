export interface LLMConfig {
  provider: 'qwen' | 'deepseek' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMTool {
  name: string;
  config: LLMConfig;
  
  execute(prompt: string, system?: string): Promise<LLMResponse>;
}

export class QwenTool implements LLMTool {
  name = 'qwen';
  config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async execute(prompt: string, system?: string): Promise<LLMResponse> {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'qwen-turbo',
        input: {
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt }
          ]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.output.text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }
}

export class DeepSeekTool implements LLMTool {
  name = 'deepseek';
  config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async execute(prompt: string, system?: string): Promise<LLMResponse> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'deepseek-chat',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };
  }
}

export class CustomLLMTool implements LLMTool {
  name = 'custom';
  config: LLMConfig;

  constructor(config: LLMConfig) {
    if (!config.baseUrl) {
      throw new Error('Custom LLM requires baseUrl');
    }
    this.config = config;
  }

  async execute(prompt: string, system?: string): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl?.endsWith('/v1') 
      ? this.config.baseUrl 
      : `${this.config.baseUrl}/v1`;
    
    // 设置超时时间为120秒
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Custom LLM API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试。如果问题持续，请检查网络连接或联系API提供商。');
      }
      
      throw error;
    }
  }
}

export function createLLMTool(config: LLMConfig): LLMTool {
  switch (config.provider) {
    case 'qwen':
      return new QwenTool(config);
    case 'deepseek':
      return new DeepSeekTool(config);
    case 'custom':
      return new CustomLLMTool(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
