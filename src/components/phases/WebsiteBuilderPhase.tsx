import React, { useState, useEffect } from 'react';
import { Globe, Download, Play, Eye, Code, RefreshCw, FileCode, Check } from 'lucide-react';
import { api } from '../../services/api';
import { WebsiteProject, ProjectFile } from '../../types';

export const WebsiteBuilderPhase: React.FC = () => {
  const [projects, setProjects] = useState<WebsiteProject[]>([]);
  const [activeProject, setActiveProject] = useState<WebsiteProject | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [prompt, setPrompt] = useState('Create a modern AI SaaS landing page with dark navy theme, feature cards, and interactive pricing calculator');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.getWebsites();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0) {
        selectProject(res.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load website projects', err);
    }
  };

  const selectProject = (p: WebsiteProject) => {
    setActiveProject(p);
    const htmlFile = p.files.find((f) => f.name === 'index.html') || p.files[0];
    setActiveFile(htmlFile);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateWebsite(prompt.trim());
      setProjects((prev) => [res.project, ...prev]);
      selectProject(res.project);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (newContent: string) => {
    if (!activeProject || !activeFile) return;
    const updatedFiles = activeProject.files.map((f) =>
      f.name === activeFile.name ? { ...f, content: newContent } : f
    );
    const updatedProj = { ...activeProject, files: updatedFiles };
    setActiveProject(updatedProj);
    setActiveFile({ ...activeFile, content: newContent });
  };

  const getCombinedHtml = () => {
    if (!activeProject) return '';
    const htmlFile = activeProject.files.find((f) => f.name === 'index.html');
    const cssFile = activeProject.files.find((f) => f.name === 'style.css');
    const jsFile = activeProject.files.find((f) => f.name === 'script.js' || f.name === 'app.js');

    let baseHtml = htmlFile?.content || '<h1>Preview</h1>';
    if (cssFile) {
      baseHtml = baseHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }
    if (jsFile) {
      baseHtml = baseHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }
    return baseHtml;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Generator Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">Website Builder</h2>
            <p className="text-[11px] text-slate-500">HTML/CSS/JS Scaffold, Sandboxed Preview & ZIP Export</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex items-center gap-2 flex-1 max-w-xl">
          <input
            id="input-website-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Modern Developer Portfolio with project grid..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            id="btn-website-generate"
            type="submit"
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 shrink-0"
          >
            <Play className="w-3 h-3" />
            <span>{isGenerating ? 'Generating...' : 'Build Website'}</span>
          </button>
        </form>

        {activeProject && (
          <a
            id="btn-website-download-zip"
            href={`/api/website/projects/${activeProject.id}/zip`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>
        )}
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-56 border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Project Files
          </div>
          <div className="p-2 space-y-1">
            {activeProject?.files.map((file) => {
              const isCurrent = file.name === activeFile?.name;
              return (
                <button
                  key={file.name}
                  onClick={() => {
                    setActiveFile(file);
                    setActiveTab('code');
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-left transition-colors ${
                    isCurrent
                      ? 'bg-blue-100/70 text-blue-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor & Preview Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* View Tab Switcher */}
          <div className="h-10 border-b border-slate-200 px-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-1">
              <button
                id="btn-tab-preview"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>

              <button
                id="btn-tab-code"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'code'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code Editor ({activeFile?.name || 'File'})</span>
              </button>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              {activeProject?.title || 'No Project'}
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'preview' ? (
              <iframe
                id="iframe-website-preview"
                title="Website Preview"
                srcDoc={getCombinedHtml()}
                sandbox="allow-scripts allow-forms"
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <textarea
                id="textarea-website-code"
                value={activeFile?.content || ''}
                onChange={(e) => handleFileChange(e.target.value)}
                className="w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-100 resize-none focus:outline-none leading-relaxed"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
