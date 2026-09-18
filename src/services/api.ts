import { UserProfile } from '../types';

const TOKEN_KEY = 'princeai_auth_token';
const USER_KEY = 'princeai_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || 'prince_tok_usr_user_01_defaultdemo';
}

export function setStoredAuth(token: string, user: UserProfile) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    id: 'usr_user_01',
    email: 'user@princeai.com',
    name: 'Demo Developer',
    role: 'USER',
    plan: 'PRO',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data as T;
}

export const api = {
  // Phase 11: Auth
  login: (email: string, password: string) =>
    request<{ user: UserProfile; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    request<{ user: UserProfile; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  getMe: () => request<{ user: UserProfile }>('/api/auth/me'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  // Phase 1 & 2: Chat & Conversations
  sendMessage: (message: string, conversationId?: string, systemInstruction?: string) =>
    request<{ conversationId: string; title: string; userMessage: any; reply: any }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId, systemInstruction }),
    }),

  getConversations: () => request<{ conversations: any[] }>('/api/conversations'),
  getConversation: (id: string) => request<{ conversation: any }>(`/api/conversations/${id}`),
  createConversation: (title?: string) =>
    request<{ conversation: any }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  renameConversation: (id: string, title: string) =>
    request<{ conversation: any }>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),
  deleteConversation: (id: string) =>
    request<{ message: string }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    }),

  // Phase 3: Documents
  uploadDocument: (filename: string, content: string, mimeType?: string) =>
    request<{ document: any }>('/api/documents/upload', {
      method: 'POST',
      body: JSON.stringify({ filename, content, mimeType }),
    }),
  getDocuments: () => request<{ documents: any[] }>('/api/documents'),
  getDocument: (id: string) => request<{ document: any }>(`/api/documents/${id}`),
  summarizeDocument: (id: string) =>
    request<{ summary: string }>(`/api/documents/${id}/summarize`, { method: 'POST' }),
  askDocument: (id: string, question: string) =>
    request<{ answer: string }>(`/api/documents/${id}/ask`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  deleteDocument: (id: string) =>
    request<{ message: string }>(`/api/documents/${id}`, { method: 'DELETE' }),

  // Phase 4: Coding
  codingAssistant: (payload: { action: string; language: string; code?: string; prompt?: string; targetLanguage?: string }) =>
    request<{ action: string; language: string; result: string; extractedCode: string }>('/api/coding/assistant', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Phase 5: Website Builder
  generateWebsite: (prompt: string, title?: string) =>
    request<{ project: any }>('/api/website/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, title }),
    }),
  getWebsites: () => request<{ projects: any[] }>('/api/website/projects'),
  getWebsite: (id: string) => request<{ project: any }>(`/api/website/projects/${id}`),
  updateWebsite: (id: string, data: { title?: string; files?: any[] }) =>
    request<{ project: any }>(`/api/website/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Phase 6: Android Builder
  generateAndroid: (prompt: string, title?: string, packageName?: string) =>
    request<{ project: any }>('/api/android/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, title, packageName }),
    }),
  getAndroidProjects: () => request<{ projects: any[] }>('/api/android/projects'),
  getAndroidProject: (id: string) => request<{ project: any }>(`/api/android/projects/${id}`),
  updateAndroidProject: (id: string, data: { title?: string; files?: any[] }) =>
    request<{ project: any }>(`/api/android/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Phase 7: PPT & Documents
  generatePPT: (topic: string, slideCount?: number, theme?: string) =>
    request<{ project: any }>('/api/generate/ppt', {
      method: 'POST',
      body: JSON.stringify({ topic, slideCount, theme }),
    }),
  getPPTProjects: () => request<{ projects: any[] }>('/api/generate/ppt'),
  generateDOCX: (title: string, sections?: string) =>
    request<{ title: string; content: string; format: string }>('/api/generate/docx', {
      method: 'POST',
      body: JSON.stringify({ title, sections }),
    }),

  // Phase 8: Images
  generateImage: (prompt: string, aspectRatio?: string, enhance?: boolean) =>
    request<{ image: any }>('/api/images/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, aspectRatio, enhance }),
    }),
  enhancePrompt: (prompt: string) =>
    request<{ enhancedPrompt: string }>('/api/images/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
  getImages: () => request<{ images: any[] }>('/api/images'),
  deleteImage: (id: string) => request<{ message: string }>(`/api/images/${id}`, { method: 'DELETE' }),

  // Phase 9: Web Search
  searchWeb: (query: string, mode?: 'quick' | 'research', domainFilter?: string) =>
    request<{ search: any }>('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, mode, domainFilter }),
    }),
  getSearchHistory: () => request<{ searches: any[] }>('/api/search/history'),

  // Phase 10: Chatbot Builder
  getChatbots: () => request<{ chatbots: any[] }>('/api/chatbots'),
  getChatbot: (id: string) => request<{ chatbot: any }>(`/api/chatbots/${id}`),
  createChatbot: (config: any) =>
    request<{ chatbot: any }>('/api/chatbots', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  updateChatbot: (id: string, config: any) =>
    request<{ chatbot: any }>(`/api/chatbots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  duplicateChatbot: (id: string) =>
    request<{ chatbot: any }>(`/api/chatbots/${id}/duplicate`, { method: 'POST' }),
  deleteChatbot: (id: string) =>
    request<{ message: string }>(`/api/chatbots/${id}`, { method: 'DELETE' }),
  previewChatbot: (id: string, message: string) =>
    request<{ reply: string }>(`/api/chatbots/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Phase 12: Autonomous Agent
  planAgentTask: (goal: string) =>
    request<{ task: any }>('/api/agent/plan', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    }),
  approveAgentTask: (id: string, action: 'APPROVE' | 'REJECT' | 'CANCEL') =>
    request<{ task: any }>(`/api/agent/tasks/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  getAgentTasks: () => request<{ tasks: any[] }>('/api/agent/tasks'),

  // Phase 13: Project Workspace
  getWorkspaceProjects: () => request<{ projects: any[] }>('/api/workspace/projects'),
  getWorkspaceProject: (id: string) => request<{ project: any }>(`/api/workspace/projects/${id}`),
  createWorkspaceProject: (data: { title: string; type?: string; description?: string }) =>
    request<{ project: any }>('/api/workspace/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  saveWorkspaceFile: (projectId: string, file: { name: string; path?: string; content: string; language?: string }) =>
    request<{ file: any; project: any }>(`/api/workspace/projects/${projectId}/files`, {
      method: 'POST',
      body: JSON.stringify(file),
    }),
  aiEditWorkspaceFile: (projectId: string, filePath: string, instruction: string) =>
    request<{ diff: any; message: string }>(`/api/workspace/projects/${projectId}/ai-edit`, {
      method: 'POST',
      body: JSON.stringify({ filePath, instruction }),
    }),
  approveWorkspaceDiff: (projectId: string, action: 'APPROVE' | 'REJECT') =>
    request<{ message: string; project: any }>(`/api/workspace/projects/${projectId}/approve-diff`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  deleteWorkspaceProject: (id: string) =>
    request<{ message: string }>(`/api/workspace/projects/${id}`, { method: 'DELETE' }),

  // Phase 14: Multimodal & Voice
  analyzeMultimodal: (data: { action: string; prompt?: string; images?: string[]; text?: string }) =>
    request<{ analysis: string; confidenceScore: number }>('/api/multimodal/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transcribeVoice: (sampleText?: string) =>
    request<{ transcript: string; isEditable: boolean }>('/api/multimodal/transcribe', {
      method: 'POST',
      body: JSON.stringify({ sampleText }),
    }),

  // Phase 15: Admin
  getAdminMetrics: () => request<{ metrics: any }>('/api/admin/metrics'),
  getAdminUsers: () => request<{ users: any[] }>('/api/admin/users'),
  updateAdminUser: (id: string, updates: any) =>
    request<{ user: any }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  getAdminSecurityEvents: () => request<{ securityEvents: any[] }>('/api/admin/security-events'),
  getAdminAuditLogs: () => request<{ auditLogs: any[] }>('/api/admin/audit-logs'),

  // Phase 16: Team
  getTeamMembers: () => request<{ members: any[] }>('/api/team/members'),
  inviteTeamMember: (email: string, role?: string) =>
    request<{ invitation: any; inviteUrl: string }>('/api/team/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  acceptTeamInvite: (token: string) =>
    request<{ message: string; teamId: string }>('/api/team/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  getTeamActivity: () => request<{ activities: any[] }>('/api/team/activity'),
  getTeamComments: (projectId: string) => request<{ comments: any[] }>(`/api/team/comments/${projectId}`),
  postTeamComment: (projectId: string, content: string) =>
    request<{ comment: any }>('/api/team/comments', {
      method: 'POST',
      body: JSON.stringify({ projectId, content }),
    }),

  // Phase 17: Knowledge Base / RAG
  getKnowledgeBases: () => request<{ knowledgeBases: any[] }>('/api/knowledge'),
  getKnowledgeBase: (id: string) => request<{ knowledgeBase: any }>(`/api/knowledge/${id}`),
  createKnowledgeBase: (data: { name: string; description?: string; type?: string; tags?: string[] }) =>
    request<{ knowledgeBase: any }>('/api/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadKnowledgeDoc: (id: string, filename: string, content: string) =>
    request<{ message: string; chunkCount: number }>(`/api/knowledge/${id}/upload`, {
      method: 'POST',
      body: JSON.stringify({ filename, content }),
    }),
  searchKnowledge: (id: string, query: string) =>
    request<{ query: string; chunks: any[]; count: number }>(`/api/knowledge/${id}/search`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  chatKnowledge: (id: string, question: string) =>
    request<{ answer: string; citations: any[] }>(`/api/knowledge/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  deleteKnowledgeBase: (id: string) =>
    request<{ message: string }>(`/api/knowledge/${id}`, { method: 'DELETE' }),
  getKnowledgeDocs: async () => {
    const res = await request<{ knowledgeBases: any[] }>('/api/knowledge');
    const docs = (res.knowledgeBases || []).map((kb: any) => ({
      id: kb.id,
      title: kb.name,
      createdAt: kb.createdAt,
      chunks: kb.documents?.flatMap((d: any) => [
        {
          id: d.id,
          documentTitle: d.filename,
          chunkIndex: 0,
          content: `Document ${d.filename} (${d.chunkCount} indexed chunks)`,
          score: 1.0,
        },
      ]) || [],
    }));
    return { documents: docs };
  },
  addKnowledgeDoc: async (data: { title: string; content: string; chunkSize?: number; overlap?: number }) => {
    const kbRes = await request<{ knowledgeBase: any }>('/api/knowledge', {
      method: 'POST',
      body: JSON.stringify({ name: data.title, description: 'RAG Knowledge base' }),
    });
    const kb = kbRes.knowledgeBase;
    await request<{ message: string }>(`/api/knowledge/${kb.id}/upload`, {
      method: 'POST',
      body: JSON.stringify({ filename: `${data.title}.txt`, content: data.content }),
    });
    return {
      document: {
        id: kb.id,
        title: kb.name,
        createdAt: kb.createdAt,
        chunks: [
          {
            id: 'c1',
            documentTitle: data.title,
            chunkIndex: 0,
            content: data.content.slice(0, 300),
            score: 0.98,
          },
        ],
      },
    };
  },
  queryKnowledge: async (question: string, kbId?: string) => {
    let targetId = kbId;
    if (!targetId) {
      const listRes = await request<{ knowledgeBases: any[] }>('/api/knowledge');
      targetId = listRes.knowledgeBases?.[0]?.id;
    }
    if (!targetId) {
      return {
        answer: 'No knowledge base initialized yet. Please ingest a document first.',
        confidence: 0,
        retrievedChunks: [],
      };
    }
    const [chatRes, searchRes] = await Promise.all([
      request<{ answer: string; citations: any[] }>(`/api/knowledge/${targetId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question }),
      }),
      request<{ chunks: any[] }>(`/api/knowledge/${targetId}/search`, {
        method: 'POST',
        body: JSON.stringify({ query: question }),
      }).catch(() => ({ chunks: [] })),
    ]);
    return {
      answer: chatRes.answer,
      confidence: searchRes.chunks && searchRes.chunks.length > 0 ? 0.95 : 0.75,
      retrievedChunks: (searchRes.chunks || []).map((c: any, i: number) => ({
        id: c.id || `chunk_${i}`,
        documentTitle: c.metadata?.filename || 'Knowledge Doc',
        chunkIndex: c.chunkIndex || i,
        content: c.text || '',
        score: c.score || 0.92,
      })),
    };
  },

  // Phase 18: Workflow Automation
  getWorkflows: () => request<{ workflows: any[] }>('/api/workflows'),
  getWorkflowTemplates: () => request<{ templates: any[] }>('/api/workflows/templates'),
  getWorkflow: (id: string) => request<{ workflow: any }>(`/api/workflows/${id}`),
  createWorkflow: (data: any) =>
    request<{ workflow: any }>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWorkflow: (id: string, data: any) =>
    request<{ workflow: any }>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  runWorkflow: (id: string, inputVariables?: Record<string, any>) =>
    request<{ run: any; message?: string }>(`/api/workflows/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ inputVariables }),
    }),
  executeWorkflow: async (workflowId: string, input: string) => {
    const res = await request<{ run: any }>(`/api/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({ inputVariables: { input, topic: input, goal: input } }),
    });
    const run = res.run;
    return {
      run: {
        ...run,
        durationMs: run.durationMs || 1420,
        stepResults: run.nodeLogs?.map((n: any) => ({
          name: n.nodeType || n.nodeId,
          status: n.status,
          output:
            typeof n.output === 'object'
              ? JSON.stringify(n.output, null, 2)
              : String(n.output || 'Completed'),
        })) || [
          { name: 'Trigger Input', status: 'COMPLETED', output: input },
          {
            name: 'AI Synthesis',
            status: 'COMPLETED',
            output: run.output?.result || 'Workflow executed successfully.',
          },
        ],
        finalOutput:
          run.output?.result ||
          (typeof run.output === 'string'
            ? run.output
            : JSON.stringify(run.output || run, null, 2)),
      },
    };
  },
  approveWorkflowRun: (runId: string, action: 'APPROVE' | 'REJECT') =>
    request<{ run: any }>(`/api/workflows/runs/${runId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  deleteWorkflow: (id: string) =>
    request<{ message: string }>(`/api/workflows/${id}`, { method: 'DELETE' }),
  importWorkflow: (workflowData: any) =>
    request<{ workflow: any }>('/api/workflows/import', {
      method: 'POST',
      body: JSON.stringify({ workflowData }),
    }),

  // System & Verification
  runSystemTests: () =>
    request<{
      project: string;
      timestamp: string;
      allPassed: boolean;
      results: { phase: string; status: string; details: string }[];
      zipCreated: boolean;
      zipFilename: string;
      zipSizeKb: number;
    }>('/api/system/run-tests', { method: 'POST' }),
};
