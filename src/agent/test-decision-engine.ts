import { AgentDecisionEngine } from './decision-engine.js';

console.log('🧪 开始测试Agent决策逻辑...\n');

const engine = new AgentDecisionEngine();

console.log('测试1: 初始决策应该是优化大纲');
let decision = engine.decide();
console.log('决策:', decision);
console.assert(decision.step === 'OPTIMIZE_OUTLINE', '初始步骤应该是OPTIMIZE_OUTLINE');
console.log('✅ 测试1通过\n');

console.log('测试2: 继续决策直到需要确认大纲');
decision = engine.decide();
console.log('决策:', decision);
decision = engine.decide();
console.log('决策:', decision);
console.assert(decision.step === 'CONFIRM_OUTLINE', '应该到达CONFIRM_OUTLINE步骤');
console.log('✅ 测试2通过\n');

console.log('测试3: 用户确认大纲后，进入内容生成');
engine.confirm(true);
decision = engine.decide();
console.log('决策:', decision);
console.assert(decision.step === 'GENERATE_CONTENT', '确认后应该进入GENERATE_CONTENT');
console.log('✅ 测试3通过\n');

console.log('测试4: 继续决策直到需要确认内容');
decision = engine.decide();
console.log('决策:', decision);
decision = engine.decide();
console.log('决策:', decision);
console.assert(decision.step === 'CONFIRM_CONTENT', '应该到达CONFIRM_CONTENT步骤');
console.log('✅ 测试4通过\n');

console.log('测试5: 用户确认内容后，进入发布');
engine.confirm(true);
decision = engine.decide();
console.log('决策:', decision);
console.assert(decision.step === 'SCHEDULE_PUBLISH', '确认后应该进入SCHEDULE_PUBLISH');
console.log('✅ 测试5通过\n');

console.log('测试6: 完成发布后，工作流完成');
decision = engine.decide();
console.log('决策:', decision);
decision = engine.decide();
console.log('决策:', decision);
console.assert(decision.step === 'COMPLETE', '应该到达COMPLETE步骤');
console.log('✅ 测试6通过\n');

console.log('测试7: 测试拒绝流程 - 重新优化大纲');
const engine2 = new AgentDecisionEngine();
engine2.decide(); // OPTIMIZE_OUTLINE
engine2.decide(); // PLANNING
engine2.decide(); // CONFIRM_OUTLINE
engine2.confirm(false); // 拒绝
decision = engine2.decide();
console.log('决策:', decision);
console.assert(decision.step === 'OPTIMIZE_OUTLINE', '拒绝后应该回到OPTIMIZE_OUTLINE');
console.log('✅ 测试7通过\n');

console.log('测试8: 测试拒绝流程 - 重新生成内容');
const engine3 = new AgentDecisionEngine();
engine3.decide(); // OPTIMIZE_OUTLINE
engine3.decide(); // PLANNING
engine3.decide(); // CONFIRM_OUTLINE
engine3.confirm(true); // 确认大纲
engine3.decide(); // GENERATE_CONTENT
engine3.decide(); // PLANNING
engine3.decide(); // CONFIRM_CONTENT
engine3.confirm(false); // 拒绝内容
decision = engine3.decide();
console.log('决策:', decision);
console.assert(decision.step === 'GENERATE_CONTENT', '拒绝后应该回到GENERATE_CONTENT');
console.log('✅ 测试8通过\n');

console.log('🎉 所有测试通过！');
