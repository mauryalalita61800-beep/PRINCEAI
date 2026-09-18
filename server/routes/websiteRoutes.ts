import { Router, Response } from 'express';
import crypto from 'crypto';
import JSZip from 'jszip';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { WebsiteProject, ProjectFile } from '../types';

export const websiteRouter = Router();

// POST /api/website/generate
websiteRouter.post('/generate', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, title } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required to generate website.' });
    }

    const projectTitle = title?.trim() || prompt.slice(0, 30);
    const userId = req.user!.id;

    const aiPrompt = `Generate a complete, modern, responsive multi-file web project for the following topic:
"${prompt}"

Produce three specific files formatted with distinct code blocks:
FILE: index.html
\`\`\`html
(complete HTML code with semantic tags, modern design layout, and linkage to style.css and app.js)
\`\`\`

FILE: style.css
\`\`\`css
(modern CSS styling with clean color palette, flex/grid layouts, responsive media queries, elegant typography)
\`\`\`

FILE: app.js
\`\`\`javascript
(interactive functionality such as navigation toggle, smooth filters, modal or interactive elements)
\`\`\``;

    const response = await generateGeminiText({
      prompt: aiPrompt,
      systemInstruction: 'You are PrinceAI Web Architect. Generate clean, safe HTML, CSS, and JS web projects.',
    });

    // Parse files from response
    const files: ProjectFile[] = [];

    const htmlMatch = response.match(/FILE:\s*index\.html[\s\S]*?```html\n([\s\S]*?)```/i) || response.match(/```html\n([\s\S]*?)```/i);
    const cssMatch = response.match(/FILE:\s*style\.css[\s\S]*?```css\n([\s\S]*?)```/i) || response.match(/```css\n([\s\S]*?)```/i);
    const jsMatch = response.match(/FILE:\s*app\.js[\s\S]*?```javascript\n([\s\S]*?)```/i) || response.match(/```javascript\n([\s\S]*?)```/i);

    const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectTitle}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="hero">
    <nav class="navbar">
      <div class="logo">${projectTitle}</div>
      <ul class="nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Features</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
    <div class="hero-content">
      <h1>Welcome to ${projectTitle}</h1>
      <p>Crafted by PrinceAI Web Architect for seamless, modern web presence.</p>
      <button id="cta-btn" class="primary-btn">Explore Now</button>
    </div>
  </header>
  <main>
    <section id="about" class="section">
      <h2>About Us</h2>
      <p>Dedicated to delivering excellence with cutting-edge digital experiences.</p>
    </section>
    <section id="services" class="section cards-grid">
      <div class="card"><h3>Innovation</h3><p>Next-gen solutions crafted for scale.</p></div>
      <div class="card"><h3>Quality</h3><p>Rigorous attention to detail and performance.</p></div>
      <div class="card"><h3>Support</h3><p>Round-the-clock guidance and continuous iteration.</p></div>
    </section>
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${projectTitle}. All rights reserved.</p>
  </footer>
  <script src="app.js"></script>
</body>
</html>`;

    const defaultCss = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background: #f8fafc; line-height: 1.6; }
.hero { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 2rem 1.5rem 6rem; text-align: center; }
.navbar { display: flex; justify-content: space-between; align-items: center; max-width: 1100px; margin: 0 auto 3rem; }
.logo { font-size: 1.5rem; font-weight: 700; color: #38bdf8; }
.nav-links { display: flex; list-style: none; gap: 1.5rem; }
.nav-links a { color: #cbd5e1; text-decoration: none; font-weight: 500; transition: color 0.2s; }
.nav-links a:hover { color: #fff; }
.hero-content h1 { font-size: 2.8rem; margin-bottom: 1rem; color: #fff; }
.hero-content p { font-size: 1.15rem; color: #94a3b8; max-width: 600px; margin: 0 auto 2rem; }
.primary-btn { background: #38bdf8; color: #0f172a; border: none; padding: 0.75rem 2rem; border-radius: 9999px; font-weight: 600; cursor: pointer; transition: transform 0.2s, background 0.2s; }
.primary-btn:hover { background: #7dd3fc; transform: translateY(-2px); }
.section { max-width: 1100px; margin: 4rem auto; padding: 0 1.5rem; text-align: center; }
.section h2 { font-size: 2rem; margin-bottom: 1.5rem; color: #0f172a; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
.card { background: #fff; padding: 2.5rem 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.card h3 { color: #0f172a; margin-bottom: 0.75rem; font-size: 1.3rem; }
.card p { color: #64748b; font-size: 0.95rem; }
footer { background: #0f172a; color: #94a3b8; text-align: center; padding: 2rem; margin-top: 4rem; }`;

    const defaultJs = `document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('cta-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('Welcome to ${projectTitle}! Project generated by PrinceAI.');
    });
  }
});`;

    files.push({
      name: 'index.html',
      path: 'index.html',
      content: htmlMatch ? htmlMatch[1].trim() : defaultHtml,
      language: 'html',
    });

    files.push({
      name: 'style.css',
      path: 'style.css',
      content: cssMatch ? cssMatch[1].trim() : defaultCss,
      language: 'css',
    });

    files.push({
      name: 'app.js',
      path: 'app.js',
      content: jsMatch ? jsMatch[1].trim() : defaultJs,
      language: 'javascript',
    });

    const project: WebsiteProject = {
      id: 'web_' + crypto.randomBytes(6).toString('hex'),
      userId,
      title: projectTitle,
      description: prompt,
      files,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveWebsite(project);
    return res.status(201).json({ project });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate website.' });
  }
});

// GET /api/website/projects
websiteRouter.get('/projects', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getWebsites(req.user!.id);
  return res.json({ projects });
});

// GET /api/website/projects/:id
websiteRouter.get('/projects/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getWebsite(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  return res.json({ project });
});

// PUT /api/website/projects/:id
websiteRouter.put('/projects/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const project = db.getWebsite(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { title, files } = req.body;
  if (title) project.title = title.trim();
  if (files && Array.isArray(files)) project.files = files;
  project.updatedAt = new Date().toISOString();

  db.saveWebsite(project);
  return res.json({ project });
});

// GET /api/website/projects/:id/zip
websiteRouter.get('/projects/:id/zip', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const project = db.getWebsite(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const zip = new JSZip();
    for (const file of project.files) {
      zip.file(file.path || file.name, file.content);
    }

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.title.replace(/\s+/g, '_')}_website.zip"`);
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate ZIP.' });
  }
});
