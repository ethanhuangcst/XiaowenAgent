import OpenAI from "openai";
import { env } from "./config.js";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_BASE_URL
});

export async function generateJson<T>(system: string, user: string): Promise<T> {
  const completion = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    text: {
      format: {
        type: "json_object"
      }
    }
  });

  const output = completion.output_text;
  if (!output) {
    throw new Error("模型未返回内容");
  }

  return JSON.parse(output) as T;
}
