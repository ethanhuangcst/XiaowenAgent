import { z } from "zod";
import { generateJson } from "../../lib/llm.js";
import { buildVideoPostPrompt, buildWechatPrompt } from "./prompts/index.js";
import { GenerateInput, GeneratedContent } from "../../types/index.js";

const wechatSchema = z.object({
  titleOptions: z.array(z.string()).min(3).max(8),
  abstract: z.string().min(10),
  outline: z.array(z.string()).min(3),
  articleMarkdown: z.string().min(100),
  coverText: z.string().min(2),
  tags: z.array(z.string()).min(3)
});

const videoSchema = z.object({
  titleOptions: z.array(z.string()).min(3).max(8),
  openingHook: z.string().min(10),
  imagePlan: z.array(z.string()).min(3),
  postMarkdown: z.string().min(60),
  tags: z.array(z.string()).min(3)
});

const systemPrompt =
  "你是一个内容增长智能体，擅长基于业务目标输出可发布、可执行、可转化的内容。输出必须是合法 JSON。";

export async function generateAllContent(input: GenerateInput): Promise<GeneratedContent> {
  const [wechatRaw, videoRaw] = await Promise.all([
    generateJson<unknown>(systemPrompt, buildWechatPrompt(input)),
    generateJson<unknown>(systemPrompt, buildVideoPostPrompt(input))
  ]);

  return {
    wechatArticle: wechatSchema.parse(wechatRaw),
    videoPost: videoSchema.parse(videoRaw)
  };
}
