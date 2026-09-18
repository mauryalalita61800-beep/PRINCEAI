import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { PPTProject, SlideItem } from '../types';

export const pptRouter = Router();

// POST /api/generate/ppt
pptRouter.post('/ppt', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, slideCount = 5, theme = 'Modern Blue' } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Presentation topic is required.' });
    }

    const count = Math.min(Math.max(Number(slideCount) || 5, 3), 15);

    const prompt = `Create a structured presentation deck for the topic: "${topic}".
Number of slides requested: ${count}.
For each slide, provide:
1. Slide Title
2. 3 to 4 concise bullet points
3. Presenter notes

Format your response strictly as JSON with this structure:
{
  "title": "Overall Deck Title",
  "slides": [
    {
      "id": 1,
      "title": "Title of Slide",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "notes": "Speaker notes here"
    }
  ]
}`;

    const rawResponse = await generateGeminiText({
      prompt,
      systemInstruction: 'You are PrinceAI Presentation Designer. Output valid JSON containing slides and bullet points.',
    });

    let slides: SlideItem[] = [];
    let deckTitle = topic;

    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          slides = parsed.slides;
          deckTitle = parsed.title || topic;
        }
      }
    } catch {
      // Fallback structured generation
    }

    if (!slides.length) {
      for (let i = 1; i <= count; i++) {
        slides.push({
          id: i,
          title: i === 1 ? `Introduction to ${topic}` : i === count ? 'Summary & Next Steps' : `Key Dimension ${i - 1}: Strategic Analysis`,
          bullets: [
            `Core conceptual breakdown and relevance to ${topic}`,
            'Key operational considerations and industry best practices',
            'Measurable outcomes, efficiency gains, and risk factors',
          ],
          notes: `Presenter notes for slide ${i}: Emphasize high-impact takeaways.`,
        });
      }
    }

    const project: PPTProject = {
      id: 'ppt_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      title: deckTitle,
      topic,
      theme,
      slides,
      createdAt: new Date().toISOString(),
    };

    db.savePPTProject(project);
    return res.status(201).json({ project });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate presentation deck.' });
  }
});

// POST /api/generate/docx
pptRouter.post('/docx', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, sections } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Document title is required.' });
    }

    const prompt = `Generate an executive structured document for title: "${title}".
Requested sections: ${sections || 'Introduction, Executive Summary, Technical Architecture, Implementation Plan, Conclusion'}.
Provide complete, professional prose for each section.`;

    const content = await generateGeminiText({
      prompt,
      systemInstruction: 'You are PrinceAI Document Generator. Write professional, polished technical documentation.',
    });

    return res.json({
      title,
      content,
      format: 'DOCX / Markdown formatted document',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate document.' });
  }
});

// POST /api/generate/text
pptRouter.post('/text', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    const text = await generateGeminiText({ prompt });
    return res.json({ text });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate text.' });
  }
});

// GET /api/generate/ppt
pptRouter.get('/ppt', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getPPTProjects(req.user!.id);
  return res.json({ projects });
});
