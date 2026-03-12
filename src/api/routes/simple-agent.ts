import { Router } from 'express';
import { SimpleAgent } from '../../agent/simple-agent.js';

const router = Router();

let agentInstance: SimpleAgent | null = null;

router.post('/start', async (req, res) => {
  try {
    const llmConfig = req.body?.llmConfig;
    
    agentInstance = new SimpleAgent({
      llm: llmConfig || {
        provider: 'custom',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: process.env.OPENAI_MODEL || 'qwen-plus'
      }
    });
    
    const welcomeMessage = agentInstance.getConversationHistory()[0].content;
    
    res.json({
      success: true,
      message: 'Agent started',
      welcomeMessage: welcomeMessage,
      context: agentInstance.getContext()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/chat', async (req, res) => {
  if (!agentInstance) {
    res.json({
      success: false,
      error: 'Agent not started. Please call /start first.'
    });
    return;
  }
  
  try {
    const { message } = req.body;
    
    if (!message) {
      res.json({
        success: false,
        error: 'Message is required'
      });
      return;
    }
    
    const response = await agentInstance.chat(message);
    
    res.json({
      success: true,
      response: response,
      context: agentInstance.getContext(),
      generatedContents: agentInstance.getGeneratedContents()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/history', (req, res) => {
  if (!agentInstance) {
    res.json({
      success: false,
      error: 'Agent not started'
    });
    return;
  }
  
  res.json({
    success: true,
    history: agentInstance.getConversationHistory(),
    generatedContents: agentInstance.getGeneratedContents(),
    context: agentInstance.getContext()
  });
});

router.post('/reset', (req, res) => {
  if (!agentInstance) {
    res.json({
      success: false,
      error: 'Agent not started'
    });
    return;
  }
  
  agentInstance.reset();
  
  res.json({
    success: true,
    message: 'Agent reset',
    welcomeMessage: agentInstance.getConversationHistory()[0].content
  });
});

export default router;
