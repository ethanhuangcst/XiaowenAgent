# XiaowenAgent 智能体工作流

---

## 项目概述

XiaowenAgent 是一个智能内容创作Agent，采用"Web界面 + Agent后台"的混合模式。

### 核心特性
- **半自主Agent**：关键决策需要用户确认
- **保留Web界面**：用户通过界面与Agent交互
- **国内可用**：支持通义千问、DeepSeek等国内LLM
- **记忆学习**：学习用户偏好和风格

---

## 当前实现状态

### ✅ 已完成

#### Web应用部分
- ✅ 第一步界面：大纲输入 + Prompt编辑
- ✅ 第二步界面：文案确认 + 文案概要
- ✅ 后端API：项目创建、大纲生成
- ✅ LLM集成：通义千问、DeepSeek
- ✅ 数据存储：SQLite

#### Agent框架部分
- ✅ Agent核心文件创建
- ✅ 状态管理器（State Manager）
- ✅ 决策引擎（Decision Engine）
- ✅ 工具执行器（Tool Executor）
- ✅ 记忆系统（Memory System）
- ✅ Agent API路由

### ⚠️ 已回退

#### Agent集成（2024-01-09回退）
- ⚠️ 前端调用Agent API → 回退到直接调用workflow API
- ⚠️ 后端使用Agent决策 → 回退到传统工作流

**回退原因**：
1. 前端和后端参数格式不匹配
2. Agent状态轮询逻辑复杂
3. 需要更多调试时间
4. 基本功能优先

**未来计划**：
1. 先确保Web应用基本功能可用
2. 然后逐步集成Agent
3. 简化Agent集成逻辑
4. 完善参数格式匹配

---

## Step 1 - 创建新文案 - 输入大纲

### 界面设计

#### 1. 大纲文本框
- **格式**：Markdown格式
- **默认内容**：显示示例大纲（可编辑）
- **示例**：
```markdown
# 软件开发SDD时代与高龄程序员的职业逆袭（系列）

## 第1篇：《软件开发SDD时代与高龄程序员的职业逆袭（1）- 先说结论》

### Key Message: 软件行业的未来：码农被淘汰，懂软件匠艺+工程实践+产品思维+SDD的资深程序员，使用SDD指挥AI做开发，一个人=一个优秀团队

### 状态: 草稿

---

## 第2篇：《软件开发SDD时代与高龄程序员的职业逆袭（2）- 500小时高强度SDD的心得》

### Key Message: 90%的浪费不是技术造成，而是80年代起就已经知道的问题：缺乏软件匠艺，不遵守工程实践，缺乏产品意识

### 状态: 草稿

---
...
```

#### 2. Prompt文本框
- **格式**：Markdown格式
- **默认内容**：优化后的Prompt模版（可编辑）
- **特性**：
  - 项目级别的Prompt（每个项目独立）
  - 支持变量替换：`{{topic}}`, `{{tone}}`, `{{gist}}`, `{{tags}}`, `{{count}}`
