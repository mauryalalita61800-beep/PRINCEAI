import React, { useState, useEffect } from 'react';
import { Bot, Plus, Trash2, Copy, Send, Sparkles, MessageSquare, Check, Sliders } from 'lucide-react';
import { api } from '../../services/api';
import { ChatbotConfig, DocumentItem } from '../../types';

export const ChatbotBuilderPhase: React.FC = () => {
  const [chatbots, setChatbots] = useState<ChatbotConfig[]>([]);
  const [selectedBot, setSelectedBot] = useState<ChatbotConfig | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [previewMsg, setPreviewMsg] = useState('');
  const [chatThread, setChatThread] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [isSendingPreview, setIsSendingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [botRes, docRes] = await Promise.all([api.getChatbots(), api.getDocuments()]);
      setChatbots(botRes.chatbots || []);
      setDocuments(docRes.documents || []);
      if (botRes.chatbots && botRes.chatbots.length > 0) {
        selectBot(botRes.chatbots[0]);
      }
    } catch (err) {
      console.error('Failed to load chatbots', err);
    }
  };

  const selectBot = (bot: ChatbotConfig) => {
    setSelectedBot(bot);
    setChatThread([{ role: 'bot', text: bot.welcomeMessage }]);
  };

  const handleCreateNew = async () => {
    try {
      const res = await api.createChatbot({
        name: 'PrinceAI Specialist',
        description: 'Domain-trained AI assistant',
        avatar: '🤖',
        welcomeMessage: 'Greetings! How may I assist your engineering workflow today?',
        systemInstructions: 'You are an authoritative engineering and architecture advisor.',
        tone: 'Professional',
        language: 'English',
        style: 'Precise and analytical',
      });
      setChatbots([res.chatbot, ...chatbots]);
      selectBot(res.chatbot);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBot) return;
    setIsSaving(true);
    try {
      const res = await api.updateChatbot(selectedBot.id, selectedBot);
      setChatbots((prev) => prev.map((b) => (b.id === res.chatbot.id ? res.chatbot : b)));
      setSelectedBot(res.chatbot);
      alert('Chatbot configuration saved successfully.');
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedBot) return;
    try {
      const res = await api.duplicateChatbot(selectedBot.id);
      setChatbots([res.chatbot, ...chatbots]);
      selectBot(res.chatbot);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedBot || !confirm(`Delete chatbot "${selectedBot.name}"?`)) return;
    try {
      await api.deleteChatbot(selectedBot.id);
      const remaining = chatbots.filter((b) => b.id !== selectedBot.id);
      setChatbots(remaining);
      if (remaining.length > 0) {
        selectBot(remaining[0]);
      } else {
        setSelectedBot(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePreviewSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBot || !previewMsg.trim() || isSendingPreview) return;

    const userText = previewMsg.trim();
    setPreviewMsg('');
    setChatThread((prev) => [...prev, { role: 'user', text: userText }]);
    setIsSendingPreview(true);

    try {
      const res = await api.previewChatbot(selectedBot.id, userText);
      setChatThread((prev) => [...prev, { role: 'bot', text: res.reply }]);
    } catch (err: any) {
      setChatThread((prev) => [...prev, { role: 'bot', text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setIsSendingPreview(false);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Chatbots Roster */}
      <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200">
          <button
            id="btn-new-chatbot"
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Chatbot</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chatbots.map((bot) => {
            const isSelected = bot.id === selectedBot?.id;
            return (
              <div
                key={bot.id}
                onClick={() => selectBot(bot)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="text-base">{bot.avatar || '🤖'}</span>
                <div className="truncate flex-1">
                  <div className="truncate">{bot.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">{bot.tone}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Configuration Pane */}
      <div className="flex-1 border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-5">
        {selectedBot ? (
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Chatbot Parameters
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Bot Name</label>
                <input
                  type="text"
                  value={selectedBot.name}
                  onChange={(e) => setSelectedBot({ ...selectedBot, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Avatar Emoji</label>
                <input
                  type="text"
                  value={selectedBot.avatar}
                  onChange={(e) => setSelectedBot({ ...selectedBot, avatar: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tone of Voice</label>
                <select
                  value={selectedBot.tone}
                  onChange={(e) => setSelectedBot({ ...selectedBot, tone: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Technical">Technical</option>
                  <option value="Casual">Casual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Primary Language</label>
                <input
                  type="text"
                  value={selectedBot.language}
                  onChange={(e) => setSelectedBot({ ...selectedBot, language: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Welcome Greeting</label>
              <input
                type="text"
                value={selectedBot.welcomeMessage}
                onChange={(e) => setSelectedBot({ ...selectedBot, welcomeMessage: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                System Instructions & Personality Guardrails
              </label>
              <textarea
                rows={4}
                value={selectedBot.systemInstructions}
                onChange={(e) => setSelectedBot({ ...selectedBot, systemInstructions: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>

            {/* Document Grounding Linkage */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ground in Uploaded Documents ({selectedBot.documentIds?.length || 0} attached)
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                {documents.length === 0 ? (
                  <span className="text-[11px] text-slate-400">No workspace documents available.</span>
                ) : (
                  documents.map((doc) => {
                    const isChecked = selectedBot.documentIds?.includes(doc.id);
                    return (
                      <label key={doc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...(selectedBot.documentIds || []), doc.id]
                              : (selectedBot.documentIds || []).filter((id) => id !== doc.id);
                            setSelectedBot({ ...selectedBot, documentIds: newIds });
                          }}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="truncate">{doc.filename}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">Select or create a chatbot.</div>
        )}
      </div>

      {/* Live Preview Test Pane */}
      <div className="w-80 bg-slate-50/70 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 bg-white flex items-center gap-2">
          <span className="text-lg">{selectedBot?.avatar || '🤖'}</span>
          <div>
            <div className="text-xs font-bold text-slate-800">{selectedBot?.name || 'Preview'}</div>
            <div className="text-[10px] text-slate-400 font-medium">Interactive Sandbox</div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {chatThread.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white ml-auto rounded-br-xs'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {isSendingPreview && (
            <div className="text-[11px] text-slate-400 italic px-2">Thinking...</div>
          )}
        </div>

        {/* Preview Input */}
        <form onSubmit={handlePreviewSend} className="p-2 border-t border-slate-200 bg-white flex gap-1.5">
          <input
            type="text"
            placeholder="Test message..."
            value={previewMsg}
            onChange={(e) => setPreviewMsg(e.target.value)}
            disabled={!selectedBot || isSendingPreview}
            className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
          />
          <button
            type="submit"
            disabled={!previewMsg.trim() || isSendingPreview}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
