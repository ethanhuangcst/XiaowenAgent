import { env } from "../config/index.js";
import { SystemSettings, LLMProvider } from "../types/settings.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, "../../../settings.json");

// Default settings from .env
const defaultSettings: SystemSettings = {
  llmProviders: [
    {
      id: "default-openai",
      name: "Default OpenAI",
      type: "OpenAI",
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      model: env.OPENAI_MODEL,
      isActive: true,
    },
  ],
  wechat: {
    appId: "",
    appSecret: "",
  },
};

let cachedSettings: SystemSettings | null = null;

export const settings = {
  get: async (): Promise<SystemSettings> => {
    if (cachedSettings) return cachedSettings;

    try {
      const data = await fs.readFile(CONFIG_FILE, "utf-8");
      cachedSettings = JSON.parse(data);
      return cachedSettings!;
    } catch (error) {
      // If file not exists, use defaults and save
      cachedSettings = defaultSettings;
      await settings.save(defaultSettings);
      return defaultSettings;
    }
  },

  save: async (newSettings: SystemSettings): Promise<void> => {
    cachedSettings = newSettings;
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newSettings, null, 2), "utf-8");
  },
  
  getActiveProvider: async (): Promise<LLMProvider> => {
    const s = await settings.get();
    const active = s.llmProviders.find(p => p.isActive);
    return active || s.llmProviders[0];
  },

  getProviderById: async (id: string): Promise<LLMProvider | undefined> => {
    const s = await settings.get();
    return s.llmProviders.find(p => p.id === id);
  }
};
