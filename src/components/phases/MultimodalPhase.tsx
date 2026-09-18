import React, { useState } from 'react';
import { Mic, Volume2, Image, FileSearch, Play, Pause, Square, Sparkles, Check } from 'lucide-react';
import { api } from '../../services/api';

export const MultimodalPhase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vision' | 'voice'>('vision');
  const [ocrText, setOcrText] = useState('PrinceAI Enterprise Edition\nRelease 1.0.0\nAuthentication: JWT RBAC\nArchitecture: Node.js Express + React 18');
  const [visionPrompt, setVisionPrompt] = useState('Extract all tabular parameters and evaluate architectural safety');
  const [visionAnalysis, setVisionAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('Build an enterprise RAG knowledge base with strict citation grounding');
  const [ttsStatus, setTtsStatus] = useState<'IDLE' | 'PLAYING' | 'PAUSED'>('IDLE');

  const handleRunVision = async (action: 'ocr' | 'describe' | 'compare') => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeMultimodal({
        action,
        prompt: visionPrompt,
        text: ocrText,
      });
      setVisionAnalysis(res.analysis);
    } catch (err: any) {
      setVisionAnalysis(`⚠️ Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSimulateVoiceInput = async () => {
    setIsRecording(true);
    setTimeout(async () => {
      try {
        const res = await api.transcribeVoice('Create a visual workflow connecting web search to executive document generator');
        setTranscript(res.transcript);
      } catch (err: any) {
        console.error('Transcription error', err);
      } finally {
        setIsRecording(false);
      }
    }, 1200);
  };

  const handleTTS = (action: 'PLAY' | 'PAUSE' | 'RESUME' | 'STOP') => {
    if (action === 'PLAY') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(transcript);
        utterance.onend = () => setTtsStatus('IDLE');
        window.speechSynthesis.speak(utterance);
      }
      setTtsStatus('PLAYING');
    } else if (action === 'PAUSE') {
      if ('speechSynthesis' in window) window.speechSynthesis.pause();
      setTtsStatus('PAUSED');
    } else if (action === 'RESUME') {
      if ('speechSynthesis' in window) window.speechSynthesis.resume();
      setTtsStatus('PLAYING');
    } else if (action === 'STOP') {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setTtsStatus('IDLE');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">Multimodal AI Studio</h2>
            <p className="text-[11px] text-slate-500">Computer Vision, OCR, Voice Input & Audio Synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'vision' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vision & OCR
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'voice' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Voice & Audio
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        {activeTab === 'vision' ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-200/70 space-y-3">
              <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wider flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-violet-600" />
                <span>Optical Character Recognition (OCR) & Document Vision</span>
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Simulated Image / Raw Document OCR Scan (Untrusted Input Sanitized)
                </label>
                <textarea
                  rows={4}
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Inquiry / Task</label>
                <input
                  type="text"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleRunVision('ocr')}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? 'Processing...' : 'Run OCR Extraction'}
                </button>
                <button
                  onClick={() => handleRunVision('describe')}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Analyze Visual Layout
                </button>
                <button
                  onClick={() => handleRunVision('compare')}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Compare Elements
                </button>
              </div>
            </div>

            {visionAnalysis && (
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Multimodal Analysis Output</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {visionAnalysis}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Voice Recording */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Voice Dictation (Microphone Opt-in)</h3>
                  <p className="text-xs text-slate-500">
                    Audio is strictly captured on explicit user command. Never runs in background.
                  </p>
                </div>

                <button
                  onClick={handleSimulateVoiceInput}
                  disabled={isRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>{isRecording ? 'Listening...' : 'Push to Speak'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Editable Transcript Buffer</label>
                <textarea
                  rows={3}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Text-to-Speech */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Text-to-Speech Playback Controls</span>
                  </h3>
                  <p className="text-xs text-slate-500">Synthesizes the transcript buffer with playback state.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTTS(ttsStatus === 'PAUSED' ? 'RESUME' : 'PLAY')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{ttsStatus === 'PAUSED' ? 'Resume' : 'Play Audio'}</span>
                  </button>
                  <button
                    onClick={() => handleTTS('PAUSE')}
                    disabled={ttsStatus !== 'PLAYING'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium disabled:opacity-40"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={() => handleTTS('STOP')}
                    disabled={ttsStatus === 'IDLE'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium disabled:opacity-40"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                <span>Status: <strong className="text-slate-800">{ttsStatus}</strong></span>
                <span>Voice: Standard Natural</span>
                <span>Speed: 1.0x</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
