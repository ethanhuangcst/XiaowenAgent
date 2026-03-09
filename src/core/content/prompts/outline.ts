import { Project } from "../../../types/models.js";

export function buildOutlinePrompt(project: Project, platform: 'WeChat_OA' | 'WeChat_Channels'): string {
  const isWechat = platform === 'WeChat_OA';
  const typeName = isWechat ? "微信公众号文章" : "视频号图文";
  
  return `
你是资深${typeName}主编，请为以下选题设计内容大纲。

【项目信息】
- 选题：${project.topic}
- 调性：${project.tone}
- 概要/意图：${project.gist || "无"}
- 字数预期：${project.wordCount}字
- 目标受众：通用
- 核心亮点：${project.tags?.join("、") || "无"}

【输出要求】
${isWechat ? 
  `请设计一篇深度公众号文章的大纲，结构清晰，逻辑严密。` : 
  `请设计一篇适合滑动阅读的视频号图文大纲，每页一个核心点。`}

请返回 JSON 格式，严格包含以下字段：
{
  "title": "拟定标题",
  "structure": ["第一部分：...", "第二部分：...", ...]
}
`;
}
