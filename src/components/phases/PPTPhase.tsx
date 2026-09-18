import React, { useState, useEffect } from 'react';
import { Presentation, Play, Download, ChevronLeft, ChevronRight, FileText, Check } from 'lucide-react';
import { api } from '../../services/api';
import { PPTProject, SlideItem } from '../../types';

export const PPTPhase: React.FC = () => {
  const [topic, setTopic] = useState('Enterprise Adoption of Autonomous GenAI Platforms in 2026');
  const [slideCount, setSlideCount] = useState(5);
  const [theme, setTheme] = useState('Modern Executive Blue');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeProject, setActiveProject] = useState<PPTProject | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.getPPTProjects();
      if (res.projects && res.projects.length > 0) {
        setActiveProject(res.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load ppt projects', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generatePPT(topic.trim(), slideCount, theme);
      setActiveProject(res.project);
      setCurrentSlideIdx(0);
    } catch (err: any) {
      alert(`Presentation generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSlide: SlideItem | undefined = activeProject?.slides[currentSlideIdx];

  const handleDownloadDoc = async () => {
    if (!activeProject) return;
    try {
      const res = await api.generateDOCX(activeProject.title);
      const blob = new Blob([res.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.title.replace(/\s+/g, '_')}_brief.md`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Controls Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">PPT & Document Studio</h2>
            <p className="text-[11px] text-slate-500">AI Slide Decks, Bullet Points, Speaker Notes & DOCX Briefs</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex items-center gap-2 flex-1 max-w-2xl">
          <input
            id="input-ppt-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Presentation Topic..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />

          <select
            value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value={3}>3 Slides</option>
            <option value={5}>5 Slides</option>
            <option value={8}>8 Slides</option>
            <option value={10}>10 Slides</option>
          </select>

          <button
            id="btn-ppt-generate"
            type="submit"
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 shrink-0"
          >
            <Play className="w-3 h-3" />
            <span>{isGenerating ? 'Building...' : 'Build Deck'}</span>
          </button>
        </form>

        {activeProject && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresenting(!isPresenting)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
            >
              {isPresenting ? 'Exit Fullscreen' : 'Present Deck'}
            </button>
            <button
              onClick={handleDownloadDoc}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export DOCX</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Presentation Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Deck Navigator */}
        <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col p-3 overflow-y-auto space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Slide Navigator ({activeProject?.slides.length || 0})
          </div>

          {activeProject?.slides.map((slide, sIdx) => {
            const isSelected = sIdx === currentSlideIdx;
            return (
              <div
                key={slide.id || sIdx}
                onClick={() => setCurrentSlideIdx(sIdx)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>SLIDE {sIdx + 1}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </div>
                <h4 className="text-xs font-semibold text-slate-800 line-clamp-2">{slide.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-100 overflow-y-auto">
          {currentSlide ? (
            <div className="w-full max-w-3xl aspect-16/9 bg-white rounded-2xl border border-slate-200 shadow-md p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">
                  <span>{activeProject?.title}</span>
                  <span className="font-mono text-slate-400">
                    {currentSlideIdx + 1} / {activeProject?.slides.length}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
                  {currentSlide.title}
                </h2>

                <ul className="space-y-3">
                  {currentSlide.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Presenter Notes */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="italic">Notes: {currentSlide.notes || 'Emphasize core takeaways.'}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentSlideIdx === 0}
                    onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentSlideIdx === (activeProject?.slides.length || 1) - 1}
                    onClick={() => setCurrentSlideIdx((prev) => Math.min((activeProject?.slides.length || 1) - 1, prev + 1))}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <Presentation className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Enter a topic above to generate a slide presentation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
