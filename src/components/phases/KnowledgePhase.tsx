import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, BookOpen, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { KnowledgeDoc, KnowledgeChunk } from '../../types';

export const KnowledgePhase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [chunkSize, setChunkSize] = useState(300);
  const [overlap, setOverlap] = useState(50);
  const [isIngesting, setIsIngesting] = useState(false);

  // Search State
  const [query, setQuery] = useState('What security controls are enforced on backend endpoints?');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      const res = await api.getKnowledgeDocs();
      setDocs(res.documents || []);
      if (res.documents && res.documents.length > 0) {
        setSelectedDoc(res.documents[0]);
      }
    } catch (err) {
      console.error('Failed to load knowledge documents', err);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsIngesting(true);
    try {
      const res = await api.addKnowledgeDoc({
        title: newTitle.trim(),
        content: newContent.trim(),
        chunkSize,
        overlap,
      });
      setDocs([res.document, ...docs]);
      setSelectedDoc(res.document);
      setNewTitle('');
      setNewContent('');
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.queryKnowledge(query.trim(), selectedDoc?.id);
      setSearchResult(res);
    } catch (err: any) {
      alert(`Query failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Knowledge Base Repository Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>RAG Knowledge Base</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{docs.length} docs</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {docs.map((d) => {
            const isSelected = d.id === selectedDoc?.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDoc(d)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{d.chunks?.length || 0} CHUNKS</span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="truncate">{d.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Ingest New Knowledge Section */}
        <form onSubmit={handleIngest} className="p-3 border-t border-slate-200 bg-white space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Ingest Knowledge Doc
          </span>
          <input
            type="text"
            placeholder="Doc Title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
          />
          <textarea
            rows={2}
            placeholder="Document content or policy text..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none"
          />
          <button
            type="submit"
            disabled={isIngesting || !newTitle.trim() || !newContent.trim()}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold disabled:opacity-50"
          >
            {isIngesting ? 'Chunking & Ingesting...' : 'Ingest Document'}
          </button>
        </form>
      </div>

      {/* Grounded Retrieval & Synthesis Canvas */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Search Query Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70">
          <form onSubmit={handleQuery} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="input-rag-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask grounded questions about ingested documents..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              id="btn-rag-query"
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSearching ? 'Retrieving...' : 'Query RAG'}</span>
            </button>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          {searchResult ? (
            <div className="space-y-6">
              {/* Confidence & Answer Header */}
              <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Grounded Knowledge Synthesis</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Confidence: {(searchResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {searchResult.answer}
                </div>
              </div>

              {/* Retrieved Chunks with Exact Citations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Attributed Source Chunks ({searchResult.retrievedChunks?.length || 0})
                </h4>

                <div className="space-y-2.5">
                  {searchResult.retrievedChunks?.map((chunk: KnowledgeChunk, cIdx: number) => (
                    <div
                      key={chunk.id || cIdx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="font-bold text-emerald-700">
                          [{chunk.documentTitle} • Chunk {chunk.chunkIndex + 1}]
                        </span>
                        <span>Relevance: {(chunk.score * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-slate-700 font-sans leading-relaxed">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedDoc ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">{selectedDoc.title}</h3>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedDoc.chunks?.length || 0} Chunks Ingested
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedDoc.chunks?.map((chunk: KnowledgeChunk) => (
                      <div key={chunk.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <span className="font-mono text-[10px] text-slate-400 block mb-1">
                          Chunk {chunk.chunkIndex + 1}
                        </span>
                        <p className="text-slate-700">{chunk.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Select a document or enter a question to query the grounded knowledge base.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
