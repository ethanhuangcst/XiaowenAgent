import { Request, Response } from "express";
import { settings } from "../../db/settings.js";

export const getSettings = async (req: Request, res: Response) => {
  const s = await settings.get();
  // Mask API keys for security, but allow frontend to know if it's set
  const safeSettings = {
    ...s,
    llmProviders: s.llmProviders.map(p => ({
      ...p,
      apiKey: p.apiKey ? "********" : ""
    }))
  };
  res.json(safeSettings);
};

export const updateSettings = async (req: Request, res: Response) => {
  const newSettings = req.body;
  
  const current = await settings.get();
  
  // If user sends "********", keep the old key. If empty, clear it. If new value, update it.
  const mergedProviders = newSettings.llmProviders.map((p: any) => {
    if (p.apiKey === "********") {
      const old = current.llmProviders.find(op => op.id === p.id);
      return { ...p, apiKey: old?.apiKey || "" };
    }
    return p;
  });

  const merged = {
    ...newSettings,
    llmProviders: mergedProviders
  };

  await settings.save(merged);
  res.json({ success: true });
};
