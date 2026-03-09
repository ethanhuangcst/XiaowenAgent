import cors from "cors";
import express from "express";
import { z } from "zod";
import { generateAllContent } from "./contentAgent.js";

const requestSchema = z.object({
  topic: z.string().min(2),
  audience: z.string().min(2),
  goal: z.string().min(2),
  highlights: z.array(z.string()).min(2),
  tone: z.enum(["专业", "故事化", "干货", "情绪价值", "轻松"]).default("干货"),
  wordCount: z.number().int().min(600).max(5000).default(1500),
  callToAction: z.string().min(2)
});

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/generate", async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "请求参数不合法",
        errors: parsed.error.flatten()
      });
      return;
    }

    try {
      const result = await generateAllContent(parsed.data);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      res.status(500).json({
        message: "内容生成失败",
        detail: message
      });
    }
  });

  return app;
}
