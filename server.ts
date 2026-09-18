import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/authRoutes';
import { chatRouter } from './server/routes/chatRoutes';
import { documentRouter } from './server/routes/documentRoutes';
import { codingRouter } from './server/routes/codingRoutes';
import { websiteRouter } from './server/routes/websiteRoutes';
import { androidRouter } from './server/routes/androidRoutes';
import { pptRouter } from './server/routes/pptRoutes';
import { imageRouter } from './server/routes/imageRoutes';
import { searchRouter } from './server/routes/searchRoutes';
import { chatbotRouter } from './server/routes/chatbotRoutes';
import { agentRouter } from './server/routes/agentRoutes';
import { workspaceRouter } from './server/routes/workspaceRoutes';
import { multimodalRouter } from './server/routes/multimodalRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { teamRouter } from './server/routes/teamRoutes';
import { knowledgeRouter } from './server/routes/knowledgeRoutes';
import { workflowRouter } from './server/routes/workflowRoutes';
import { systemRouter } from './server/routes/systemRoutes';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Body parsing with safe limit
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Basic API security & CORS headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'PrinceAI', version: '1.0.0', timestamp: new Date().toISOString() });
  });

  // Mount PrinceAI Full-Stack API Routes
  app.use('/api/auth', authRouter);
  app.use('/api', chatRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/coding', codingRouter);
  app.use('/api/website', websiteRouter);
  app.use('/api/android', androidRouter);
  app.use('/api/generate', pptRouter);
  app.use('/api/images', imageRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/chatbots', chatbotRouter);
  app.use('/api/agent', agentRouter);
  app.use('/api/workspace', workspaceRouter);
  app.use('/api/multimodal', multimodalRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/team', teamRouter);
  app.use('/api/knowledge', knowledgeRouter);
  app.use('/api/workflows', workflowRouter);
  app.use('/api/system', systemRouter);

  // Global API error handler
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrinceAI Server running on port ${PORT} (http://0.0.0.0:${PORT})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal: Failed to start PrinceAI server:', err);
  process.exit(1);
});
