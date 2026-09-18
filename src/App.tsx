import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatPhase } from './components/phases/ChatPhase';
import { DocumentsPhase } from './components/phases/DocumentsPhase';
import { CodingPhase } from './components/phases/CodingPhase';
import { WebsiteBuilderPhase } from './components/phases/WebsiteBuilderPhase';
import { AndroidBuilderPhase } from './components/phases/AndroidBuilderPhase';
import { PPTPhase } from './components/phases/PPTPhase';
import { ImageStudioPhase } from './components/phases/ImageStudioPhase';
import { WebSearchPhase } from './components/phases/WebSearchPhase';
import { ChatbotBuilderPhase } from './components/phases/ChatbotBuilderPhase';
import { AgentPhase } from './components/phases/AgentPhase';
import { WorkspacePhase } from './components/phases/WorkspacePhase';
import { MultimodalPhase } from './components/phases/MultimodalPhase';
import { AdminPhase } from './components/phases/AdminPhase';
import { TeamPhase } from './components/phases/TeamPhase';
import { KnowledgePhase } from './components/phases/KnowledgePhase';
import { WorkflowPhase } from './components/phases/WorkflowPhase';
import { SystemTestModal } from './components/SystemTestModal';
import { PhaseType } from './types';

export const App: React.FC = () => {
  const [activePhase, setActivePhase] = useState<PhaseType>('chat');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const renderActivePhase = () => {
    switch (activePhase) {
      case 'chat':
        return <ChatPhase />;
      case 'documents':
        return <DocumentsPhase />;
      case 'coding':
        return <CodingPhase />;
      case 'website':
        return <WebsiteBuilderPhase />;
      case 'android':
        return <AndroidBuilderPhase />;
      case 'ppt':
        return <PPTPhase />;
      case 'image':
        return <ImageStudioPhase />;
      case 'search':
        return <WebSearchPhase />;
      case 'chatbot':
        return <ChatbotBuilderPhase />;
      case 'agent':
        return <AgentPhase />;
      case 'workspace':
        return <WorkspacePhase />;
      case 'multimodal':
        return <MultimodalPhase />;
      case 'admin':
        return <AdminPhase />;
      case 'team':
        return <TeamPhase />;
      case 'knowledge':
        return <KnowledgePhase />;
      case 'workflow':
        return <WorkflowPhase />;
      default:
        return <ChatPhase />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activePhase={activePhase} onSelectPhase={setActivePhase} />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activePhase={activePhase}
          onOpenSystemTest={() => setIsTestModalOpen(true)}
        />

        {/* Phase Canvas */}
        <main className="flex-1 p-3.5 overflow-hidden">
          {renderActivePhase()}
        </main>
      </div>

      {/* System Test & ZIP Delivery Modal */}
      <SystemTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};

export default App;
