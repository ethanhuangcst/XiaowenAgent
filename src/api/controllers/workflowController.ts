import { Request, Response } from "express";
import { z } from "zod";
import { db } from "../../db/client.js";
import { generateJson } from "../../lib/llm.js";
import { buildOutlinePrompt } from "../../core/content/prompts/outline.js";

const createProjectSchema = z.object({
  topic: z.string().min(2),
  type: z.enum(["Article", "VideoPost", "Both"]),
  mode: z.enum(["Single", "Series"]),
  seriesCount: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  tone: z.string(),
  gist: z.string().optional(),
  wordCount: z.number().int().default(1500),
  schedulePolicy: z.object({
    startDate: z.string(),
    frequency: z.string(),
    time: z.string(),
  }).optional(),
});

export const createProject = async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const project = await db.project.create({
    ...parsed.data,
    tags: parsed.data.tags || [],
    status: "Draft",
  } as any);

  res.status(201).json(project);
};

export const getProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const project = await db.project.findById(id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
};

export const generateOutline = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { providerId } = req.body;
  const project = await db.project.findById(id);
  
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  try {
    const platform = project.type === "Article" ? "WeChat_OA" : "WeChat_Channels";
    const prompt = buildOutlinePrompt(project as any, platform);
    const system = "你是一个专业的内容策划专家。请直接输出 JSON。";

    // Call real LLM with selected provider
    const outline = await generateJson<{ title: string; structure: string[] }>(system, prompt, providerId);

    // Update project status
    await db.project.update(id, { status: "Outline" });
    
    // Save outline to posts (MVP: Single post)
    const post = await db.post.create({
      projectId: id,
      index: 0,
      platform,
      outline,
      status: "Pending",
    });

    res.json({ project, posts: [post] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    res.status(500).json({ error: "大纲生成失败", detail: message });
  }
};
