import React, { useState, useEffect } from 'react';
import { Search, Globe, BookOpen, ExternalLink, Sparkles, Filter, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { SearchRecord } from '../../types';

export const WebSearchPhase: React.FC = () => {
  const [query, setQuery] = useState('Latest advancements in quantum computing hardware and error mitigation');
  const [mode, setMode] = useState<'quick' | 'research'>('research');
  const [domainFilter, setDomainFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<SearchRecord | null>(null);
  const [history, setHistory] = useState<SearchRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getSearchHistory();
      setHistory(res.searches || []);
      if (res.searches && res.searches.length > 0) {
        setCurrentSearch(res.searches[0]);
      }
    } catch (err) {
      console.error('Failed to load search history', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.searchWeb(query.trim(), mode, domainFilter || undefined);
      setCurrentSearch(res.search);
      setHistory((prev) => [res.search, ...prev]);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Search History Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Research Log</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No search history</div>
          ) : (
            history.map((item) => {
              const isSelected = item.id === currentSearch?.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setCurrentSearch(item)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="uppercase font-mono">{item.mode}</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="line-clamp-2">{item.query}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Grounded Search Panel */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="input-web-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask or research anything with live citations..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              id="btn-web-search-submit"
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Mode:</span>
              <button
                type="button"
                onClick={() => setMode('quick')}
                className={`px-2.5 py-1 rounded-md border font-medium ${
                  mode === 'quick' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Quick Search
              </button>
              <button
                type="button"
                onClick={() => setMode('research')}
                className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1 ${
                  mode === 'research' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Deep Research</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Domain filter (e.g. arxiv.org)"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-2 py-0.5 text-xs bg-white border border-slate-200 rounded focus:outline-none w-48"
              />
            </div>
          </div>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          {currentSearch ? (
            <>
              {/* Grounded Source Cards */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verified Web Sources ({currentSearch.results.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentSearch.results.map((source) => (
                    <a
                      key={source.citationId}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all block group"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold text-blue-600">[{source.citationId}]</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2">{source.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{source.snippet}</p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Research Report with Citations */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {currentSearch.report}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-16">
              <Search className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-xs">Enter a search inquiry above to generate grounded research with citations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
