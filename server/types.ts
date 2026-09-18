export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type UsagePlan = 'FREE' | 'PRO' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  plan: UsagePlan;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  avatar?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  extractedText: string;
  summary?: string;
  createdAt: string;
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface WebsiteProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  files: ProjectFile[];
  createdAt: string;
  updatedAt: string;
}

export interface AndroidProject {
  id: string;
  userId: string;
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
  userId: string;
  title: string;
  topic: string;
  theme: string;
  slides: SlideItem[];
  createdAt: string;
}

export interface ImageRecord {
  id: string;
  userId: string;
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
  userId: string;
  query: string;
  mode: 'quick' | 'research';
  results: SearchResultItem[];
  report: string;
  citations: string[];
  createdAt: string;
}

export interface ChatbotConfig {
  id: string;
  userId: string;
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
  userId: string;
  goal: string;
  plan: AgentStep[];
  status: 'PLANNING' | 'WAITING_APPROVAL' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  finalResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceProject {
  id: string;
  userId: string;
  title: string;
  type: 'website' | 'android' | 'ppt' | 'document' | 'image' | 'chatbot' | 'agent_task';
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
  teamId: string;
  userId: string;
  role: 'VIEWER' | 'EDITOR' | 'CONTRIBUTOR';
  email: string;
  name: string;
  joinedAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  token: string;
  role: 'VIEWER' | 'EDITOR' | 'CONTRIBUTOR';
  invitedEmail: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface TeamComment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  metadata: {
    filename: string;
    pageOrSection: number;
  };
}

export interface KnowledgeBase {
  id: string;
  userId: string;
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

export type WorkflowNodeType =
  | 'START'
  | 'INPUT'
  | 'AI_PROMPT'
  | 'KNOWLEDGE_SEARCH'
  | 'WEB_SEARCH'
  | 'AI_AGENT'
  | 'CONDITION'
  | 'TEXT_TRANSFORM'
  | 'CODE_GENERATOR'
  | 'DOCUMENT_GENERATOR'
  | 'PPT_GENERATOR'
  | 'IMAGE_GENERATOR'
  | 'APPROVAL'
  | 'OUTPUT'
  | 'END';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  conditionValue?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  userId: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_APPROVAL' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  trigger: 'MANUAL' | 'SCHEDULE' | 'API';
  currentStepIndex: number;
  nodeLogs: {
    nodeId: string;
    nodeType: string;
    status: string;
    output?: any;
    error?: string;
    timestamp: string;
  }[];
  variables: Record<string, any>;
  output?: any;
  error?: string;
  pendingApprovalNodeId?: string;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  ip: string;
  eventType: 'LOGIN_FAIL' | 'IDOR_ATTEMPT' | 'PATH_TRAVERSAL_BLOCKED' | 'PROMPT_INJECTION_FLAGGED' | 'ROLE_UNAUTHORIZED';
  details: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
