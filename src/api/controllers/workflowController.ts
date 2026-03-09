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
    time: z.string(),
    frequency: z.enum(["Daily", "Weekly"]).optional(),
    weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  }).optional(),
  prompt: z.string().optional(),
  outline: z.string().optional(),
  providerId: z.string().optional(),
});

export const createProject = async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  let topic = parsed.data.topic;
  let optimizedOutline = parsed.data.outline;
  let posts: any[] = [];

  // Extract topic from outline if it starts with #
  if (parsed.data.outline) {
    const lines = parsed.data.outline.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ') && !line.includes('第')) {
        topic = line.substring(2).trim();
        break;
      }
    }
  }

  // If outline and prompt provided, optimize outline using LLM
  if (parsed.data.outline && parsed.data.prompt && parsed.data.providerId) {
    try {
      const system = "你是内容策划专家，请直接输出JSON，不要有任何额外说明。";
      
      // Use user's custom prompt but optimize for speed
      let prompt = parsed.data.prompt
        .replace(/\{\{topic\}\}/g, topic)
        .replace(/\{\{tone\}\}/g, parsed.data.tone || '')
        .replace(/\{\{gist\}\}/g, parsed.data.gist || '')
        .replace(/\{\{tags\}\}/g, parsed.data.tags?.join('、') || '')
        .replace(/\{\{count\}\}/g, '1');

      // Add current outline
      prompt += `

当前大纲：
${parsed.data.outline}

请基于以上大纲，补充缺失字段并返回JSON。`;

      const result = await generateJson<{ seriesTitle?: string; topic?: string; posts: Array<any> }>(system, prompt, parsed.data.providerId);
      
      if (result.topic) {
        topic = result.topic;
      }
      
      if (result.posts && result.posts.length > 0) {
        posts = result.posts;
      }
    } catch (error) {
      console.error('Failed to optimize outline:', error);
      // Continue with original outline if optimization fails
    }
  }

  const project = await db.project.create({
    ...parsed.data,
    topic: topic,
    tags: parsed.data.tags || [],
    status: "Draft",
    prompt: parsed.data.prompt,
    outline: optimizedOutline,
  } as any);

  // Create posts from optimized outline
  if (posts.length > 0) {
    for (const postData of posts) {
      await db.post.create({
        projectId: project.id,
        index: postData.index - 1,
        platform: 'WeChat_OA',
        outline: {
          seriesTitle: Array.isArray(postData.seriesTitle) ? postData.seriesTitle[0] : (postData.seriesTitle || project.topic),
          title: postData.title,
          keyMessage: postData.keyMessage || '',
          hook: postData.hook || '',
          tags: postData.tags || [],
          keywords: postData.keywords || [],
          status: postData.status || '草稿'
        },
        status: 'Pending'
      });
    }
  } else if (parsed.data.outline) {
    // Fallback: parse outline manually
    const lines = parsed.data.outline.split('\n');
    let seriesTitle = '';
    let currentPost: any = null;
    
    lines.forEach(line => {
      if (line.startsWith('# ') && !line.includes('第')) {
        seriesTitle = line.substring(2).trim();
      } else if (line.startsWith('## 第') && line.includes('篇：')) {
        if (currentPost) {
          posts.push(currentPost);
        }
        const titleMatch = line.match(/第\d+篇：(.+)/);
        currentPost = {
          projectId: project.id,
          index: posts.length,
          platform: 'WeChat_OA',
          outline: {
            seriesTitle: seriesTitle,
            title: titleMatch ? titleMatch[1].trim() : '',
            keyMessage: '',
            hook: '',
            tags: [],
            keywords: [],
            status: '草稿'
          },
          status: 'Pending'
        };
      } else if (line.startsWith('### Key Message:') && currentPost) {
        currentPost.outline.keyMessage = line.replace('### Key Message:', '').trim();
      } else if (line.startsWith('### 钩子:') && currentPost) {
        currentPost.outline.hook = line.replace('### 钩子:', '').trim();
      } else if (line.startsWith('### 标签:') && currentPost) {
        const tags = line.replace('### 标签:', '').trim().split(/\s+/).filter(t => t);
        currentPost.outline.tags = tags;
      } else if (line.startsWith('### 关键词:') && currentPost) {
        const keywords = line.replace('### 关键词:', '').trim().split(/[、,，]/).filter(k => k);
        currentPost.outline.keywords = keywords;
      } else if (line.startsWith('### 状态:') && currentPost) {
        currentPost.outline.status = line.replace('### 状态:', '').trim();
      }
    });
    
    if (currentPost) {
      posts.push(currentPost);
    }
    
    // Create posts in database
    for (const postData of posts) {
      await db.post.create(postData);
    }
  }

  // Update project with correct series count
  if (posts.length > 0) {
    await db.project.update(project.id, {
      seriesCount: posts.length,
      mode: posts.length > 1 ? 'Series' : 'Single'
    });
  }

  // Fetch created posts
  const createdPosts = await db.post.findByProjectId(project.id);
  
  res.status(201).json({ project: { ...project, seriesCount: posts.length || 1 }, posts: createdPosts });
};

export const getProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectId = Array.isArray(id) ? id[0] : id;
  const project = await db.project.findById(projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
};

