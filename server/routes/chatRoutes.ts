import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest, assertResourceAccess } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { Conversation, Message } from '../types';

export const chatRouter = Router();

// Phase 1: POST /api/chat
chatRouter.post('/chat', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversationId, systemInstruction } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    if (message.length > 25000) {
      return res.status(400).json({ error: 'Message exceeds maximum allowable length of 25,000 characters.' });
    }

    const userId = req.user!.id;
    let conv: Conversation | undefined;

    if (conversationId) {
      conv = db.getConversation(conversationId, userId);
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found or access denied.' });
      }
    } else {
      // Create new conversation automatically
      const title = message.trim().slice(0, 40) + (message.length > 40 ? '...' : '');
      conv = {
        id: 'conv_' + crypto.randomBytes(6).toString('hex'),
        userId,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      db.createConversation(conv);
    }

    const userMessage: Message = {
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    conv.messages.push(userMessage);

    // Call Gemini API server-side
    const prompt = `You are PrinceAI, an intelligent, helpful, and technically proficient assistant.
User query: ${message.trim()}`;

    const replyText = await generateGeminiText({
      prompt,
      systemInstruction: systemInstruction || 'You are PrinceAI, an enterprise full-stack AI platform assistant.',
    });

    const aiMessage: Message = {
      id: 'msg_' + crypto.randomBytes(6).toString('hex'),
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString(),
    };

    conv.messages.push(aiMessage);
    db.updateConversation(conv.id, userId, { messages: conv.messages });

    return res.json({
      conversationId: conv.id,
      title: conv.title,
      userMessage,
      reply: aiMessage,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message || 'Internal error processing chat.' });
  }
});

// Phase 2: GET /api/conversations
chatRouter.get('/conversations', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const list = db.getConversations(userId);
  return res.json({ conversations: list });
});

// Phase 2: POST /api/conversations
chatRouter.post('/conversations', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title } = req.body;
  const conv: Conversation = {
    id: 'conv_' + crypto.randomBytes(6).toString('hex'),
    userId,
    title: title?.trim() || 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  db.createConversation(conv);
  return res.status(201).json({ conversation: conv });
});

// Phase 2: GET /api/conversations/:id
chatRouter.get('/conversations/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const conv = db.getConversation(req.params.id, userId);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  return res.json({ conversation: conv });
});

// Phase 2: PATCH /api/conversations/:id (Rename)
chatRouter.patch('/conversations/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }
  const updated = db.updateConversation(req.params.id, userId, { title: title.trim() });
  if (!updated) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  return res.json({ conversation: updated });
});

// Phase 2: DELETE /api/conversations/:id
chatRouter.delete('/conversations/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const success = db.deleteConversation(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: 'Conversation not found.' });
  }
  return res.json({ message: 'Conversation deleted.' });
});
