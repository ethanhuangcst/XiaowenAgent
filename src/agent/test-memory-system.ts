import { AgentMemorySystem } from './memory-system.js';

console.log('🧪 开始测试Agent记忆系统...\n');

const memory = new AgentMemorySystem();

console.log('测试1: 初始记忆应该是空的');
const initialMemory = memory.getMemory();
console.log('初始记忆:', initialMemory);
console.assert(initialMemory.userPreferences.writingStyle === '', '写作风格应该是空的');
console.assert(initialMemory.history.length === 0, '历史记录应该是空的');
console.assert(initialMemory.successfulCases.length === 0, '成功案例应该是空的');
console.log('✅ 测试1通过\n');

console.log('测试2: 学习用户偏好');
memory.learn({
  style: '幽默简洁',
  tone: '专业友好',
  tags: ['#SDD', '#AI'],
  wordCount: 500
}, '用户喜欢这种风格');
const preferences = memory.getPreferences();
console.log('用户偏好:', preferences);
console.assert(preferences.writingStyle === '幽默简洁', '写作风格应该是幽默简洁');
console.assert(preferences.preferredTone === '专业友好', '调性应该是专业友好');
console.assert(preferences.commonTags.length === 2, '应该有2个标签');
console.log('✅ 测试2通过\n');

console.log('测试3: 记录历史');
memory.learn({ action: 'generate_outline', result: 'success' });
memory.learn({ action: 'generate_content', result: 'success' });
const history = memory.getHistory();
console.log('历史记录:', history);
console.assert(history.length === 3, '应该有3条历史记录');
console.log('✅ 测试3通过\n');

console.log('测试4: 记录成功案例（view >= 1000）');
memory.learn({
  outline: '测试大纲',
  content: '测试内容',
  views: 1500,
  engagement: 200
});
const cases = memory.getSuccessfulCases();
console.log('成功案例:', cases);
console.assert(cases.length === 1, '应该有1个成功案例');
console.assert(cases[0].views === 1500, '浏览量应该是1500');
console.log('✅ 测试4通过\n');

console.log('测试5: 获取相关记忆');
memory.learn({
  style: '幽默简洁',
  outline: 'SDD相关大纲',
  content: 'SDD相关内容',
  views: 1200
});
const relevantMemory = memory.getRelevantMemory('SDD');
console.log('相关记忆:', relevantMemory);
console.assert(relevantMemory.successfulCases.length > 0, '应该有相关成功案例');
console.log('✅ 测试5通过\n');

console.log('测试6: 测试平均字数计算');
memory.learn({ wordCount: 600 });
memory.learn({ wordCount: 700 });
const updatedPreferences = memory.getPreferences();
console.log('更新后的偏好:', updatedPreferences);
console.assert(updatedPreferences.avgWordCount > 0, '平均字数应该大于0');
console.log('✅ 测试6通过\n');

console.log('测试7: 测试清空功能');
memory.clear();
const clearedMemory = memory.getMemory();
console.log('清空后的记忆:', clearedMemory);
console.assert(clearedMemory.history.length === 0, '历史记录应该被清空');
console.assert(clearedMemory.successfulCases.length === 0, '成功案例应该被清空');
console.log('✅ 测试7通过\n');

console.log('🎉 所有测试通过！');
