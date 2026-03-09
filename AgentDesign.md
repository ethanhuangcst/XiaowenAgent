# XiaowenAgent 智能体工作流设计方案 (AgentDesign)

本方案旨在实现一个 **多模态内容生成与发布智能体**，支持公众号文章和视频号图文的自动生成、编辑、排版与定时发布。

---

## 一、 系统架构概览

系统采用 **“分步执行，人工介入”** (Human-in-the-loop) 的设计理念。整个流程分为四个明确的阶段，每一步都允许用户检查、修改或重新生成，确保最终产出质量可控。

**核心流程：**
1.  **Input (输入)**: 用户意图与基础配置。
2.  **Plan (大纲)**: 生成结构化大纲，确认逻辑骨架。
3.  **Content (正文)**: 生成详细图文内容，进行润色与素材替换。
4.  **Publish (发布)**: 对接平台接口，执行定时任务。

---

## 二、 详细工作流设计

### 第一步：输入文案设计 (Project Setup)

**目标**: 收集所有必要信息，确立生成基调。

**输入字段**:
-   **主题 (Topic)**: 核心关键词或一句话描述 (e.g., "AI 时代的个人成长")。
-   **类型 (Type)**: `Article` (公众号) | `VideoPost` (视频号图文) | `Both` (双平台联动)。
-   **模式 (Mode)**: `Single` (单篇) | `Series` (系列)。
    -   如果是 `Series`，需指定 **篇数 (Count)** (e.g., 3篇, 5篇)。
