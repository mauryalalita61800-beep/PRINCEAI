import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';

export const codingRouter = Router();

// POST /api/coding/assistant
codingRouter.post('/assistant', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, language, code, prompt, targetLanguage } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required (e.g. generate, explain, debug, improve, convert, refactor).' });
    }

    let systemInstruction = `You are PrinceAI Coding Assistant, an expert software engineer.
Never include destructive or dangerous OS scripts.
Provide strictly clean, modular, production-ready code along with concise explanations.`;

    let userPrompt = '';
    const lang = language || 'TypeScript';

    switch (action) {
      case 'generate':
        userPrompt = `Language: ${lang}
Task: ${prompt || 'Generate high performance utility'}
Write complete, clean code with appropriate comments and error handling.`;
        break;
      case 'explain':
        userPrompt = `Language: ${lang}
Code to explain:
\`\`\`${lang}
${code}
\`\`\`
Provide a concise, line-by-line or architectural explanation of how this code operates.`;
        break;
      case 'debug':
        userPrompt = `Language: ${lang}
Code to debug:
\`\`\`${lang}
${code}
\`\`\`
Problem / Issue: ${prompt || 'Find logic errors, edge cases, and runtime bugs'}
Identify the root cause and provide the corrected code with fix details.`;
        break;
      case 'improve':
        userPrompt = `Language: ${lang}
Code to optimize / improve:
\`\`\`${lang}
${code}
\`\`\`
Focus on time complexity, memory efficiency, and readability.`;
        break;
      case 'convert':
        userPrompt = `Source Language: ${lang}
Target Language: ${targetLanguage || 'Python'}
Original Code:
\`\`\`${lang}
${code}
\`\`\`
Convert the logic accurately into ${targetLanguage || 'Python'} idiomatic code.`;
        break;
      case 'refactor':
        userPrompt = `Language: ${lang}
Code to refactor:
\`\`\`${lang}
${code}
\`\`\`
Refactor into clean functions/classes adhering to SOLID principles and DRY.`;
        break;
      case 'comments':
        userPrompt = `Language: ${lang}
Code:
\`\`\`${lang}
${code}
\`\`\`
Add clear docstrings and inline documentation explaining complex sections.`;
        break;
      case 'function':
        userPrompt = `Language: ${lang}
Function requirement: ${prompt}
Generate a robust, reusable function with complete type signatures and validation.`;
        break;
      case 'class':
        userPrompt = `Language: ${lang}
Class requirement: ${prompt}
Generate an object-oriented class with encapsulated fields, constructor, and methods.`;
        break;
      default:
        userPrompt = `Language: ${lang}\nRequest: ${prompt}\nCode:\n${code}`;
    }

    const responseText = await generateGeminiText({
      prompt: userPrompt,
      systemInstruction,
    });

    // Extract code block if present
    const codeBlockMatch = responseText.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/);
    const extractedCode = codeBlockMatch ? codeBlockMatch[1].trim() : code;

    return res.json({
      action,
      language: lang,
      targetLanguage,
      result: responseText,
      extractedCode,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Coding assistant error.' });
  }
});
