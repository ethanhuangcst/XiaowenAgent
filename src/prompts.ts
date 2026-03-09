import { GenerateInput } from "./types.js";

export function buildWechatPrompt(input: GenerateInput): string {
  return `
你是资深微信公众号主编，请输出高质量公众号文章。
要求：
1) 选题：${input.topic}
2) 读者：${input.audience}
3) 目标：${input.goal}
4) 核心亮点：${input.highlights.join("；")}
5) 风格：${input.tone}
6) 正文长度：约${input.wordCount}字
7) 行动引导：${input.callToAction}
8) 避免空话，必须给出可执行建议

请返回 JSON，字段必须严格为：
{
  "titleOptions": string[],
  "abstract": string,
  "outline": string[],
  "articleMarkdown": string,
  "coverText": string,
  "tags": string[]
}
`;
}

export function buildVideoPostPrompt(input: GenerateInput): string {
  return `
你是视频号图文运营专家，请输出适配视频号图文分发逻辑的内容。
要求：
1) 主题：${input.topic}
2) 目标读者：${input.audience}
3) 发布目标：${input.goal}
4) 核心信息：${input.highlights.join("；")}
5) 语气：${input.tone}
6) 行动引导：${input.callToAction}
7) 输出内容要更短、更抓人、便于滑动阅读

请返回 JSON，字段必须严格为：
{
  "titleOptions": string[],
  "openingHook": string,
  "imagePlan": string[],
  "postMarkdown": string,
  "tags": string[]
}
`;
}