-   **标签 (Tags)**:
    -   **类型标签**: 用于 SEO 和流量分发 (e.g., #职场 #AI工具)。 *系统可提供“自动生成”选项。*
    -   **调性标签**: 决定文风 (e.g., 严肃学术, 轻松幽默, 情感共鸣, 干货输出)。
-   **大概内容 (Gist)**: 用户可提供简短思路或参考链接。
-   **字数要求 (Length)**: (e.g., 800字, 1500字)。
-   **发布计划 (Schedule)**: 起始日期、时间、频率 (e.g., 每天10:00发布)。
-   **图片来源 (Image Source)**:
    -   `User Provided`: 用户上传。
    -   `AI Generated`: 系统自动生成 (DALL-E 3 / Midjourney)。
    -   `User + AI`: 基于用户上传图片进行重绘/风格化。

**后端处理**:
-   创建一个 `Project` 记录，状态设为 `Draft`。
-   调用 LLM 根据 `Topic` 和 `Tags` 推荐 5-10 个高流量候选标签供用户选择（可选）。

---

### 第二步：生成可编辑的文字大纲 (Outline Generation)

**目标**: 确立文章/图文的骨架，保证逻辑通顺，吸引力强。

**核心逻辑**:
-   **角色设定**: 系统扮演“资深自媒体主编”。
-   **分类型生成**:
    -   **公众号**: 生成 [标题, 摘要, 正文结构(H1/H2), 关键金句]。侧重深度与逻辑。
    -   **视频号**: 生成 [封面标题, 首图文案, 3-5页翻页结构, 互动引导]。侧重视觉冲击与短平快。
    -   **Both**: 确保两者主题一致，公众号作为深度承接，视频号作为流量入口，互相植入导流话术。
-   **系列处理**: 若为系列，先生成总纲，再拆分为 N 个子大纲，确保连贯性。

**交互设计**:
-   **卡片式展示**: 每篇内容一个卡片。
-   **操作**:
    -   `Regenerate`: 对不满意的单篇大纲点击重生成。
    -   `Edit`: 手动修改标题或结构节点。
    -   `Refine`: 选中部分文本，输入指令（如“更夸张一点”），AI 局部润色。

**后端处理**:
-   调用 LLM 生成结构化 JSON (Outline Schema)。
-   保存为 `Post` 记录，状态更新为 `Outline_Ready`。

---

### 第三步：生成可编辑的内容 (Content Generation)

**目标**: 填充血肉，生成最终可发布的内容（文字+图片）。

**核心逻辑**:
-   **文字生成**: 基于确认的大纲，扩写正文。
    -   *公众号*: 自动插入 Markdown 格式 (加粗、引用、列表)。
    -   *视频号*: 生成每一页的图片描述 (Prompt) 和配文。
-   **图片处理**:
    -   若选 `AI Generated`: 根据段落内容自动生成 Prompt，调用绘图模型生成图片。
    -   若选 `User Upload`: 提供上传入口，支持对上传图片进行裁剪/滤镜/AI重绘。
-   **排版预览**: 提供所见即所得 (WYSIWYG) 的预览界面，模拟手机端效果。

**交互设计**:
-   **逐篇精修**:
    -   文字：点击段落直接编辑，或使用 AI 润色 (扩写/缩写/换风格)。
    -   图片：点击图片可 `Replace` (上传/图库) 或 `Regenerate` (修改 Prompt 重绘)。
-   **保存**: 每篇内容独立保存，支持版本回退（可选）。
-   **定时设置**: 默认应用第一步的计划，允许单独修改某篇的发布时间。

**后端处理**:
-   并发生成多篇内容。
-   图片资源异步上传至对象存储 (OSS/S3)，返回 URL。
-   保存最终内容到 `Post`，状态更新为 `Content_Ready`。

---

### 第四步：定时发布 (Scheduled Publishing)

**目标**: 自动化分发，减少人工操作。

**核心逻辑**:
-   **任务调度**: 使用任务队列 (如 BullMQ/Redis) 管理发布任务。
-   **平台对接**:
    -   **微信公众号**:
        1.  上传图片素材 -> 获取 `media_id`。
        2.  上传图文素材 (草稿箱) -> 获取 `media_id`。
        3.  (可选) 群发接口 / 或仅以此状态保存在草稿箱供人工最终确认。 *注：微信接口限制较多，通常建议先存入草稿箱。*
    -   **微信视频号**:
        -   目前官方 API 开放程度较低，可能需要通过 **RPA (Robotic Process Automation)** 技术或第三方服务商接口实现，或者仅生成素材包供用户扫码发布。
        -   *MVP阶段建议*: 生成图文素材包 (Images + Text)，推送到用户手机或提供下载，人工发布；或对接支持视频号的第三方分发平台。

**后端处理**:
-   启动定时器。
-   发布成功后，更新 `Post` 状态为 `Published`。
-   发送通知 (Email/Webhook) 给用户。

---

## 三、 数据结构设计 (简化版)

### Project (项目)
```typescript
interface Project {
  id: string;
  topic: string;
  type: 'Article' | 'VideoPost' | 'Both';
  mode: 'Single' | 'Series';
  seriesCount?: number;
  tone: string;
  tags: string[]; // [自动生成的标签]
  schedulePolicy: {
    startDate: Date;
    frequency: 'Daily' | 'Weekly';
    time: string; // "10:00"
  };
  status: 'Draft' | 'Processing' | 'Completed';
  createdAt: Date;
}
```

### Post (单篇内容)
```typescript
interface Post {
  id: string;
  projectId: string;
  index: number; // 系列中的序号
  platform: 'WeChat_OA' | 'WeChat_Channels';
  
  // 大纲阶段
  outline: {
    title: string;
    structure: string[]; // 章节/页面列表
  };
  
  // 内容阶段
  content: {
    text: string; // Markdown 或 纯文本
    images: {
      url: string;
      prompt?: string; // AI生成提示词
      position: number; // 插入位置
    }[];
  };
  
  publishTime: Date; // 具体的发布时间
  status: 'Pending_Outline' | 'Outline_Confirmed' | 'Content_Ready' | 'Scheduled' | 'Published' | 'Failed';
}
```

---

## 四、 技术栈推荐

-   **Backend**: Node.js (TypeScript) + Express/NestJS
-   **Database**: PostgreSQL + Prisma (处理复杂关系和JSON数据)
-   **Queue**: BullMQ + Redis (处理耗时生成任务和定时发布)
-   **LLM**: OpenAI GPT-4 / Claude 3.5 (兼顾逻辑与创意)
-   **Image Gen**: DALL-E 3 / Midjourney API (需中转)
-   **Frontend**: React + TailwindCSS (构建流畅的交互体验)
