import { Router, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import JSZip from 'jszip';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { WorkspaceProject, ProjectFile } from '../types';

export const workspaceRouter = Router();

function sanitizePath(filePath: string): string {
  const normalized = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  return normalized.replace(/^[\\\/]+/, '');
}

// GET /api/workspace/projects
workspaceRouter.get('/projects', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getWorkspaceProjects(req.user!.id);
  return res.json({ projects });
});

// POST /api/workspace/projects
workspaceRouter.post('/projects', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, type = 'website', description } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    const initialFiles: ProjectFile[] = [
      {
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# ${title}\n\nProject initialized in PrinceAI Workspace.\nType: ${type}\n\n## Overview\n${description || 'Autonomous project workspace.'}`,
      },
    ];

    if (type === 'website') {
      initialFiles.push(
        {
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head><title>${title}</title></head>\n<body><h1>${title}</h1></body>\n</html>`,
        },
        {
          name: 'style.css',
          path: 'style.css',
          language: 'css',
          content: `body { font-family: sans-serif; padding: 2rem; background: #fafafa; }`,
        }
      );
    }

    const project: WorkspaceProject = {
      id: 'ws_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      title: title.trim(),
      type,
      description: description?.trim() || '',
      files: initialFiles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveWorkspaceProject(project);
    return res.status(201).json({ project });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create workspace project.' });
  }
});

// GET /api/workspace/projects/:id
workspaceRouter.get('/projects/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getWorkspaceProject(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  return res.json({ project });
});

// POST /api/workspace/projects/:id/files (Add / update file)
workspaceRouter.post('/projects/:id/files', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getWorkspaceProject(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { name, path: rawPath, content, language } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'File name is required.' });
  }

  const safePath = sanitizePath(rawPath || name);
  const existingIdx = project.files.findIndex((f) => f.path === safePath || f.name === name);

  const fileItem: ProjectFile = {
    name,
    path: safePath,
    content: content || '',
    language: language || 'text',
  };

  if (existingIdx >= 0) {
    project.files[existingIdx] = fileItem;
  } else {
    project.files.push(fileItem);
  }

  project.updatedAt = new Date().toISOString();
  db.saveWorkspaceProject(project);
  return res.json({ file: fileItem, project });
});

// DELETE /api/workspace/projects/:id/files
workspaceRouter.delete('/projects/:id/files', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getWorkspaceProject(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { path: rawPath } = req.body;
  project.files = project.files.filter((f) => f.path !== rawPath && f.name !== rawPath);
  project.updatedAt = new Date().toISOString();
  db.saveWorkspaceProject(project);
  return res.json({ message: 'File deleted.', project });
});

// POST /api/workspace/projects/:id/ai-edit (Before vs After Diff Generator)
workspaceRouter.post('/projects/:id/ai-edit', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filePath, instruction } = req.body;
    const project = db.getWorkspaceProject(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const file = project.files.find((f) => f.path === filePath || f.name === filePath);
    if (!file) {
      return res.status(404).json({ error: 'File not found in project.' });
    }

    const prompt = `You are PrinceAI Workspace Refactoring Engine.
File: "${file.name}"
Instruction: "${instruction}"

Original File Content:
\`\`\`${file.language}
${file.content}
\`\`\`

Return the updated file content inside a single code block matching the language:
\`\`\`${file.language}
... updated content ...
\`\`\``;

    const reply = await generateGeminiText({
      prompt,
      systemInstruction: 'Output only the revised code block.',
    });

    const match = reply.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/);
    const modified = match ? match[1] : reply;

    project.pendingDiff = {
      file: file.path,
      original: file.content,
      modified,
    };
    db.saveWorkspaceProject(project);

    return res.json({
      diff: project.pendingDiff,
      message: 'Diff generated. User approval required before applying changes.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate AI modification.' });
  }
});

// POST /api/workspace/projects/:id/approve-diff
workspaceRouter.post('/projects/:id/approve-diff', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { action } = req.body; // 'APPROVE' | 'REJECT'
  const project = db.getWorkspaceProject(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (!project.pendingDiff) {
    return res.status(400).json({ error: 'No pending diff to review.' });
  }

  if (action === 'APPROVE') {
    const file = project.files.find((f) => f.path === project.pendingDiff!.file);
    if (file) {
      file.content = project.pendingDiff.modified;
    }
  }

  project.pendingDiff = undefined;
  project.updatedAt = new Date().toISOString();
  db.saveWorkspaceProject(project);

  return res.json({
    message: action === 'APPROVE' ? 'Modification applied successfully.' : 'Modification rejected.',
    project,
  });
});

// GET /api/workspace/projects/:id/zip
workspaceRouter.get('/projects/:id/zip', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = db.getWorkspaceProject(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const zip = new JSZip();
    for (const file of project.files) {
      zip.file(file.path || file.name, file.content);
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_workspace.zip"`);
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create ZIP.' });
  }
});

// DELETE /api/workspace/projects/:id
workspaceRouter.delete('/projects/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteWorkspaceProject(req.params.id, req.user!.id);
  if (!ok) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  return res.json({ message: 'Project deleted successfully.' });
});
