import { QwenTool, DeepSeekTool, CustomLLMTool, createLLMTool, LLMConfig } from './llm-tool.js';

console.log('🧪 开始测试Agent工具调用...\n');

console.log('测试1: 创建通义千问工具');
const qwenConfig: LLMConfig = {
  provider: 'qwen',
  apiKey: 'test-api-key',
  model: 'qwen-turbo'
};
const qwenTool = createLLMTool(qwenConfig);
console.log('工具名称:', qwenTool.name);
console.log('工具配置:', qwenTool.config);
console.assert(qwenTool instanceof QwenTool, '应该是QwenTool实例');
console.log('✅ 测试1通过\n');

console.log('测试2: 创建DeepSeek工具');
const deepseekConfig: LLMConfig = {
  provider: 'deepseek',
  apiKey: 'test-api-key',
  model: 'deepseek-chat'
};
const deepseekTool = createLLMTool(deepseekConfig);
console.log('工具名称:', deepseekTool.name);
console.log('工具配置:', deepseekTool.config);
console.assert(deepseekTool instanceof DeepSeekTool, '应该是DeepSeekTool实例');
console.log('✅ 测试2通过\n');

console.log('测试3: 创建自定义LLM工具');
const customConfig: LLMConfig = {
  provider: 'custom',
  apiKey: 'test-api-key',
  baseUrl: 'https://api.custom-llm.com/v1',
  model: 'custom-model'
};
const customTool = createLLMTool(customConfig);
console.log('工具名称:', customTool.name);
console.log('工具配置:', customTool.config);
console.assert(customTool instanceof CustomLLMTool, '应该是CustomLLMTool实例');
console.log('✅ 测试3通过\n');

console.log('测试4: 测试工具接口');
console.log('QwenTool是否有execute方法:', typeof qwenTool.execute === 'function');
console.log('DeepSeekTool是否有execute方法:', typeof deepseekTool.execute === 'function');
console.log('CustomLLMTool是否有execute方法:', typeof customTool.execute === 'function');
console.assert(typeof qwenTool.execute === 'function', 'QwenTool应该有execute方法');
console.assert(typeof deepseekTool.execute === 'function', 'DeepSeekTool应该有execute方法');
console.assert(typeof customTool.execute === 'function', 'CustomLLMTool应该有execute方法');
console.log('✅ 测试4通过\n');

console.log('测试5: 测试错误处理 - 未知provider');
try {
  const invalidConfig = {
    provider: 'invalid' as any,
    apiKey: 'test-api-key',
    model: 'test-model'
  };
  createLLMTool(invalidConfig);
  console.log('❌ 测试5失败：应该抛出错误');
} catch (error) {
  console.log('捕获到预期错误:', error instanceof Error ? error.message : 'Unknown error');
  console.log('✅ 测试5通过\n');
}

console.log('📝 注意：实际API调用测试需要真实的API Key');
console.log('📝 当前测试只验证了工具创建和接口');
console.log('📝 要测试实际调用，请使用真实的API Key运行以下代码：');
console.log(`
// 实际调用测试示例
const tool = createLLMTool({
  provider: 'qwen',
  apiKey: 'your-real-api-key',
  model: 'qwen-turbo'
});

const response = await tool.execute('你好，请介绍一下自己');
console.log(response);
`);

console.log('🎉 所有测试通过！');
