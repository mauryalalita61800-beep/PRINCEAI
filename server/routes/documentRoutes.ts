import { Router, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { DocumentRecord } from '../types';

export const documentRouter = Router();

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx', '.md', '.json', '.csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFilename(name: string): string {
  // Strip path traversal characters (../, ..\, etc.)
  const basename = path.basename(name);
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// POST /api/documents/upload
documentRouter.post('/upload', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename, content, mimeType, size } = req.body;

    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required.' });
    }

    const sanitized = sanitizeFilename(filename);
    const ext = path.extname(sanitized).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      db.logSecurityEvent({
        userId: req.user!.id,
        ip: req.ip || 'unknown',
        eventType: 'PATH_TRAVERSAL_BLOCKED',
        details: `Disallowed extension attempted: ${filename}`,
      });
      return res.status(400).json({
        error: `File type ${ext} is not allowed. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
      });
    }

    const fileSize = size || Buffer.byteLength(content, 'utf8');
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds maximum allowable limit of 10MB.' });
    }

    // Safe text extraction
    let extractedText = content;
    if (typeof content !== 'string') {
      extractedText = String(content);
    }

    // Clean text of non-printable or malicious controls
    extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const docRecord: DocumentRecord = {
      id: 'doc_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      filename: sanitized,
      originalName: filename,
      mimeType: mimeType || 'text/plain',
      size: fileSize,
      extractedText: extractedText.slice(0, 50000), // safe ceiling
      createdAt: new Date().toISOString(),
    };

    db.saveDocument(docRecord);
    db.logAudit({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'DOCUMENT_UPLOADED',
      resource: docRecord.id,
      metadata: { filename: docRecord.filename, size: docRecord.size },
    });

    return res.status(201).json({
      document: {
        id: docRecord.id,
        filename: docRecord.filename,
        size: docRecord.size,
        mimeType: docRecord.mimeType,
        createdAt: docRecord.createdAt,
        preview: docRecord.extractedText.slice(0, 300),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process document upload.' });
  }
});

// GET /api/documents
documentRouter.get('/', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const docs = db.getDocuments(req.user!.id);
  const safeList = docs.map((d) => ({
    id: d.id,
    filename: d.filename,
    size: d.size,
    mimeType: d.mimeType,
    summary: d.summary,
    createdAt: d.createdAt,
    snippet: d.extractedText.slice(0, 150),
  }));
  return res.json({ documents: safeList });
});

// GET /api/documents/:id
documentRouter.get('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const doc = db.getDocument(req.params.id, req.user!.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  return res.json({ document: doc });
});

// POST /api/documents/:id/summarize
documentRouter.post('/:id/summarize', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = db.getDocument(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const prompt = `Please provide a thorough, structured, and clear executive summary of the following document.
Document Name: ${doc.filename}
Content:
"""
${doc.extractedText.slice(0, 15000)}
"""`;

    const summary = await generateGeminiText({
      prompt,
      systemInstruction: 'You are PrinceAI Document Analyzer. Extract core themes, critical points, and action items objectively.',
    });

    doc.summary = summary;
    db.saveDocument(doc);

    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to summarize document.' });
  }
});

// POST /api/documents/:id/ask
documentRouter.post('/:id/ask', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const doc = db.getDocument(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const prompt = `Context from document "${doc.filename}":
"""
${doc.extractedText.slice(0, 18000)}
"""

User Question: ${question.trim()}
Answer the question strictly based on the context above. If information is missing, state clearly that it is not covered.`;

    const answer = await generateGeminiText({
      prompt,
      systemInstruction: 'You are PrinceAI Document Q&A Specialist. Ground answers strictly on provided document text.',
    });

    return res.json({ answer });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to answer question.' });
  }
});

// DELETE /api/documents/:id
documentRouter.delete('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteDocument(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  return res.json({ message: 'Document deleted successfully.' });
});
