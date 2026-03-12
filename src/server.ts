import cors from "cors";
import express from "express";
import { z } from "zod";
import { getSettings, updateSettings } from "./api/controllers/settingsController.js";
import { getPrompts, updatePrompts } from "./api/controllers/promptsController.js";
import agentTestRoutes from "./api/routes/agent-test.js";
import simpleAgentRoutes from "./api/routes/simple-agent.js";
import mcpRoutes from "./api/routes/mcp.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // Serve static frontend
  app.use(express.static(path.join(__dirname, "../public")));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Settings routes
  app.get("/api/settings", getSettings);
  app.post("/api/settings", updateSettings);

  // Prompts routes
  app.get("/api/prompts", getPrompts);
  app.post("/api/prompts", updatePrompts);

  // Agent routes
  app.use("/api/agent-test", agentTestRoutes);
  app.use("/api/simple-agent", simpleAgentRoutes);
  app.use("/api/mcp", mcpRoutes);

  return app;
}
