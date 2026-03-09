import { Request, Response } from "express";
import { prompts } from "../../db/prompts.js";

export const getPrompts = async (_req: Request, res: Response) => {
  const promptsData = await prompts.get();
  res.json(promptsData);
};

export const updatePrompts = async (req: Request, res: Response) => {
  try {
    await prompts.save(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to save prompts" });
  }
};
