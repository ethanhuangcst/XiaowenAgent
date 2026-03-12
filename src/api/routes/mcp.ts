import { Router } from 'express';

const router = Router();

router.post('/hotnews', async (req, res) => {
  try {
    const { sources } = req.body;
    
    const apis = [
      {
        name: 'v2ex',
        url: 'https://www.v2ex.com/api/topics/hot.json',
        transform: (data: any) => data.map((item: any) => ({
          title: item.title,
          url: item.url,
          platform: 'v2ex'
        }))
      },
      {
        name: 'zhihu',
        url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total',
        transform: (data: any) => data.data?.map((item: any) => ({
          title: item.target?.title,
          url: item.target?.url,
          platform: 'zhihu'
        })) || []
      }
    ];
    
    let hotNews: any[] = [];
    
    for (const api of apis) {
      try {
        console.log(`尝试获取 ${api.name} 热榜...`);
        const response = await fetch(api.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const transformed = api.transform(data);
          hotNews = hotNews.concat(transformed);
          console.log(`✅ ${api.name} 热榜获取成功: ${transformed.length} 条`);
        }
      } catch (error) {
        console.log(`⚠️ ${api.name} 热榜获取失败:`, error);
      }
    }
    
    if (hotNews.length === 0) {
      hotNews = [
        { title: 'AI技术最新进展', platform: 'demo' },
        { title: '程序员职业发展讨论', platform: 'demo' },
        { title: '软件开发最佳实践', platform: 'demo' },
        { title: '远程工作效率提升', platform: 'demo' },
        { title: '新技术学习路径', platform: 'demo' }
      ];
    }
    
    res.json({
      success: true,
      data: hotNews.slice(0, 20),
      source: hotNews[0]?.platform || 'demo'
    });
  } catch (error) {
    console.error('获取热门话题失败:', error);
    res.json({
      success: true,
      data: [
        { title: 'AI技术最新进展', platform: 'fallback' },
        { title: '程序员职业发展讨论', platform: 'fallback' },
        { title: '软件开发最佳实践', platform: 'fallback' }
      ],
      message: '使用备用数据'
    });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      res.json({
        success: false,
        error: 'Query is required'
      });
      return;
    }
    
    console.log(`搜索关键词: ${query}`);
    
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      res.json({
        success: true,
        query: query,
        results: {
          abstract: data.Abstract || '',
          abstractText: data.AbstractText || '',
          abstractSource: data.AbstractSource || '',
          abstractURL: data.AbstractURL || '',
          image: data.Image || '',
          relatedTopics: (data.RelatedTopics || []).slice(0, 5).map((topic: any) => ({
            text: topic.Text || '',
            url: topic.FirstURL || ''
          }))
        }
      });
    } catch (searchError) {
      console.log('DuckDuckGo搜索失败，使用备用方案');
      
      res.json({
        success: true,
        query: query,
        results: {
          abstract: `关于"${query}"的搜索结果`,
          abstractText: `这是关于"${query}"的相关信息`,
          abstractSource: 'fallback',
          abstractURL: '',
          image: '',
          relatedTopics: [
            { text: `${query}的最新发展趋势`, url: '' },
            { text: `${query}相关技术讨论`, url: '' },
            { text: `${query}学习资源推荐`, url: '' }
          ]
        },
        message: '使用备用搜索结果'
      });
    }
  } catch (error) {
    console.error('搜索失败:', error);
    res.json({
      success: true,
      query: req.body.query,
      results: {
        abstract: '搜索服务暂时不可用',
        relatedTopics: []
      },
      message: '搜索服务暂时不可用'
    });
  }
});

router.post('/visit', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      res.json({
        success: false,
        error: 'URL is required'
      });
      return;
    }
    
    console.log(`访问网页: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Fetch error: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title';
    
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
    
    res.json({
      success: true,
      url: url,
      title: title,
      content: textContent
    });
  } catch (error) {
    console.error('访问网页失败:', error);
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/optimize', async (req, res) => {
  try {
    const { content, optimization_type, target_platform } = req.body;
    
    if (!content || !optimization_type) {
      res.json({
        success: false,
        error: 'Content and optimization_type are required'
      });
      return;
    }
    
    console.log(`优化文案: ${optimization_type}`);
    
    const optimizationPrompts: Record<string, string> = {
      hook: '优化开头，制造悬念或冲突，吸引读者继续阅读',
      title: '优化标题，使其更具吸引力和点击欲望',
      readability: '优化可读性，拆分长句，添加段落分隔',
      engagement: '优化互动性，添加提问、引导评论的元素'
    };
    
    const platformGuides: Record<string, string> = {
      wechat: '微信公众号：适合深度阅读，可使用较长段落',
      bilibili: 'B站：年轻用户为主，语言可以更活泼',
      douyin: '抖音：快节奏，前3秒必须抓住注意力'
    };
    
    const prompt = `请优化以下文案：

原始内容：
${content}

优化目标：${optimizationPrompts[optimization_type] || optimization_type}
${target_platform ? `平台特点：${platformGuides[target_platform] || ''}` : ''}

请直接返回优化后的内容，不要解释。`;

    const llmResponse = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`LLM API error: ${llmResponse.statusText} - ${errorText}`);
    }
    
    const llmData = await llmResponse.json();
    const optimizedContent = llmData.choices[0].message.content;
    
    res.json({
      success: true,
      original_content: content,
      optimized_content: optimizedContent,
      optimization_type: optimization_type,
      target_platform: target_platform
    });
  } catch (error) {
    console.error('文案优化失败:', error);
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: '优化服务暂时不可用，请稍后重试'
    });
  }
});

router.post('/hooks', async (req, res) => {
  try {
    const { topic, style, count } = req.body;
    
    if (!topic) {
      res.json({
        success: false,
        error: 'Topic is required'
      });
      return;
    }
    
    console.log(`生成钩子: ${topic}`);
    
    const styleGuides: Record<string, string> = {
      question: '用提问开头，引发读者思考',
      story: '用小故事开头，建立情感连接',
      data: '用数据开头，增加可信度',
      conflict: '用冲突或矛盾开头，制造悬念'
    };
    
    const prompt = `请为以下主题生成 ${count || 3} 个吸引眼球的开头钩子：

主题：${topic}
风格：${styleGuides[style || 'question'] || '多样化'}

要求：
1. 每个钩子不超过50字
2. 简洁有力，直击痛点
3. 引发读者好奇或共鸣

请直接返回钩子列表，每行一个，不要编号。`;

    const llmResponse = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`LLM API error: ${llmResponse.statusText} - ${errorText}`);
    }
    
    const llmData = await llmResponse.json();
    const hooksText = llmData.choices[0].message.content;
    const hooks = hooksText.split('\n').filter((h: string) => h.trim());
    
    res.json({
      success: true,
      topic: topic,
      style: style,
      hooks: hooks
    });
  } catch (error) {
    console.error('生成钩子失败:', error);
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: ['生成钩子服务暂时不可用，请稍后重试']
    });
  }
});

export default router;
