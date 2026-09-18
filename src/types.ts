export type PhaseKey =
  | 'chat'
  | 'documents'
  | 'coding'
  | 'website'
  | 'android'
  | 'ppt'
  | 'images'
  | 'image'
  | 'search'
  | 'chatbots'
  | 'chatbot'
  | 'auth'
  | 'agent'
  | 'workspace'
  | 'multimodal'
  | 'admin'
  | 'team'
  | 'knowledge'
  | 'workflows'
  | 'workflow';

export type PhaseType = PhaseKey;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: 'FREE' | 'PRO' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  avatar?: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }[];
}

export interface DocumentItem {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  summary?: string;
  createdAt: string;
  snippet?: string;
  extractedText?: string;
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface WebsiteProject {
  id: string;
  title: string;
  description: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface AndroidProject {
  id: string;
  title: string;
  packageName: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface SlideItem {
  id: number;
  title: string;
  bullets: string[];
  notes?: string;
}

export interface PPTProject {
  id: string;
  title: string;
  topic: string;
  theme: string;
  slides: SlideItem[];
  createdAt: string;
}

export interface ImageItem {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  aspectRatio: string;
  createdAt: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  citationId: number;
}

export interface SearchRecord {
  id: string;
  query: string;
  mode: 'quick' | 'research';
  results: SearchResultItem[];
  report: string;
  citations: string[];
  createdAt: string;
}

export interface ChatbotConfig {
  id: string;
  name: string;
  description: string;
  avatar: string;
  welcomeMessage: string;
  systemInstructions: string;
  tone: 'Professional' | 'Friendly' | 'Technical' | 'Casual';
  language: string;
  style: string;
  includeWebSearch: boolean;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentStep {
  id: string;
  tool: string;
  description: string;
  input: any;
  status: 'PENDING' | 'WAITING_APPROVAL' | 'EXECUTING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  output?: string;
  error?: string;
}

export interface AgentTask {
  id: string;
  goal: string;
  plan: AgentStep[];
  status: 'PLANNING' | 'WAITING_APPROVAL' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  finalResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceProject {
  id: string;
  title: string;
  type: string;
  description: string;
  files: ProjectFile[];
  pendingDiff?: {
    file: string;
    original: string;
    modified: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  role: 'VIEWER' | 'EDITOR' | 'CONTRIBUTOR';
  email: string;
  name: string;
  joinedAt: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  type: 'PERSONAL' | 'PROJECT' | 'TEAM';
  status: 'PROCESSING' | 'READY' | 'FAILED';
  tags: string[];
  documents: {
    id: string;
    filename: string;
    size: number;
    chunkCount: number;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  score: number;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  content?: string;
  chunks?: KnowledgeChunk[];
  createdAt: string;
}

export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  steps: {
    id: string;
    name: string;
    type: string;
    prompt?: string;
    config?: any;
  }[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_APPROVAL' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  currentStepIndex?: number;
  stepResults?: {
    name: string;
    status: string;
    output: string;
  }[];
  finalOutput?: string;
  nodeLogs?: {
    nodeId: string;
    nodeType: string;
    status: string;
    output?: any;
    error?: string;
    timestamp: string;
  }[];
  variables?: Record<string, any>;
  output?: any;
  error?: string;
  pendingApprovalNodeId?: string;
}
