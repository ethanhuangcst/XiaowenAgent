# XiaowenAgent 项目结构设计

为了支持“输入 -> 大纲 -> 内容 -> 发布”的四步工作流，以及多模态（图+文）、多平台（公众号+视频号）的特性，建议采用 **Monorepo** 或 **模块化** 的目录结构。

考虑到当前是单体应用，推荐以下目录结构，兼顾清晰度与扩展性：

```bash
XiaowenAgent/
├── .env                  # 环境变量 (API keys, DB config)
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── AgentDesign.md        # [New] 系统设计文档
├── project_structure.md  # [New] 目录结构说明
│
├── src/
│   ├── app.ts            # 应用入口 (Express App)
│   ├── server.ts         # 服务器启动逻辑
│   ├── config.ts         # 全局配置管理
│   │
│   ├── core/             # 核心业务逻辑 (Domain Layer)
│   │   ├── workflow/     # 工作流引擎 (状态机管理)
│   │   │   ├── types.ts  # 工作流状态定义 (Draft, Outline, Content, Scheduled)
│   │   │   ├── manager.ts# 流程流转控制器
│   │   │   └── state.ts  # 状态存储接口
│   │   │
│   │   ├── content/      # 内容生成模块
│   │   │   ├── generator.ts # 调度 LLM 生成
│   │   │   ├── prompts/     # Prompt 模板库 (分平台/分阶段)
│   │   │   │   ├── outline.ts
│   │   │   │   ├── article.ts
│   │   │   │   └── video.ts
│   │   │   └── parser.ts    # 结构化输出解析
│   │   │
│   │   ├── media/        # 多媒体处理模块
│   │   │   ├── image.ts  # 图片生成/处理/上传
│   │   │   └── storage.ts# 文件存储接口 (Local/S3/OSS)
│   │   │
│   │   └── publish/      # 发布模块 (Adapter Pattern)
│   │   │   ├── wechat-oa.ts    # 公众号 API 适配
│   │   │   ├── wechat-channels.ts # 视频号 API 适配
│   │   │   └── scheduler.ts    # 定时任务调度 (Cron/Queue)
│   │
│   ├── api/              # 接口层 (Controller Layer)
│   │   ├── routes.ts     # 路由定义
│   │   ├── controllers/  # 请求处理函数
│   │   │   ├── workflowController.ts # 处理步骤跳转
│   │   │   ├── contentController.ts  # 处理内容修改/重生成
│   │   │   └── publishController.ts  # 处理发布请求
│   │   └── middlewares/  # 中间件 (Auth, Validation, Error)
│   │
│   ├── db/               # 数据持久层
│   │   ├── schema.ts     # 数据库模型 (User, Project, Post, Task)
│   │   └── client.ts     # 数据库连接 (Prisma/TypeORM)
│   │
│   ├── lib/              # 通用工具库
│   │   ├── llm.ts        # LLM 客户端封装 (OpenAI/DeepSeek等)
│   │   ├── logger.ts     # 日志工具
│   │   └── utils.ts      # 辅助函数
│   │
│   └── types/            # 全局类型定义
│       ├── api.ts        # API 请求/响应类型
│       └── models.ts     # 核心数据模型类型
│
└── tests/                # 测试用例
    ├── unit/
    └── integration/
```

## 核心目录说明

### 1. `src/core/workflow` (工作流引擎)
这是系统的核心大脑。由于你的需求是分步骤的（输入 -> 大纲 -> 内容 -> 发布），需要一个状态机来管理每个 Project 的当前阶段。
- **Draft**: 初始输入阶段。
- **Outline**: 大纲生成与确认阶段。
- **Content**: 正文/图片生成与润色阶段。
- **Scheduled/Published**: 定时与发布阶段。

### 2. `src/core/content` (内容生成)
将 Prompt 工程与 LLM 调用分离。
- `prompts/`: 存放精心调优的 Prompt 模板，支持不同“调性”和“类型”。
- `generator.ts`: 负责组装 Prompt，调用 LLM，并处理重试逻辑。

### 3. `src/core/publish` (发布适配器)
为了应对微信生态的复杂性（公众号和视频号接口差异大），采用适配器模式。
- 如果未来接入小红书/抖音，只需在此处添加新的适配器，不影响核心逻辑。
- `scheduler.ts`: 使用 `node-schedule` 或 `bullmq` (Redis队列) 来管理定时任务。

### 4. `src/api` (RESTful API)
为前端提供清晰的接口。
- `POST /api/project/create`: 第一步，提交基础信息。
- `POST /api/project/:id/outline`: 第二步，生成/重新生成大纲。
- `PUT /api/project/:id/outline/:index`: 修改特定章节大纲。
- `POST /api/project/:id/content`: 第三步，生成全文。
- `PUT /api/project/:id/content/:index`: 修改特定篇章内容/图片。
- `POST /api/project/:id/schedule`: 第四步，设置定时发布。

### 5. `src/db` (持久化)
由于涉及多步骤和“系列”文章，必须有数据库存储中间状态。
- 建议使用 **SQLite** (轻量级) 或 **PostgreSQL** (生产级) 配合 **Prisma** ORM。
- 数据表设计需包含：`Project` (项目), `Post` (单篇内容), `Media` (图片资源)。
