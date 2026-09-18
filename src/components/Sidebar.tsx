import React from 'react';
import {
  MessageSquare,
  FileText,
  Code2,
  Globe,
  Smartphone,
  Presentation,
  Image,
  Search,
  Bot,
  Shield,
  BotMessageSquare,
  Briefcase,
  Mic,
  Settings,
  Users,
  Database,
  GitFork,
  ChevronRight,
} from 'lucide-react';
import { PhaseKey } from '../types';

interface SidebarProps {
  activePhase: PhaseKey;
  onSelectPhase: (phase: PhaseKey) => void;
}

interface NavItem {
  key: PhaseKey;
  label: string;
  phaseNum: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePhase, onSelectPhase }) => {
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Conversational & Search',
      items: [
        { key: 'chat', label: 'AI Chat & Sessions', phaseNum: 'Phase 1 & 2', icon: MessageSquare },
        { key: 'multimodal', label: 'Multimodal & Voice', phaseNum: 'Phase 14', icon: Mic },
        { key: 'search', label: 'Grounded Web Search', phaseNum: 'Phase 9', icon: Search },
      ],
    },
    {
      title: 'Studio & Builders',
      items: [
        { key: 'documents', label: 'Document Intelligence', phaseNum: 'Phase 3', icon: FileText },
        { key: 'coding', label: 'AI Coding Assistant', phaseNum: 'Phase 4', icon: Code2 },
        { key: 'website', label: 'Website Builder', phaseNum: 'Phase 5', icon: Globe },
        { key: 'android', label: 'Android App Builder', phaseNum: 'Phase 6', icon: Smartphone },
        { key: 'ppt', label: 'PPT & Deck Studio', phaseNum: 'Phase 7', icon: Presentation },
        { key: 'images', label: 'Image Studio', phaseNum: 'Phase 8', icon: Image },
      ],
    },
    {
      title: 'Autonomous & Workflows',
      items: [
        { key: 'agent', label: 'Autonomous AI Agent', phaseNum: 'Phase 12', icon: BotMessageSquare, badge: 'Agentic' },
        { key: 'workflows', label: 'Workflow Automation', phaseNum: 'Phase 18', icon: GitFork, badge: 'Visual' },
        { key: 'chatbots', label: 'Chatbot Builder', phaseNum: 'Phase 10', icon: Bot },
        { key: 'knowledge', label: 'Knowledge Base / RAG', phaseNum: 'Phase 17', icon: Database },
      ],
    },
    {
      title: 'Enterprise & Security',
      items: [
        { key: 'workspace', label: 'Project Workspace', phaseNum: 'Phase 13', icon: Briefcase },
        { key: 'team', label: 'Team Collaboration', phaseNum: 'Phase 16', icon: Users },
        { key: 'admin', label: 'Admin Dashboard', phaseNum: 'Phase 15', icon: Settings },
        { key: 'auth', label: 'Authentication & RBAC', phaseNum: 'Phase 11', icon: Shield },
      ],
    },
  ];

  return (
    <aside id="princeai-sidebar" className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col h-[calc(100vh-4rem)] select-none">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePhase === item.key;
                return (
                  <button
                    key={item.key}
                    id={`sidebar-nav-${item.key}`}
                    onClick={() => onSelectPhase(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono px-1 rounded ${
                          isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-500'
                        }`}
                      >
                        {item.phaseNum.replace('Phase ', 'P')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Status Pill */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-slate-700">All 18 Engines Ready</span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-500">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
