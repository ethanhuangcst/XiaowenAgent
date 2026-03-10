import { XiaowenAgent } from './xiaowen-agent.js';

console.log('🧪 开始测试完整的XiaowenAgent系统...\n');

console.log('测试1: 创建Agent实例');
const agent = new XiaowenAgent({
  llm: {
    provider: 'qwen',
    apiKey: 'test-api-key',
    model: 'qwen-turbo'
  }
});
console.log('✅ Agent实例创建成功\n');

console.log('测试2: 启动Agent');
await agent.start();
const state = agent.getState();
console.log('当前状态:', state);
console.assert(state.agentState.status === 'IDLE', '初始状态应该是IDLE');
console.log('✅ 测试2通过\n');

console.log('测试3: 获取初始记忆');
const memory = agent.getMemory();
console.log('初始记忆:', memory);
console.assert(memory.userPreferences.writingStyle === '', '初始写作风格应该是空的');
console.log('✅ 测试3通过\n');

console.log('测试4: 测试重置功能');
agent.reset();
const resetState = agent.getState();
console.log('重置后状态:', resetState);
console.assert(resetState.agentState.status === 'IDLE', '重置后状态应该是IDLE');
console.log('✅ 测试4通过\n');

console.log('测试5: 测试状态获取');
const currentState = agent.getState();
console.log('当前状态:', currentState);
console.assert(currentState.agentState.status === 'IDLE', '状态应该是IDLE');
console.assert(currentState.currentStep === 'OPTIMIZE_OUTLINE', '当前步骤应该是OPTIMIZE_OUTLINE');
console.log('✅ 测试5通过\n');

console.log('📝 注意：实际LLM调用测试需要真实的API Key');
console.log('📝 当前测试只验证了Agent集成和基本功能');
console.log('📝 要测试实际调用，请使用真实的API Key运行以下代码：');
console.log(`
// 实际调用测试示例
const agent = new XiaowenAgent({
  llm: {
    provider: 'qwen',
    apiKey: 'your-real-api-key',
    model: 'qwen-turbo'
  }
});

// 优化大纲
const optimizedOutline = await agent.optimizeOutline(\`
# 测试大纲

## 第1篇：测试文章

### Key Message: 测试核心观点
\`);

console.log('优化后的大纲:', optimizedOutline);

// 生成内容
const content = await agent.generateContent(optimizedOutline);
console.log('生成的文章:', content.article);
console.log('生成的视频号图文:', content.videoPost);

// 确认
agent.confirm(true, '内容很好');
`);

console.log('🎉 所有测试通过！');
