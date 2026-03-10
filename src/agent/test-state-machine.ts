import { AgentStateMachine } from './state-machine.js';

console.log('🧪 开始测试Agent状态管理...\n');

const agent = new AgentStateMachine();

console.log('测试1: 初始状态应该是IDLE');
const initialState = agent.getState();
console.log('初始状态:', initialState);
console.assert(initialState.status === 'IDLE', '初始状态应该是IDLE');
console.log('✅ 测试1通过\n');

console.log('测试2: 从IDLE转换到PLANNING');
agent.transition('PLANNING', '优化大纲');
const planningState = agent.getState();
console.log('规划状态:', planningState);
console.assert(planningState.status === 'PLANNING', '状态应该是PLANNING');
console.assert(planningState.currentTask === '优化大纲', '任务应该是"优化大纲"');
console.log('✅ 测试2通过\n');

console.log('测试3: 从PLANNING转换到EXECUTING');
agent.transition('EXECUTING', '调用LLM');
const executingState = agent.getState();
console.log('执行状态:', executingState);
console.assert(executingState.status === 'EXECUTING', '状态应该是EXECUTING');
console.log('✅ 测试3通过\n');

console.log('测试4: 从EXECUTING转换到CONFIRMING');
agent.transition('CONFIRMING', '等待用户确认');
const confirmingState = agent.getState();
console.log('确认状态:', confirmingState);
console.assert(confirmingState.status === 'CONFIRMING', '状态应该是CONFIRMING');
console.log('✅ 测试4通过\n');

console.log('测试5: 从CONFIRMING转换到IDLE');
agent.transition('IDLE');
const idleState = agent.getState();
console.log('空闲状态:', idleState);
console.assert(idleState.status === 'IDLE', '状态应该是IDLE');
console.log('✅ 测试5通过\n');

console.log('测试6: 测试无效转换');
try {
  agent.transition('EXECUTING'); // 从IDLE直接到EXECUTING是无效的
  console.log('❌ 测试6失败：应该抛出错误');
} catch (error) {
  console.log('捕获到预期错误:', error instanceof Error ? error.message : 'Unknown error');
  console.log('✅ 测试6通过\n');
}

console.log('测试7: 测试重置功能');
agent.transition('PLANNING', '测试任务');
agent.reset();
const resetState = agent.getState();
console.log('重置后状态:', resetState);
console.assert(resetState.status === 'IDLE', '重置后状态应该是IDLE');
console.assert(resetState.currentTask === null, '重置后任务应该是null');
console.log('✅ 测试7通过\n');

console.log('🎉 所有测试通过！');
