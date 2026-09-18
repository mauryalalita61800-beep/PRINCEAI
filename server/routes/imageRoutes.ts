import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { ImageRecord } from '../types';

export const imageRouter = Router();

// POST /api/images/enhance-prompt
imageRouter.post('/enhance-prompt', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const enhanced = await generateGeminiText({
      prompt: `Enhance the following creative image prompt into an exceptionally detailed, cinematic visual prompt specifying lighting, composition, color palette, camera lens, depth of field, and art style.
Original prompt: "${prompt}"
Return only the enhanced prompt without markdown commentary.`,
      systemInstruction: 'You are PrinceAI Visual Art Director. Output single paragraph cinematic prompts.',
    });

    return res.json({ enhancedPrompt: enhanced.trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to enhance prompt.' });
  }
});

// Helper to generate dynamic SVG illustrations based on themes
function generateThemedSvg(prompt: string, aspectRatio: string): string {
  const pLower = prompt.toLowerCase();
  let primaryColor = '#3b82f6';
  let secondaryColor = '#8b5cf6';
  let accentColor = '#06b6d4';

  if (pLower.includes('sunset') || pLower.includes('warm') || pLower.includes('fire')) {
    primaryColor = '#f97316';
    secondaryColor = '#ec4899';
    accentColor = '#eab308';
  } else if (pLower.includes('nature') || pLower.includes('forest') || pLower.includes('green')) {
    primaryColor = '#10b981';
    secondaryColor = '#059669';
    accentColor = '#84cc16';
  } else if (pLower.includes('cyber') || pLower.includes('neon') || pLower.includes('tech')) {
    primaryColor = '#6366f1';
    secondaryColor = '#a855f7';
    accentColor = '#06b6d4';
  }

  const width = aspectRatio === '16:9' ? 800 : aspectRatio === '9:16' ? 450 : 600;
  const height = aspectRatio === '16:9' ? 450 : aspectRatio === '9:16' ? 800 : 600;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="orbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0.2" />
    </linearGradient>
    <linearGradient id="orbGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${primaryColor}" stop-opacity="0.1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="30" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)" />
  <circle cx="${width * 0.35}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.3}" fill="url(#orbGrad1)" filter="url(#glow)" />
  <circle cx="${width * 0.65}" cy="${height * 0.6}" r="${Math.min(width, height) * 0.25}" fill="url(#orbGrad2)" filter="url(#glow)" />
  <path d="M 0,${height * 0.75} Q ${width * 0.25},${height * 0.65} ${width * 0.5},${height * 0.8} T ${width},${height * 0.7} L ${width},${height} L 0,${height} Z" fill="#0f172a" opacity="0.8" />
  <text x="${width / 2}" y="${height * 0.88}" font-family="sans-serif" font-size="20" font-weight="600" fill="#e2e8f0" text-anchor="middle">
    ${prompt.slice(0, 36)}
  </text>
  <text x="${width / 2}" y="${height * 0.94}" font-family="sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">
    PrinceAI Studio • Generated Visual Asset
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// POST /api/images/generate
imageRouter.post('/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, aspectRatio = '1:1', enhance = true } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    let enhancedPrompt = prompt;
    if (enhance) {
      enhancedPrompt = await generateGeminiText({
        prompt: `Create a brief 1-sentence prompt expansion for: "${prompt}". Focus on mood and style.`,
        systemInstruction: 'Output only the expanded prompt sentence.',
      });
    }

    const imageUrl = generateThemedSvg(prompt, aspectRatio);

    const record: ImageRecord = {
      id: 'img_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      prompt: prompt.trim(),
      enhancedPrompt: enhancedPrompt.trim(),
      imageUrl,
      aspectRatio,
      createdAt: new Date().toISOString(),
    };

    db.saveImage(record);
    return res.status(201).json({ image: record });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate image.' });
  }
});

// GET /api/images
imageRouter.get('/', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const images = db.getImages(req.user!.id);
  return res.json({ images });
});

// DELETE /api/images/:id
imageRouter.delete('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteImage(req.params.id, req.user!.id);
  if (!ok) {
    return res.status(404).json({ error: 'Image not found.' });
  }
  return res.json({ message: 'Image deleted.' });
});
