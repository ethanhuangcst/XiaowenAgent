import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_FILE = path.join(__dirname, "../../prompts.json");

const defaultPrompts = {
  outline: `为选题"{{topic}}"设计{{count}}篇系列大纲。

调性：{{tone}}
概要：{{gist}}
亮点：{{tags}}

要求：
1. 系列主题：《主题（系列）》
2. 子标题：《主题（N）- 重点》
3. Key Message：一句话核心观点，直击读者痛点或引发共鸣
4. 钩子：开头3秒吸引读者的技巧，必须与内容高度相关
   - 提问式：直击痛点的反问
   - 数据式：惊人的统计数据
   - 故事式：引发好奇的场景
   - 反差式：颠覆认知的对比
5. 标签：2-3个热门标签，与内容直接相关，便于搜索和分类
6. 关键词：3-5个核心关键词，涵盖文章主题，便于SEO

返回JSON：
{
  "seriesTitle": "系列主题",
  "posts": [
    {
      "index": 1,
      "title": "子标题",
      "keyMessage": "一句话核心观点",
      "hook": "开头吸引技巧",
      "tags": ["#标签1", "#标签2"],
      "keywords": ["关键词1", "关键词2", "关键词3"]
    }
  ]
}`
};

export const prompts = {
  get: async (): Promise<typeof defaultPrompts> => {
    try {
      const data = await fs.readFile(PROMPTS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      await prompts.save(defaultPrompts);
      return defaultPrompts;
    }
  },
  
  save: async (promptsData: typeof defaultPrompts): Promise<void> => {
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(promptsData, null, 2));
  }
};
