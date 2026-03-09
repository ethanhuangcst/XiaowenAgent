export interface LLMProvider {
  id: string;
  name: string;
  type: 'OpenAI' | 'Qwen' | 'DeepSeek' | 'Custom';
  apiKey: string;
  baseURL: string;
  model: string;
  isActive: boolean;
}

export interface WeChatConfig {
  appId: string;
  appSecret: string;
}

export interface SystemSettings {
  llmProviders: LLMProvider[];
  wechat: WeChatConfig;
}
