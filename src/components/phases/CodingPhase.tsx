import React, { useState } from 'react';
import { Code2, Play, Copy, Check, Sparkles, Terminal, FileCode, ArrowRightLeft } from 'lucide-react';
import { api } from '../../services/api';

const LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Kotlin',
  'Java',
  'HTML',
  'CSS',
  'SQL',
  'C++',
  'C',
];

const ACTIONS = [
  { id: 'generate', label: 'Generate Code' },
  { id: 'explain', label: 'Explain Code' },
  { id: 'debug', label: 'Debug & Fix' },
  { id: 'refactor', label: 'Refactor Cleanly' },
  { id: 'comments', label: 'Add Docstrings & Comments' },
  { id: 'convert', label: 'Convert Language' },
];

export const CodingPhase: React.FC = () => {
  const [language, setLanguage] = useState('TypeScript');
  const [targetLang, setTargetLang] = useState('Python');
  const [action, setAction] = useState('generate');
  const [prompt, setPrompt] = useState('Build an in-memory token bucket rate limiter with burst capability');
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsCopied(false);

    try {
      const res = await api.codingAssistant({
        action,
        language,
        code: inputCode,
        prompt,
        targetLanguage: targetLang,
      });

      setOutputCode(res.extractedCode || res.result);
      setExplanation(res.result);
    } catch (err: any) {
      setOutputCode(`// Execution error:\n// ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Controls Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">AI Coding Assistant</h2>
            <p className="text-[11px] text-slate-500">Multi-language generation, debugging & refactoring</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Selector */}
          <select
            id="select-coding-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>

          {/* Primary Language */}
          <select
            id="select-coding-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          {/* Target Language if Converting */}
          {action === 'convert' && (
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            id="btn-run-coding"
            onClick={handleExecute}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            <span>{isLoading ? 'Executing...' : 'Run Action'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
        {/* Left Input Pane */}
        <div className="flex flex-col h-full bg-white p-4 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Prompt / Requirement</label>
            <textarea
              id="textarea-coding-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate or instructions for refactoring..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {(action !== 'generate' || inputCode) && (
            <div className="flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Source Code ({language})</label>
                <button
                  onClick={() =>
                    setInputCode(
                      `// Sample rate limiter snippet\nclass RateLimiter {\n  constructor(private limit: number) {}\n  allow(key: string): boolean { return true; }\n}`
                    )
                  }
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Load Sample Code
                </button>
              </div>
              <textarea
                id="textarea-coding-source"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Paste your source code here..."
                className="flex-1 w-full p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Preset templates */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Starters:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'JWT Token verification middleware',
                'LRU Cache with TTL expiration',
                'Debounced async autocomplete hook',
                'PostgreSQL connection pool retry logic',
              ].map((starter, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setPrompt(starter)}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Pane */}
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
          <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono font-medium text-slate-300">
                {action === 'convert' ? targetLang : language} Output
              </span>
            </div>

            {outputCode && (
              <button
                id="btn-copy-code"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? 'Copied' : 'Copy Code'}</span>
              </button>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
            {outputCode ? (
              outputCode
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                <Code2 className="w-8 h-8 mb-2 opacity-30" />
                <p>Click "Run Action" to generate or refactor code.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