export const generateOutline = async (req: Request, res: Response) => {
  const { id } = req.params;
  const projectId = Array.isArray(id) ? id[0] : id;
  const { providerId, existingPosts } = req.body;
  const project = await db.project.findById(projectId);
  
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  try {
    const posts = [];
    const platform = project.type === "Article" ? "WeChat_OA" : "WeChat_Channels";
    
    // If existing posts provided, optimize and fill missing fields
    if (existingPosts && existingPosts.length > 0) {
      // Generate optimized content for all posts
      const prompt = `为选题"${project.topic}"优化以下文章的钩子、标签和关键词。

已有内容：
${existingPosts.map((p: any, idx: number) => {
  const outline = p.outline;
  return `第${idx + 1}篇：${outline.title}
${outline.keyMessage ? `Key Message: ${outline.keyMessage}` : 'Key Message: [缺失]'}
${outline.hook ? `钩子: ${outline.hook}` : '钩子: [缺失]'}
${outline.tags && outline.tags.length > 0 ? `标签: ${outline.tags.join(' ')}` : '标签: [缺失]'}
${outline.keywords && outline.keywords.length > 0 ? `关键词: ${outline.keywords.join('、')}` : '关键词: [缺失]'}`;
}).join('\n\n')}

优化要求：
1. 钩子：开头3秒吸引读者的技巧，必须与内容高度相关
   - 提问式：直击痛点的反问
   - 数据式：惊人的统计数据
   - 故事式：引发好奇的场景
   - 反差式：颠覆认知的对比
2. 标签：2-3个热门标签，与内容直接相关，便于搜索和分类
3. 关键词：3-5个核心关键词，涵盖文章主题，便于SEO

返回JSON：
{
  "posts": [
    {
      "index": 1,
      "title": "标题",
      "keyMessage": "核心观点",
      "hook": "优化后的钩子",
      "tags": ["#标签1", "#标签2"],
      "keywords": ["关键词1", "关键词2", "关键词3"]
    }
  ]
}`;

      const system = "你是内容策划专家，请直接输出JSON。";
      const result = await generateJson<{ posts: Array<any> }>(system, prompt, providerId);
      
      // Merge with existing posts, use optimized content
      const mergedPosts = existingPosts.map((existingPost: any, idx: number) => {
        const newOutline = result.posts.find((p: any) => p.index === idx + 1);
        if (newOutline) {
          return {
            ...existingPost,
            outline: {
              ...existingPost.outline,
              keyMessage: existingPost.outline.keyMessage || newOutline.keyMessage,
              hook: newOutline.hook || existingPost.outline.hook,
              tags: newOutline.tags && newOutline.tags.length > 0 ? newOutline.tags : existingPost.outline.tags,
              keywords: newOutline.keywords && newOutline.keywords.length > 0 ? newOutline.keywords : existingPost.outline.keywords
            }
          };
        }
        return existingPost;
      });
      
      res.json({ project, posts: mergedPosts });
      return;
    }
    
    // Initial generation with batch processing
    const totalPosts = project.seriesCount || 1;
    const batchSize = 5;
    const batches = Math.ceil(totalPosts / batchSize);
    
    const allPosts: any[] = [];
    let seriesTitle = '';
    
    // Use project-level prompt if available
    const projectPrompt = project.prompt || `为选题"{{topic}}"设计大纲。

要求：
1. 系列主题：《主题（系列）》
2. 子标题：《主题（N）- 重点》
3. Key Message：一句话核心观点
4. 状态：草稿/定稿`;
    
    for (let batch = 0; batch < batches; batch++) {
      const startIndex = batch * batchSize + 1;
      const endIndex = Math.min(startIndex + batchSize - 1, totalPosts);
      const postIndices = Array.from({length: endIndex - startIndex + 1}, (_, i) => startIndex + i);
      
      // Replace variables in prompt
      let prompt = projectPrompt
        .replace(/\{\{topic\}\}/g, project.topic)
        .replace(/\{\{tone\}\}/g, project.tone || '')
        .replace(/\{\{gist\}\}/g, project.gist || '')
        .replace(/\{\{tags\}\}/g, project.tags?.join('、') || '')
        .replace(/\{\{count\}\}/g, String(totalPosts));
      
      // Add batch-specific instructions
      prompt += `

请生成第${startIndex}到第${endIndex}篇大纲（共${totalPosts}篇系列）。

返回JSON：
{
  "seriesTitle": "系列主题",
  "posts": [
    {
      "index": ${startIndex},
      "title": "子标题",
      "keyMessage": "一句话核心观点",
      "status": "草稿"
    }
  ]
}`;

      const system = "你是内容策划专家，请直接输出JSON。";
      const result = await generateJson<{ seriesTitle?: string; posts: Array<any> }>(system, prompt, providerId);
      
      if (batch === 0 && result.seriesTitle) {
        seriesTitle = result.seriesTitle;
      }
      
      allPosts.push(...result.posts);
    }
    
    const platforms: Array<'WeChat_OA' | 'WeChat_Channels'> = 
      project.type === 'Both' ? ['WeChat_OA'] : [platform];
    
    for (const plat of platforms) {
      for (const postOutline of allPosts) {
        const post = await db.post.create({
          projectId: projectId,
          index: postOutline.index - 1,
          platform: plat,
          outline: {
            seriesTitle: seriesTitle,
            title: postOutline.title,
            keyMessage: postOutline.keyMessage,
            hook: postOutline.hook,
            tags: postOutline.tags,
            keywords: postOutline.keywords,
            status: '草稿'
          },
          status: "Pending",
        });
        posts.push(post);
      }
    }

    await db.project.update(projectId, { status: "Outline" });
    
    res.json({ project, posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    res.status(500).json({ error: "大纲生成失败", detail: message });
  }
};