- **示例**：
```markdown
# S - Situation
## 我是 Ethan Huang，国际顶尖敏捷专家
### 精通：Scrum, XP, TDD, ATDD, BDD等敏捷实践
### 研究：SDD (Spec Driven Development)
### 经历：500小时AI辅助开发实践，踩坑无数

## 行业背景
### 软件行业成熟度低，996堆人交付
### 35岁+程序员面临职业危机
### AI崛起带来全新岗位和技能要求

## 目标
### 创作20篇系列文章：《软件开发SDD时代与高龄程序员的职业逆袭》
### 目的：获得阅读、点赞、关注，转化为课程报名

# T - Task
## 为选题"{{topic}}"设计{{count}}篇系列大纲

### 调性：{{tone}}
### 概要：{{gist}}
### 亮点：{{tags}}

## 输出要求
1. 系列主题：《主题（系列）》
2. 子标题：《主题（N）- 重点》
3. Key Message：一句话核心观点，直击痛点
4. 钩子：开头3秒吸引技巧（提问式或反差式）
5. 标签：2-3个热门标签
6. 关键词：3-5个核心关键词

## 成功标准
- 标题：简短、情绪化、吸引眼球
- Key Message：一句话，直击痛点
- 钩子：与内容高度相关，引发好奇，但是必须基于Ethan500小时SDD实践的主线
- 标签：热门、相关、便于搜索

# A - Action Role
## 你是Ethan本人，非常聚焦Ethan想要达成的目标，
## 同时也是：
### 微信视频号文案达人，非常了解视频号爆火文案的逻辑
### 微信公众号文案达人，非常了解微信公众号爆火文案的逻辑
### 你是SDD和AI辅助软件开发的领域专家
### AI编程工具，例如 Claude Code, Trae 的应用专家
### 敏捷，软件工程，软件匠艺，Scrum，TDD，BDD，ATDD等敏捷实践的领域专家
### 你是中文语言达人，特别擅长用幽默、简洁的语言清晰的传递 key messages

# R - Rule
## 输出格式：JSON
## 文案格式：Markdown
## 优先使用：#/##/###分层结构
## 避免：**xyz**格式

# 示例（成功案例）
{
  "seriesTitle": "软件开发SDD时代与高龄程序员的职业逆袭（系列）",
  "posts": [
    {
      "index": 1,
      "title": "《软件开发SDD时代与高龄程序员的职业逆袭（1）- 先说结论》",
      "keyMessage": "软件行业的未来：码农被淘汰，懂软件匠艺+工程实践+产品思维+SDD的资深程序员，使用SDD指挥AI做开发，一个人=一个优秀团队",
      "hook": "你是35岁以上的程序员吗？你担心被优化吗？我今年47岁，我告诉你我们逆袭的时候到了！",
      "tags": ["#SDD", "#程序员中年危机"],
      "keywords": ["AI替代", "职业危机", "35岁"]
    }
  ]
}
```

#### 3. 创建文案按钮
- **Loading状态**：显示"正在生成文案..."和旋转动画
- **禁用状态**：防止多次点击

---

## Step 2 - 文案确认

### 界面设计

#### 1. 文案大纲文本框
- **显示内容**：优化后的文案内容
- **可编辑**：用户可以修改
- **支持复制粘贴**：方便第三方工具编辑

#### 2. 文案概要
- **主题**：从大纲中自动提取
- **类型**：公众号文章/视频号图文/BOTH
- **篇数**：自动计算（1=单篇，>1=系列）
- **发布日期**：可选择
- **发布频率**：周一-周日打钩

#### 3. 操作按钮
- **重新生成**：读取当前文本框内容，重新优化
- **下一步**：进入第三步

---

## Agent架构

### 核心组件

#### 1. State Manager (状态管理器)
- 管理Agent状态：IDLE → PLANNING → CONFIRMING → EXECUTING → COMPLETING → LEARNING
- 跟踪当前项目和任务
- 管理用户确认队列

#### 2. Decision Engine (决策引擎)
- 分析当前状态
- 决定下一步行动
- 判断是否需要用户确认

#### 3. Tool Executor (工具执行器)
- LLM调用工具（通义千问、DeepSeek）
- 图片生成工具（通义万相）
- 数据库操作工具
- 记忆更新工具

#### 4. Memory System (记忆系统)
- 用户偏好学习
- 成功案例存储
- 上下文检索

---

## Agent集成计划

### Phase 1: 前端集成 (Week 1)

#### 1.1 修改前端调用Agent API
```typescript
// 当前实现
createProjectWithOutline() {
  fetch('/api/projects', { method: 'POST' })
}

// Agent集成后
createProjectWithOutline() {
  // 1. 创建项目
  const project = await fetch('/api/projects', { method: 'POST' })
  
  // 2. 启动Agent
  await fetch('/api/agent/start', {
    method: 'POST',
    body: JSON.stringify({
      projectId: project.id,
      task: 'GENERATE_OUTLINE'
    })
  })
  
  // 3. 监听Agent状态
  pollAgentState()
}
```

