import OpenAI from "openai";
import { env } from "../config/index.js";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL
});

export async function generateJson<T>(system: string, user: string): Promise<T> {
  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    response_format: {
      type: "json_object"
    }
  });

  let output = completion.choices[0].message.content;
  if (!output) {
    throw new Error("模型未返回内容");
  }

  // Remove markdown code blocks if present
  output = output.replace(/```json\n?|\n?```/g, "").trim();

  return JSON.parse(output) as T;
}
