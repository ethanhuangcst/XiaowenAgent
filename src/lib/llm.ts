import OpenAI from "openai";
import { settings } from "../db/settings.js";

export async function generateJson<T>(system: string, user: string, providerId?: string): Promise<T> {
  let provider;
  if (providerId) {
    provider = await settings.getProviderById(providerId);
  }
  if (!provider) {
    provider = await settings.getActiveProvider();
  }

  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    timeout: 300000,
    maxRetries: 2
  });

  const completion = await client.chat.completions.create({
    model: provider.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    response_format: {
      type: "json_object"
    },
    max_tokens: 4000,
    temperature: 0.7
  });

  let output = completion.choices[0].message.content;
  if (!output) {
    throw new Error("模型未返回内容");
  }

  output = output.replace(/```json\n?|\n?```/g, "").trim();

  return JSON.parse(output) as T;
}
