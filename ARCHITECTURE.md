# XiaowenAgent 架构设计

## 一、系统定位

**XiaowenAgent** 是一个智能内容创作Agent，采用"Web界面 + Agent后台"的混合模式。

### 核心特性
- **半自主Agent**：关键决策需要用户确认
- **保留Web界面**：用户通过界面与Agent交互
- **国内可用**：支持通义千问、DeepSeek等国内LLM
- **记忆学习**：学习用户偏好和风格

---

## 二、Agent架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     Web Frontend                         │
│  (Vue.js + TailwindCSS)                                 │
│  - 显示Agent状态                                         │
│  - 接收用户确认                                          │
│  - 展示生成结果                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Agent Core                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  State Manager (状态管理器)                      │   │
│  │  - 项目状态                                      │   │
│  │  - Agent决策状态                                 │   │
│  │  - 用户确认队列                                  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Decision Engine (决策引擎)                      │   │
│  │  - 分析当前状态                                  │   │
│  │  - 决定下一步行动                                │   │
│  │  - 判断是否需要用户确认                          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Tool Executor (工具执行器)                      │   │
│  │  - LLM调用                                       │   │
│  │  - 图片生成                                      │   │
│  │  - 数据库操作                                    │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Memory System (记忆系统)                        │   │
│  │  - 用户偏好                                      │   │
│  │  - 历史交互                                      │   │
│  │  - 成功案例                                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Tool Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ LLM Tools    │  │ Image Tools  │  │ DB Tools     │ │
│  │ - 通义千问   │  │ - 通义万相   │  │ - Project    │ │
│  │ - DeepSeek   │  │ - 文心一格   │  │ - Post       │ │
│  │ - Kimi       │  │ - Stable     │  │ - Memory     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Agent状态机

```
┌──────────┐
│  IDLE    │ ← 等待用户输入
└────┬─────┘
     │ 用户输入大纲和Prompt
     ▼
┌──────────┐
│ PLANNING │ → 分析大纲，制定计划
└────┬─────┘
     │ 需要确认？
     ▼
┌──────────┐     否      ┌──────────┐
│CONFIRMING├────────────→│EXECUTING │
└────┬─────┘             └────┬─────┘
     │ 用户确认                │ 执行任务
     ▼                         ▼
┌──────────┐             ┌──────────┐
│ EXECUTING│             │COMPLETING│
└────┬─────┘             └────┬─────┘
     │ 任务完成                │ 保存结果
     ▼                         ▼
┌──────────┐             ┌──────────┐
│COMPLETING│             │   IDLE   │
└────┬─────┘             └──────────┘
     │ 学习用户偏好
     ▼
┌──────────┐
│ LEARNING │ → 更新记忆系统
└────┬─────┘
     │
     ▼
┌──────────┐
│   IDLE   │
└──────────┘
```

---

## 三、核心组件设计

### 3.1 State Manager (状态管理器)

```typescript
interface AgentState {
  status: 'IDLE' | 'PLANNING' | 'CONFIRMING' | 'EXECUTING' | 'COMPLETING' | 'LEARNING';
  currentProject: Project | null;
  currentTask: Task | null;
  pendingConfirmations: Confirmation[];
  executionHistory: ExecutionLog[];
}

interface Task {
  id: string;
  type: 'GENERATE_OUTLINE' | 'GENERATE_CONTENT' | 'GENERATE_IMAGE' | 'PUBLISH';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  params: any;
  result?: any;
}

interface Confirmation {
  id: string;
  type: 'OUTLINE_APPROVAL' | 'CONTENT_APPROVAL' | 'IMAGE_APPROVAL';
  content: any;
  timestamp: Date;
}
```

### 3.2 Decision Engine (决策引擎)

```typescript
class DecisionEngine {
  async decide(state: AgentState): Promise<Action> {
    // 1. 分析当前状态
    const context = this.analyzeState(state);
    
    // 2. 检查是否需要用户确认
    if (this.needsConfirmation(context)) {
      return {
        type: 'REQUEST_CONFIRMATION',
        payload: context.decision
      };
    }
    
    // 3. 决定下一步行动
    return this.planNextAction(context);
  }
  
  private needsConfirmation(context: Context): boolean {
    // 关键决策需要确认：
    // - 大纲生成完成
    // - 内容生成完成
    // - 发布前确认
    return context.isCriticalDecision;
  }
}
```

