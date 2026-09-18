import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { KnowledgeBase, KnowledgeChunk } from '../types';

export const knowledgeRouter = Router();

// GET /api/knowledge
knowledgeRouter.get('/', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const list = db.getKnowledgeBases(req.user!.id);
  return res.json({ knowledgeBases: list });
});

// POST /api/knowledge
knowledgeRouter.post('/', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, type = 'PERSONAL', tags = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Knowledge base name is required.' });
    }

    const kb: KnowledgeBase = {
      id: 'kb_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      name: name.trim(),
      description: description?.trim() || '',
      type,
      status: 'READY',
      tags: Array.isArray(tags) ? tags : [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveKnowledgeBase(kb);
    return res.status(201).json({ knowledgeBase: kb });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create knowledge base.' });
  }
});

// GET /api/knowledge/:id
knowledgeRouter.get('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const kb = db.getKnowledgeBase(req.params.id, req.user!.id);
  if (!kb) {
    return res.status(404).json({ error: 'Knowledge base not found.' });
  }
  return res.json({ knowledgeBase: kb });
});

// POST /api/knowledge/:id/upload (Ingestion Pipeline: Upload -> Extract -> Clean -> Chunk -> Index)
knowledgeRouter.post('/:id/upload', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const kb = db.getKnowledgeBase(req.params.id, req.user!.id);
    if (!kb) {
      return res.status(404).json({ error: 'Knowledge base not found.' });
    }

    const { filename, content } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required.' });
    }

    const docId = 'kdoc_' + crypto.randomBytes(6).toString('hex');
    const cleanText = String(content).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Chunking algorithm: 500 characters per chunk with 50 char overlap
    const chunkSize = 500;
    const overlap = 50;
    const chunks: KnowledgeChunk[] = [];
    let start = 0;
    let chunkIndex = 1;

    while (start < cleanText.length) {
      const end = Math.min(start + chunkSize, cleanText.length);
      const chunkStr = cleanText.substring(start, end).trim();

      if (chunkStr.length > 20) {
        chunks.push({
          id: 'chk_' + crypto.randomBytes(6).toString('hex'),
          documentId: docId,
          chunkIndex,
          text: chunkStr,
          metadata: {
            filename,
            pageOrSection: chunkIndex,
          },
        });
        chunkIndex++;
      }

      if (end >= cleanText.length) break;
      start += chunkSize - overlap;
    }

    db.saveKnowledgeChunks(chunks);

    kb.documents.push({
      id: docId,
      filename,
      size: Buffer.byteLength(content, 'utf8'),
      chunkCount: chunks.length,
      uploadedAt: new Date().toISOString(),
    });
    kb.status = 'READY';
    kb.updatedAt = new Date().toISOString();
    db.saveKnowledgeBase(kb);

    return res.status(201).json({
      message: `Document ingested successfully into ${chunks.length} indexed chunks.`,
      documentId: docId,
      chunkCount: chunks.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to ingest knowledge document.' });
  }
});

// POST /api/knowledge/:id/search (Semantic & Keyword Chunk Search)
knowledgeRouter.post('/:id/search', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const kb = db.getKnowledgeBase(req.params.id, req.user!.id);
  if (!kb) {
    return res.status(404).json({ error: 'Knowledge base not found.' });
  }

  const docIds = kb.documents.map((d) => d.id);
  const matchedChunks = db.searchKnowledgeChunks(query, docIds);

  return res.json({
    query,
    chunks: matchedChunks,
    count: matchedChunks.length,
  });
});

// POST /api/knowledge/:id/chat (RAG Chat with strict citation rules)
knowledgeRouter.post('/:id/chat', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const kb = db.getKnowledgeBase(req.params.id, req.user!.id);
    if (!kb) {
      return res.status(404).json({ error: 'Knowledge base not found.' });
    }

    const docIds = kb.documents.map((d) => d.id);
    const chunks = db.searchKnowledgeChunks(question, docIds);

    if (chunks.length === 0) {
      return res.json({
        answer: 'Insufficient information in the selected knowledge base.',
        citations: [],
      });
    }

    const contextText = chunks
      .map((c, i) => `[Citation ${i + 1}] Source: ${c.metadata.filename} (Section ${c.metadata.pageOrSection}):\n"${c.text}"`)
      .join('\n\n');

    const ragPrompt = `You are PrinceAI RAG Knowledge Engine.
User Question: "${question.trim()}"

Retrieved Context Chunks:
"""
${contextText}
"""

Instructions:
1. Answer the question using ONLY the facts present in the retrieved chunks.
2. If the answer is not explicitly mentioned in the context, output exactly: "Insufficient information in the selected knowledge base."
3. Every factual sentence must be attributed using [Citation 1], [Citation 2], etc.
4. Do NOT fabricate information or citations.`;

    const answer = await generateGeminiText({
      prompt: ragPrompt,
      systemInstruction: 'You are PrinceAI RAG Engine. Strictly adhere to verified source citations.',
    });

    const citations = chunks.map((c, i) => ({
      citationNumber: i + 1,
      source: c.metadata.filename,
      section: c.metadata.pageOrSection,
      snippet: c.text.slice(0, 120),
    }));

    return res.json({ answer, citations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'RAG chat failed.' });
  }
});

// DELETE /api/knowledge/:id
knowledgeRouter.delete('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteKnowledgeBase(req.params.id, req.user!.id);
  if (!ok) {
    return res.status(404).json({ error: 'Knowledge base not found.' });
  }
  return res.json({ message: 'Knowledge base deleted successfully.' });
});