#### 1.2 实现Agent状态监听
```typescript
const pollAgentState = async () => {
  const interval = setInterval(async () => {
    const state = await fetch('/api/agent/state')
    
    if (state.status === 'CONFIRMING') {
      // 显示确认对话框
      showConfirmation(state.pendingConfirmations[0])
    }
    
    if (state.status === 'IDLE') {
      clearInterval(interval)
      // 更新UI
    }
  }, 1000)
}
```

### Phase 2: 后端集成 (Week 2)

#### 2.1 修改后端使用Agent决策
```typescript
// 当前实现
app.post('/api/projects', createProject)

// Agent集成后
app.post('/api/projects', async (req, res) => {
  const project = await createProject(req, res)
  
  // 启动Agent
  agent.start(project.id, {
    task: 'GENERATE_OUTLINE',
    params: { outline: req.body.outline }
  })
})
```

#### 2.2 实现Agent工具调用
```typescript
agent.registerTool('llm_generate', {
  execute: async (params) => {
    const result = await generateJson(params.system, params.prompt, params.providerId)
    return result
  }
})

agent.registerTool('db_save', {
  execute: async (params) => {
    await db.post.create(params.data)
  }
})
```

### Phase 3: 记忆系统集成 (Week 3)

#### 3.1 实现用户偏好学习
```typescript
agent.on('taskComplete', async (task) => {
  if (task.type === 'GENERATE_OUTLINE') {
    // 学习用户偏好
    await memorySystem.learn({
      projectId: task.projectId,
      result: task.result,
      feedback: task.feedback
    })
  }
})
```

#### 3.2 实现上下文检索
```typescript
agent.registerTool('memory_retrieve', {
  execute: async (params) => {
    const relevantMemory = await memorySystem.getRelevantMemory(params.context)
    return relevantMemory
  }
})
```

### Phase 4: 图片生成集成 (Week 4)

#### 4.1 集成通义万相
```typescript
agent.registerTool('image_generate', {
  execute: async (params) => {
    const imageUrl = await generateImage(params.prompt, params.style)
    return imageUrl
  }
})
```

### Phase 5: 多项目管理 (Week 5)

#### 5.1 实现项目列表
```typescript
agent.registerTask('LIST_PROJECTS', {
  tools: ['db_query'],
  needsConfirmation: false
})
```

---

## 技术栈

### Backend
- Node.js + TypeScript
- Express (API)
- SQLite (数据存储)
- Zod (参数验证)

### Frontend
- Vue.js 3
- TailwindCSS
- Markdown编辑器

### LLM & AI
- 通义千问 (主要)
- DeepSeek (备用)
- 通义万相 (图片)

---

## 工作流程对比

### 当前工作流（Web应用）
```
用户输入大纲 → 点击按钮 → 调用API → 返回结果 → 用户确认
```

### Agent工作流（集成后）
```
用户输入大纲 → Agent分析 → Agent决策 → Agent执行 → Agent学习 → 用户确认
```

---

## 开发方式变化

### 集成前
- 命令式编程
- 固定工作流
- 手动集成
- 单次执行

### 集成后
- 声明式编程
- 智能决策
- 自动集成
- 持续学习

---

## 效率提升预期

- **新功能开发速度**：提升50%
- **维护成本**：降低60%
- **扩展性**：提升80%
- **Bug修复速度**：提升40%

---

## 下一步行动

1. ✅ 更新AgentDesign.md
2. ⏳ 修改前端调用Agent API
3. ⏳ 修改后端使用Agent决策
4. ⏳ 实现Agent工具调用
5. ⏳ 测试Agent集成
