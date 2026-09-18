import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Conversation,
  DocumentRecord,
  WebsiteProject,
  AndroidProject,
  PPTProject,
  ImageRecord,
  SearchRecord,
  ChatbotConfig,
  AgentTask,
  WorkspaceProject,
  TeamMember,
  TeamInvitation,
  TeamActivity,
  TeamComment,
  KnowledgeBase,
  KnowledgeChunk,
  WorkflowDefinition,
  WorkflowRun,
  SecurityEvent,
  AuditLog,
} from './types';

interface DatabaseSchema {
  users: User[];
  conversations: Conversation[];
  documents: DocumentRecord[];
  websiteProjects: WebsiteProject[];
  androidProjects: AndroidProject[];
  pptProjects: PPTProject[];
  images: ImageRecord[];
  searches: SearchRecord[];
  chatbots: ChatbotConfig[];
  agentTasks: AgentTask[];
  workspaceProjects: WorkspaceProject[];
  teamMembers: TeamMember[];
  teamInvitations: TeamInvitation[];
  teamActivities: TeamActivity[];
  teamComments: TeamComment[];
  knowledgeBases: KnowledgeBase[];
  knowledgeChunks: KnowledgeChunk[];
  workflows: WorkflowDefinition[];
  workflowRuns: WorkflowRun[];
  securityEvents: SecurityEvent[];
  auditLogs: AuditLog[];
  stats: {
    totalAiRequests: number;
    totalTokensUsed: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'princeai_db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'prince_ai_salt_2026').digest('hex');
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse existing DB file, reinitializing', err);
      }
    }

    const defaultData: DatabaseSchema = {
      users: [
        {
          id: 'usr_admin_01',
          email: 'admin@princeai.com',
          name: 'Prince Administrator',
          passwordHash: hashPassword('Admin@123'),
          role: 'SUPER_ADMIN',
          plan: 'ADMIN',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PrinceAdmin',
        },
        {
          id: 'usr_user_01',
          email: 'user@princeai.com',
          name: 'Demo Developer',
          passwordHash: hashPassword('User@123'),
          role: 'USER',
          plan: 'PRO',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DemoUser',
        },
      ],
      conversations: [
        {
          id: 'conv_sample_01',
          userId: 'usr_user_01',
          title: 'Welcome to PrinceAI Platform',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: 'msg_01',
              role: 'assistant',
              content:
                'Hello! Welcome to PrinceAI, your full-stack unified GenAI workspace. You can chat, upload documents, build interactive web applications and Android apps, create presentation decks, run web research, build autonomous agents, manage knowledge bases, and orchestrate visual workflows.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
        },
      ],
      documents: [],
      websiteProjects: [],
      androidProjects: [],
      pptProjects: [],
      images: [],
      searches: [],
      chatbots: [
        {
          id: 'bot_support_01',
          userId: 'usr_user_01',
          name: 'Prince Knowledge Bot',
          description: 'Specialized enterprise assistant for docs and coding',
          avatar: '🤖',
          welcomeMessage: 'Hello! Ask me any questions about your documentation, codebases, or workflows.',
          systemInstructions: 'You are PrinceBot, a precise and concise technical assistant.',
          tone: 'Professional',
          language: 'English',
          style: 'Direct and code-first',
          includeWebSearch: true,
          documentIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      agentTasks: [],
      workspaceProjects: [],
      teamMembers: [
        {
          id: 'tm_01',
          teamId: 'team_default',
          userId: 'usr_admin_01',
          role: 'EDITOR',
          email: 'admin@princeai.com',
          name: 'Prince Administrator',
          joinedAt: new Date().toISOString(),
        },
        {
          id: 'tm_02',
          teamId: 'team_default',
          userId: 'usr_user_01',
          role: 'CONTRIBUTOR',
          email: 'user@princeai.com',
          name: 'Demo Developer',
          joinedAt: new Date().toISOString(),
        },
      ],
      teamInvitations: [],
      teamActivities: [
        {
          id: 'act_01',
          teamId: 'team_default',
          userId: 'usr_admin_01',
          userName: 'Prince Administrator',
          action: 'initialized',
          target: 'PrinceAI Core Workspace',
          timestamp: new Date().toISOString(),
        },
      ],
      teamComments: [],
      knowledgeBases: [
        {
          id: 'kb_demo_01',
          userId: 'usr_user_01',
          name: 'PrinceAI Platform Architecture',
          description: 'Technical specs, security policies, and API endpoints',
          type: 'PERSONAL',
          status: 'READY',
          tags: ['architecture', 'api', 'security'],
          documents: [
            {
              id: 'doc_kb_01',
              filename: 'PrinceAI_Architecture_Overview.md',
              size: 4096,
              chunkCount: 3,
              uploadedAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      knowledgeChunks: [
        {
          id: 'chk_01',
          documentId: 'doc_kb_01',
          chunkIndex: 1,
          text: 'PrinceAI Architecture consists of 18 cohesive phases starting from basic AI chat and conversation history to autonomous agents, multi-modal voice interaction, team RBAC, RAG knowledge indexing, and visual node workflow orchestration.',
          metadata: {
            filename: 'PrinceAI_Architecture_Overview.md',
            pageOrSection: 1,
          },
        },
        {
          id: 'chk_02',
          documentId: 'doc_kb_01',
          chunkIndex: 2,
          text: 'Security Model: PrinceAI strictly protects against Insecure Direct Object References (IDOR) by evaluating authorization and verified identity on all endpoints. Secret tokens and API keys are strictly retained on the backend and never exposed to the client.',
          metadata: {
            filename: 'PrinceAI_Architecture_Overview.md',
            pageOrSection: 2,
          },
        },
      ],
      workflows: [
        {
          id: 'wf_study_01',
          userId: 'usr_user_01',
          name: 'AI Study Assistant & Report Generator',
          description: 'Automated pipeline: Topic input -> Web Search -> Knowledge Search -> AI Synthesis -> Document Output',
          nodes: [
            { id: 'node_start', type: 'START', label: 'Start Flow', config: {}, position: { x: 50, y: 150 } },
            { id: 'node_input', type: 'INPUT', label: 'Study Topic Input', config: { variableName: 'topic', defaultValue: 'Quantum Computing Fundamentals' }, position: { x: 220, y: 150 } },
            { id: 'node_search', type: 'WEB_SEARCH', label: 'Web Research', config: { queryTemplate: 'Latest breakthroughs in {{topic}}' }, position: { x: 420, y: 150 } },
            { id: 'node_ai', type: 'AI_PROMPT', label: 'AI Synthesis', config: { promptTemplate: 'Summarize key findings on {{topic}} using retrieved context: {{search_results}}' }, position: { x: 620, y: 150 } },
            { id: 'node_doc', type: 'DOCUMENT_GENERATOR', label: 'Generate Document', config: { title: 'Study Report: {{topic}}', contentTemplate: '{{ai_response}}' }, position: { x: 820, y: 150 } },
            { id: 'node_end', type: 'END', label: 'Finish Workflow', config: {}, position: { x: 1020, y: 150 } },
          ],
          edges: [
            { id: 'e1', source: 'node_start', target: 'node_input' },
            { id: 'e2', source: 'node_input', target: 'node_search' },
            { id: 'e3', source: 'node_search', target: 'node_ai' },
            { id: 'e4', source: 'node_ai', target: 'node_doc' },
            { id: 'e5', source: 'node_doc', target: 'node_end' },
          ],
          variables: { topic: 'Quantum Computing Fundamentals' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      workflowRuns: [],
      securityEvents: [],
      auditLogs: [],
      stats: {
        totalAiRequests: 42,
        totalTokensUsed: 125000,
      },
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB to disk:', err);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }

  // --- Conversations (Phase 1 & 2) ---
  public getConversations(userId: string): Conversation[] {
    return this.data.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getConversation(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find((c) => c.id === id && c.userId === userId);
  }

  public createConversation(conv: Conversation): Conversation {
    this.data.conversations.unshift(conv);
    this.save();
    return conv;
  }

  public updateConversation(id: string, userId: string, updates: Partial<Conversation>): Conversation | undefined {
    const idx = this.data.conversations.findIndex((c) => c.id === id && c.userId === userId);
    if (idx === -1) return undefined;
    this.data.conversations[idx] = {
      ...this.data.conversations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.conversations[idx];
  }

  public deleteConversation(id: string, userId: string): boolean {
    const initialLen = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter((c) => !(c.id === id && c.userId === userId));
    const deleted = this.data.conversations.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // --- Documents (Phase 3) ---
  public getDocuments(userId: string): DocumentRecord[] {
    return this.data.documents.filter((d) => d.userId === userId);
  }

  public getDocument(id: string, userId: string): DocumentRecord | undefined {
    return this.data.documents.find((d) => d.id === id && d.userId === userId);
  }

  public saveDocument(doc: DocumentRecord): DocumentRecord {
    this.data.documents.unshift(doc);
    this.save();
    return doc;
  }

  public deleteDocument(id: string, userId: string): boolean {
    const initialLen = this.data.documents.length;
    this.data.documents = this.data.documents.filter((d) => !(d.id === id && d.userId === userId));
    const deleted = this.data.documents.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // --- Websites (Phase 5) ---
  public getWebsites(userId: string): WebsiteProject[] {
    return this.data.websiteProjects.filter((w) => w.userId === userId);
  }

  public getWebsite(id: string, userId: string): WebsiteProject | undefined {
    return this.data.websiteProjects.find((w) => w.id === id && w.userId === userId);
  }

  public saveWebsite(proj: WebsiteProject): WebsiteProject {
    const idx = this.data.websiteProjects.findIndex((w) => w.id === proj.id && w.userId === proj.userId);
    if (idx >= 0) {
      this.data.websiteProjects[idx] = proj;
    } else {
      this.data.websiteProjects.unshift(proj);
    }
    this.save();
    return proj;
  }

  // --- Android (Phase 6) ---
  public getAndroidProjects(userId: string): AndroidProject[] {
    return this.data.androidProjects.filter((a) => a.userId === userId);
  }

  public getAndroidProject(id: string, userId: string): AndroidProject | undefined {
    return this.data.androidProjects.find((a) => a.id === id && a.userId === userId);
  }

  public saveAndroidProject(proj: AndroidProject): AndroidProject {
    const idx = this.data.androidProjects.findIndex((a) => a.id === proj.id && a.userId === proj.userId);
    if (idx >= 0) {
      this.data.androidProjects[idx] = proj;
    } else {
      this.data.androidProjects.unshift(proj);
    }
    this.save();
    return proj;
  }

  // --- PPT & Docs (Phase 7) ---
  public getPPTProjects(userId: string): PPTProject[] {
    return this.data.pptProjects.filter((p) => p.userId === userId);
  }

  public getPPTProject(id: string, userId: string): PPTProject | undefined {
    return this.data.pptProjects.find((p) => p.id === id && p.userId === userId);
  }

  public savePPTProject(proj: PPTProject): PPTProject {
    this.data.pptProjects.unshift(proj);
    this.save();
    return proj;
  }

  // --- Images (Phase 8) ---
  public getImages(userId: string): ImageRecord[] {
    return this.data.images.filter((img) => img.userId === userId);
  }

  public saveImage(img: ImageRecord): ImageRecord {
    this.data.images.unshift(img);
    this.save();
    return img;
  }

  public deleteImage(id: string, userId: string): boolean {
    const init = this.data.images.length;
    this.data.images = this.data.images.filter((i) => !(i.id === id && i.userId === userId));
    const ok = this.data.images.length < init;
    if (ok) this.save();
    return ok;
  }

  // --- Searches (Phase 9) ---
  public getSearches(userId: string): SearchRecord[] {
    return this.data.searches.filter((s) => s.userId === userId);
  }

  public saveSearch(s: SearchRecord): SearchRecord {
    this.data.searches.unshift(s);
    this.save();
    return s;
  }

  // --- Chatbots (Phase 10) ---
  public getChatbots(userId: string): ChatbotConfig[] {
    return this.data.chatbots.filter((c) => c.userId === userId);
  }

  public getChatbot(id: string, userId?: string): ChatbotConfig | undefined {
    if (userId) {
      return this.data.chatbots.find((c) => c.id === id && c.userId === userId);
    }
    return this.data.chatbots.find((c) => c.id === id);
  }

  public saveChatbot(cb: ChatbotConfig): ChatbotConfig {
    const idx = this.data.chatbots.findIndex((c) => c.id === cb.id && c.userId === cb.userId);
    if (idx >= 0) {
      this.data.chatbots[idx] = cb;
    } else {
      this.data.chatbots.unshift(cb);
    }
    this.save();
    return cb;
  }

  public deleteChatbot(id: string, userId: string): boolean {
    const init = this.data.chatbots.length;
    this.data.chatbots = this.data.chatbots.filter((c) => !(c.id === id && c.userId === userId));
    const ok = this.data.chatbots.length < init;
    if (ok) this.save();
    return ok;
  }

  // --- Agent Tasks (Phase 12) ---
  public getAgentTasks(userId: string): AgentTask[] {
    return this.data.agentTasks.filter((t) => t.userId === userId);
  }

  public getAgentTask(id: string, userId: string): AgentTask | undefined {
    return this.data.agentTasks.find((t) => t.id === id && t.userId === userId);
  }

  public saveAgentTask(task: AgentTask): AgentTask {
    const idx = this.data.agentTasks.findIndex((t) => t.id === task.id && t.userId === task.userId);
    if (idx >= 0) {
      this.data.agentTasks[idx] = task;
    } else {
      this.data.agentTasks.unshift(task);
    }
    this.save();
    return task;
  }

  // --- Workspace Projects (Phase 13) ---
  public getWorkspaceProjects(userId: string): WorkspaceProject[] {
    return this.data.workspaceProjects.filter((p) => p.userId === userId);
  }

  public getWorkspaceProject(id: string, userId: string): WorkspaceProject | undefined {
    return this.data.workspaceProjects.find((p) => p.id === id && p.userId === userId);
  }

  public saveWorkspaceProject(proj: WorkspaceProject): WorkspaceProject {
    const idx = this.data.workspaceProjects.findIndex((p) => p.id === proj.id && p.userId === proj.userId);
    if (idx >= 0) {
      this.data.workspaceProjects[idx] = proj;
    } else {
      this.data.workspaceProjects.unshift(proj);
    }
    this.save();
    return proj;
  }

  public deleteWorkspaceProject(id: string, userId: string): boolean {
    const init = this.data.workspaceProjects.length;
    this.data.workspaceProjects = this.data.workspaceProjects.filter((p) => !(p.id === id && p.userId === userId));
    const ok = this.data.workspaceProjects.length < init;
    if (ok) this.save();
    return ok;
  }

  // --- Team (Phase 16) ---
  public getTeamMembers(teamId: string): TeamMember[] {
    return this.data.teamMembers.filter((m) => m.teamId === teamId);
  }

  public addTeamMember(member: TeamMember): TeamMember {
    this.data.teamMembers.push(member);
    this.save();
    return member;
  }

  public removeTeamMember(id: string): boolean {
    const init = this.data.teamMembers.length;
    this.data.teamMembers = this.data.teamMembers.filter((m) => m.id !== id);
    const ok = this.data.teamMembers.length < init;
    if (ok) this.save();
    return ok;
  }

  public getTeamInvitations(teamId: string): TeamInvitation[] {
    return this.data.teamInvitations.filter((i) => i.teamId === teamId);
  }

  public saveTeamInvitation(inv: TeamInvitation): TeamInvitation {
    this.data.teamInvitations.push(inv);
    this.save();
    return inv;
  }

  public findInvitationByToken(token: string): TeamInvitation | undefined {
    return this.data.teamInvitations.find((i) => i.token === token && i.status === 'PENDING');
  }

  public getTeamActivities(teamId: string): TeamActivity[] {
    return this.data.teamActivities
      .filter((a) => a.teamId === teamId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addTeamActivity(act: TeamActivity): TeamActivity {
    this.data.teamActivities.unshift(act);
    this.save();
    return act;
  }

  public getTeamComments(projectId: string): TeamComment[] {
    return this.data.teamComments
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addTeamComment(com: TeamComment): TeamComment {
    this.data.teamComments.push(com);
    this.save();
    return com;
  }

  // --- Knowledge Base / RAG (Phase 17) ---
  public getKnowledgeBases(userId: string): KnowledgeBase[] {
    return this.data.knowledgeBases.filter((k) => k.userId === userId);
  }

  public getKnowledgeBase(id: string, userId: string): KnowledgeBase | undefined {
    return this.data.knowledgeBases.find((k) => k.id === id && k.userId === userId);
  }

  public saveKnowledgeBase(kb: KnowledgeBase): KnowledgeBase {
    const idx = this.data.knowledgeBases.findIndex((k) => k.id === kb.id && k.userId === kb.userId);
    if (idx >= 0) {
      this.data.knowledgeBases[idx] = kb;
    } else {
      this.data.knowledgeBases.unshift(kb);
    }
    this.save();
    return kb;
  }

  public deleteKnowledgeBase(id: string, userId: string): boolean {
    const init = this.data.knowledgeBases.length;
    this.data.knowledgeBases = this.data.knowledgeBases.filter((k) => !(k.id === id && k.userId === userId));
    const ok = this.data.knowledgeBases.length < init;
    if (ok) {
      // also cleanup chunks
      this.save();
    }
    return ok;
  }

  public saveKnowledgeChunks(chunks: KnowledgeChunk[]) {
    this.data.knowledgeChunks.push(...chunks);
    this.save();
  }

  public searchKnowledgeChunks(query: string, documentIds: string[]): KnowledgeChunk[] {
    const qLower = query.toLowerCase();
    return this.data.knowledgeChunks
      .filter((c) => documentIds.includes(c.documentId))
      .filter((c) => {
        const words = qLower.split(/\s+/).filter(Boolean);
        return words.some((w) => c.text.toLowerCase().includes(w));
      })
      .slice(0, 5);
  }

  // --- Workflows (Phase 18) ---
  public getWorkflows(userId: string): WorkflowDefinition[] {
    return this.data.workflows.filter((w) => w.userId === userId);
  }

  public getWorkflow(id: string, userId: string): WorkflowDefinition | undefined {
    return this.data.workflows.find((w) => w.id === id && w.userId === userId);
  }

  public saveWorkflow(wf: WorkflowDefinition): WorkflowDefinition {
    const idx = this.data.workflows.findIndex((w) => w.id === wf.id && w.userId === wf.userId);
    if (idx >= 0) {
      this.data.workflows[idx] = wf;
    } else {
      this.data.workflows.unshift(wf);
    }
    this.save();
    return wf;
  }

  public deleteWorkflow(id: string, userId: string): boolean {
    const init = this.data.workflows.length;
    this.data.workflows = this.data.workflows.filter((w) => !(w.id === id && w.userId === userId));
    const ok = this.data.workflows.length < init;
    if (ok) this.save();
    return ok;
  }

  public getWorkflowRuns(userId: string, workflowId?: string): WorkflowRun[] {
    return this.data.workflowRuns
      .filter((r) => r.userId === userId && (!workflowId || r.workflowId === workflowId))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public getWorkflowRun(id: string, userId: string): WorkflowRun | undefined {
    return this.data.workflowRuns.find((r) => r.id === id && r.userId === userId);
  }

  public saveWorkflowRun(run: WorkflowRun): WorkflowRun {
    const idx = this.data.workflowRuns.findIndex((r) => r.id === run.id && r.userId === run.userId);
    if (idx >= 0) {
      this.data.workflowRuns[idx] = run;
    } else {
      this.data.workflowRuns.unshift(run);
    }
    this.save();
    return run;
  }

  // --- Security & Audit ---
  public logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>) {
    const entry: SecurityEvent = {
      ...event,
      id: 'sec_' + crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.data.securityEvents.unshift(entry);
    if (this.data.securityEvents.length > 500) {
      this.data.securityEvents.pop();
    }
    this.save();
  }

  public getSecurityEvents(): SecurityEvent[] {
    return this.data.securityEvents;
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      ...log,
      id: 'aud_' + crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public getStats() {
    return {
      totalUsers: this.data.users.length,
      totalConversations: this.data.conversations.length,
      totalDocuments: this.data.documents.length,
      totalProjects:
        this.data.websiteProjects.length +
        this.data.androidProjects.length +
        this.data.pptProjects.length +
        this.data.workspaceProjects.length,
      totalWorkflows: this.data.workflows.length,
      totalWorkflowRuns: this.data.workflowRuns.length,
      totalSecurityEvents: this.data.securityEvents.length,
      totalAiRequests: this.data.stats.totalAiRequests,
    };
  }

  public incrementAiRequests() {
    this.data.stats.totalAiRequests += 1;
    this.save();
  }
}

export const db = new Database();