### 3.3 Tool Executor (工具执行器)

```typescript
class ToolExecutor {
  tools: Map<string, Tool>;
  
  async execute(toolName: string, params: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return tool.execute(params);
  }
}

interface Tool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}
```

### 3.4 Memory System (记忆系统)

```typescript
interface Memory {
  userPreferences: {
    writingStyle: string;
    preferredTone: string;
    commonTags: string[];
    avgWordCount: number;
  };
  successfulOutlines: Outline[];
  successfulContents: Content[];
  userFeedback: Feedback[];
}

class MemorySystem {
  async learn(project: Project, result: any, feedback?: Feedback): Promise<void> {
    // 1. 分析用户反馈
    // 2. 更新偏好模型
    // 3. 保存成功案例
  }
  
  async getRelevantMemory(context: Context): Promise<Memory> {
    // 根据当前上下文检索相关记忆
  }
}
```

---

## 四、工作流程

### 4.1 大纲生成流程

```
1. 用户输入大纲和Prompt
   ↓
2. Agent进入PLANNING状态
   ↓
3. Decision Engine分析：
   - 解析大纲结构
   - 识别缺失字段
   - 制定补全计划
   ↓
4. 判断是否需要确认
   - 是：进入CONFIRMING状态，等待用户确认
   - 否：直接执行
   ↓
5. Tool Executor调用LLM
   - 使用项目Prompt
   - 参考用户偏好
   ↓
6. 保存结果，进入LEARNING状态
   ↓
7. 更新记忆系统
   ↓
8. 返回IDLE状态
```

### 4.2 内容生成流程

```
1. 用户确认大纲
   ↓
2. Agent进入PLANNING状态
   ↓
3. Decision Engine分析：
   - 根据大纲生成内容计划
   - 决定图片需求
   ↓
4. Tool Executor并行执行：
   - 生成文字内容
   - 生成图片（如需要）
   ↓
5. 进入CONFIRMING状态
   - 展示生成结果
   - 等待用户确认或修改
   ↓
6. 用户确认后，进入COMPLETING状态
   ↓
7. 保存最终内容
   ↓
8. 学习用户修改偏好
```

---

## 五、工具集成

### 5.1 LLM工具

**通义千问 (Qwen)**
- API: https://dashscope.aliyuncs.com
- 模型: qwen-plus, qwen-max
- 特点: 国内可用，中文能力强

**DeepSeek**
- API: https://api.deepseek.com
- 模型: deepseek-chat, deepseek-coder
- 特点: 性价比高，代码能力强

**Kimi (月之暗面)**
- API: https://api.moonshot.cn
- 模型: moonshot-v1
- 特点: 长文本处理能力强

### 5.2 图片生成工具

**通义万相**
- API: https://dashscope.aliyuncs.com
- 特点: 国内可用，中文提示词友好

**文心一格**
- API: https://yige.baidu.com
- 特点: 百度出品，中文理解好

**Stable Diffusion (本地部署)**
- 特点: 开源免费，可本地部署

---

## 六、实现计划

### Phase 1: 核心Agent框架 (Week 1)
- [ ] 实现State Manager
- [ ] 实现Decision Engine
- [ ] 实现Tool Executor
- [ ] 集成通义千问

### Phase 2: 工作流实现 (Week 2)
- [ ] 大纲生成Agent
- [ ] 内容生成Agent
- [ ] 用户确认机制

### Phase 3: 记忆系统 (Week 3)
- [ ] 用户偏好学习
- [ ] 成功案例存储
- [ ] 上下文检索

### Phase 4: 图片生成 (Week 4)
- [ ] 集成通义万相
- [ ] 图片提示词优化
- [ ] 图片管理

### Phase 5: 多项目管理 (Week 5)
- [ ] 项目列表
- [ ] 项目切换
- [ ] 批量操作

---

## 七、技术栈

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

### Tools
- LangChain (可选，用于工具管理)
- BullMQ (任务队列，可选)
