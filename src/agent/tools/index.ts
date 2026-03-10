import { HookOptimizerTool, HookOptimizerInput, HookOptimizerOutput } from './hook-optimizer.js';
import { HotTopicSearchTool, HotTopicSearchInput, HotTopicSearchOutput } from './hot-topic-search.js';

export type ToolName = 'optimize_hook' | 'search_hot_topics';

export interface ToolInput {
  optimize_hook: HookOptimizerInput;
  search_hot_topics: HotTopicSearchInput;
}

export interface ToolOutput {
  optimize_hook: HookOptimizerOutput;
  search_hot_topics: HotTopicSearchOutput;
}

export class ToolManager {
  private tools: Map<string, any> = new Map();
  private llmTool: any;
  private promptTemplateManager: any;

  constructor(llmTool: any, promptTemplateManager: any) {
    this.llmTool = llmTool;
    this.promptTemplateManager = promptTemplateManager;
    this.initializeTools();
  }

  private initializeTools(): void {
    this.tools.set('optimize_hook', new HookOptimizerTool(this.llmTool, this.promptTemplateManager));
    this.tools.set('search_hot_topics', new HotTopicSearchTool(this.llmTool, this.promptTemplateManager));
  }

  async callTool<T extends ToolName>(
    toolName: T,
    input: ToolInput[T]
  ): Promise<ToolOutput[T]> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    console.log(`📞 调用工具: ${toolName}`);
    const startTime = Date.now();
    
    try {
      const result = await tool.execute(input);
      const duration = Date.now() - startTime;
      console.log(`✅ 工具调用成功: ${toolName} (${duration}ms)`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ 工具调用失败: ${toolName} (${duration}ms)`, error);
      throw error;
    }
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolDescription(toolName: string): string | undefined {
    const tool = this.tools.get(toolName);
    return tool?.description;
  }
}
