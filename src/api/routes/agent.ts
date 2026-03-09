import { Router } from 'express';
import { AgentCore } from '../../agent/core.js';

const router = Router();
const agent = new AgentCore();

agent.on('stateChange', (state) => {
  console.log('Agent state changed:', state.status);
});

agent.on('confirmationRequired', (confirmation) => {
  console.log('Confirmation required:', confirmation.type);
});

agent.on('taskStart', (task) => {
  console.log('Task started:', task.type);
});

agent.on('taskComplete', (task) => {
  console.log('Task completed:', task.type);
});

agent.on('error', (error) => {
  console.error('Agent error:', error);
});

router.post('/start', async (req, res) => {
  try {
    const { projectId, task, params } = req.body;
    await agent.start(projectId, { task, params });
    res.json({ success: true, message: 'Agent started' });
  } catch (error) {
    console.error('Agent start error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { confirmationId, approved, modifications } = req.body;
    await agent.confirm(confirmationId, approved, modifications);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/state', (req, res) => {
  res.json(agent.getState());
});

export default router;
