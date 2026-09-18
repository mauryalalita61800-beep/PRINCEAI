import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';

export const DocumentsPhase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
      if (res.documents && res.documents.length > 0 && !selectedDocId) {
        loadSingleDoc(res.documents[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const loadSingleDoc = async (id: string) => {
    setSelectedDocId(id);
    setQaAnswer(null);
    try {
      const res = await api.getDocument(id);
      setSelectedDoc(res.document);
    } catch (err) {
      console.error('Failed to load doc detail', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const textContent = (event.target?.result as string) || '';
        const res = await api.uploadDocument(file.name, textContent, file.type || 'text/plain');
        await loadDocuments();
        loadSingleDoc(res.document.id);
        setIsUploading(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
      setIsUploading(false);
    }
  };

  const handleQuickUploadSample = async () => {
    setIsUploading(true);
    try {
      const sampleText = `# PrinceAI Architecture Overview
PrinceAI is an all-in-one GenAI platform designed to provide conversational reasoning, multi-language coding assistance, web scraping and grounded research, autonomous tool orchestration, and visual workflow automation.

## Core Architectural Pillars
1. Safe Local Persistence with zero remote database dependencies.
2. Server-Side Google GenAI integration with zero browser API key exposure.
3. Multi-Tiered Access Control (USER, ADMIN, SUPER_ADMIN) with IDOR prevention.
4. RAG Knowledge Ingestion Pipeline: Ingest -> Clean -> Chunk -> Semantic Embed -> Attribute citations.
5. Autonomous Agent Tool Registry with Human Approval Gates.

## Security Posture
All document content is treated as untrusted data and strictly sanitized before downstream model ingestion.`;

      const res = await api.uploadDocument('PrinceAI_Architecture_Whitepaper.md', sampleText, 'text/markdown');
      await loadDocuments();
      loadSingleDoc(res.document.id);
    } catch (err: any) {
      console.error('Sample upload error', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedDocId) return;
    setIsSummarizing(true);
    try {
      const res = await api.summarizeDocument(selectedDocId);
      setSelectedDoc((prev: any) => ({ ...prev, summary: res.summary }));
      setDocuments((prev) =>
        prev.map((d) => (d.id === selectedDocId ? { ...d, summary: res.summary } : d))
      );
    } catch (err: any) {
      alert(`Summarize failed: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !question.trim()) return;
    setIsAnswering(true);
    setQaAnswer(null);
    try {
      const res = await api.askDocument(selectedDocId, question.trim());
      setQaAnswer(res.answer);
    } catch (err: any) {
      setQaAnswer(`⚠️ Error: ${err.message}`);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);
      if (selectedDocId === id) {
        if (remaining.length > 0) {
          loadSingleDoc(remaining[0].id);
        } else {
          setSelectedDocId(null);
          setSelectedDoc(null);
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Document Roster */}
      <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3.5 border-b border-slate-200 space-y-2">
          <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
            <input
              id="file-input-doc"
              type="file"
              accept=".txt,.md,.pdf,.docx,.csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleQuickUploadSample}
            className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors"
          >
            + Load Sample Whitepaper
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">No documents uploaded yet.</div>
          ) : (
            documents.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => loadSingleDoc(doc.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-medium truncate">{doc.filename}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
                    <span>{Math.round(doc.size / 1024)} KB</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Document Inspector & Q&A */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto">
        {selectedDoc ? (
          <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
            {/* Document Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedDoc.filename}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Size: {Math.round(selectedDoc.size / 1024)} KB • Type: {selectedDoc.mimeType}
                </p>
              </div>

              <button
                id="btn-doc-summarize"
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{isSummarizing ? 'Analyzing...' : 'Generate Executive Summary'}</span>
              </button>
            </div>

            {/* Summary Section */}
            {selectedDoc.summary && (
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Executive Summary</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedDoc.summary}
                </div>
              </div>
            )}

            {/* Q&A Assistant */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Ask Questions About This Document</span>
              </div>

              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., What are the core architectural pillars mentioned?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAnswering || !question.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>{isAnswering ? 'Searching...' : 'Ask'}</span>
                </button>
              </form>

              {qaAnswer && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap mt-2">
                  <span className="font-semibold text-indigo-900 block mb-1">Answer:</span>
                  {qaAnswer}
                </div>
              )}
            </div>

            {/* Extracted Document Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Extracted Document Content
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {selectedDoc.extractedText?.length || 0} characters
                </span>
              </div>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                {selectedDoc.extractedText || 'No text extracted.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <FileText className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-xs">Select or upload a document to begin analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
};
