import { Router } from 'express';
import { XiaowenAgent } from '../../agent/xiaowen-agent.js';

const router = Router();

let agentInstance: XiaowenAgent | null = null;

router.post('/start', async (req, res) => {
  try {
    const llmConfig = req.body?.llmConfig;
    
    agentInstance = new XiaowenAgent({
      llm: llmConfig || {
        provider: 'custom',
        apiKey: process.env.OPENAI_API_KEY || 'test-api-key',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      }
    });
    
    await agentInstance.start();
    
    res.json({
      success: true,
      message: 'Agent started',
      state: agentInstance.getState()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/state', (req, res) => {
  if (!agentInstance) {
    res.json({
      success: false,
      error: 'Agent not started'
    });
    return;
  }
  
  res.json({
    success: true,
    state: agentInstance.getState()
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
    state: agentInstance.getState()
  });
});

router.post('/optimize-outline', async (req, res) => {
  if (!agentInstance) {
    res.json({
      success: false,
      error: 'Agent not started'
    });
    return;
  }
  
  try {
    const { background, outline, requirements } = req.body;
    
    if (!outline) {
      res.json({
        success: false,
        error: 'Outline is required'
      });
      return;
    }
    
    const optimizedOutline = await agentInstance.optimizeOutline(outline, requirements, background);
    
    res.json({
      success: true,
      outline: optimizedOutline,
      state: agentInstance.getState()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/learn-from-failure', async (req, res) => {
  if (!agentInstance) {
    res.json({
      success: false,
      error: 'Agent not started'
    });
    return;
  }
  
  try {
    const { templateId, originalResult, editedResult, feedback } = req.body;
    
    if (!templateId || !originalResult || !editedResult || !feedback) {
      res.json({
        success: false,
        error: 'All fields are required: templateId, originalResult, editedResult, feedback'
      });
      return;
    }
    
    await agentInstance.optimizePromptBasedOnFeedback(
      templateId,
      originalResult,
      editedResult,
      feedback
    );
    
    res.json({
      success: true,
      message: 'Agent learned from failure',
      state: agentInstance.getState()
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
      error: 'Agent not started'
    });
    return;
  }
  
  try {
    const { message, context } = req.body;
    
    if (!message) {
      res.json({
        success: false,
        error: 'Message is required'
      });
      return;
    }
    
    const response = await agentInstance.chat(message, context);
    
    res.json({
      success: true,
      response: response,
      state: agentInstance.getState()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
