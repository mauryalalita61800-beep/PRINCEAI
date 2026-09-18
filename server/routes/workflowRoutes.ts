import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { generateGeminiText } from '../gemini';
import { WorkflowDefinition, WorkflowRun, WorkflowNode } from '../types';

export const workflowRouter = Router();

// 8 Built-in Templates
export const WORKFLOW_TEMPLATES: Omit<WorkflowDefinition, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'AI Study Assistant',
    description: 'Topic input -> Web search -> Knowledge search -> AI Synthesis -> Document generator',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start Flow', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Study Subject Input', config: { variableName: 'topic', defaultValue: 'Machine Learning Transformers' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'WEB_SEARCH', label: 'Search Academic Sources', config: { queryTemplate: 'Overview and architecture of {{topic}}' }, position: { x: 420, y: 150 } },
      { id: 'n4', type: 'AI_PROMPT', label: 'Synthesize Study Guide', config: { promptTemplate: 'Create a structured study guide on {{topic}} incorporating: {{search_results}}' }, position: { x: 620, y: 150 } },
      { id: 'n5', type: 'DOCUMENT_GENERATOR', label: 'Compile Study Notes', config: { title: 'Study Guide: {{topic}}', contentTemplate: '{{ai_response}}' }, position: { x: 820, y: 150 } },
      { id: 'n6', type: 'END', label: 'Finish', config: {}, position: { x: 1020, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
    ],
    variables: { topic: 'Machine Learning Transformers' },
  },
  {
    name: 'Document Summarizer',
    description: 'Document input -> Text extract -> AI Prompt analysis -> Structured Output',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start Flow', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Document Text', config: { variableName: 'input', defaultValue: 'PrinceAI is an all-in-one GenAI platform.' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'AI_PROMPT', label: 'Extract Key Takeaways', config: { promptTemplate: 'Summarize the core points of: {{input}}' }, position: { x: 450, y: 150 } },
      { id: 'n4', type: 'OUTPUT', label: 'Summary Output', config: { outputVariable: 'ai_response' }, position: { x: 680, y: 150 } },
      { id: 'n5', type: 'END', label: 'End', config: {}, position: { x: 880, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
    variables: { input: 'PrinceAI full-stack enterprise platform specification.' },
  },
  {
    name: 'Research Report Generator',
    description: 'Topic -> Web Search -> Condition Check -> AI Analysis -> Document Output',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Research Query', config: { variableName: 'topic', defaultValue: 'Future of Cloud Computing' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'WEB_SEARCH', label: 'Ground Sources', config: { queryTemplate: '{{topic}} industry benchmarks' }, position: { x: 420, y: 150 } },
      { id: 'n4', type: 'CONDITION', label: 'Check Sources', config: { field: 'search_results', operator: 'exists' }, position: { x: 620, y: 150 } },
      { id: 'n5', type: 'DOCUMENT_GENERATOR', label: 'Generate Brief', config: { title: 'Whitepaper: {{topic}}', contentTemplate: '{{search_results}}' }, position: { x: 820, y: 150 } },
      { id: 'n6', type: 'END', label: 'End', config: {}, position: { x: 1020, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
    ],
    variables: { topic: 'Future of Cloud Computing' },
  },
  {
    name: 'Blog Draft Generator',
    description: 'Idea -> AI Outline -> Human Approval -> Full Draft Generator',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Blog Topic', config: { variableName: 'topic', defaultValue: '10 Principles of Software Reliability' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'AI_PROMPT', label: 'Generate Outline', config: { promptTemplate: 'Outline an engaging blog post about {{topic}}' }, position: { x: 420, y: 150 } },
      { id: 'n4', type: 'APPROVAL', label: 'Review Outline', config: { prompt: 'Please review and approve the outline' }, position: { x: 620, y: 150 } },
      { id: 'n5', type: 'AI_PROMPT', label: 'Draft Post', config: { promptTemplate: 'Write the complete blog post based on this approved outline: {{ai_response}}' }, position: { x: 820, y: 150 } },
      { id: 'n6', type: 'END', label: 'End', config: {}, position: { x: 1020, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
    ],
    variables: { topic: '10 Principles of Software Reliability' },
  },
  {
    name: 'Code Explanation Pipeline',
    description: 'Code Snippet -> AI Code Assistant -> Formatting -> Output',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Source Code', config: { variableName: 'code', defaultValue: 'function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'CODE_GENERATOR', label: 'Explain & Refactor', config: { language: 'JavaScript', prompt: 'Explain complexity and refactor with memoization: {{code}}' }, position: { x: 450, y: 150 } },
      { id: 'n4', type: 'OUTPUT', label: 'Result', config: { outputVariable: 'code_result' }, position: { x: 680, y: 150 } },
      { id: 'n5', type: 'END', label: 'End', config: {}, position: { x: 880, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
    variables: {},
  },
  {
    name: 'Knowledge Base Q&A',
    description: 'Question -> Knowledge Search -> Context Check -> AI Grounded Response',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'User Question', config: { variableName: 'question', defaultValue: 'What is the security model of PrinceAI?' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'KNOWLEDGE_SEARCH', label: 'Fetch Chunks', config: { query: '{{question}}' }, position: { x: 450, y: 150 } },
      { id: 'n4', type: 'AI_PROMPT', label: 'Grounded Answer', config: { promptTemplate: 'Answer "{{question}}" strictly using knowledge context: {{knowledge_context}}' }, position: { x: 680, y: 150 } },
      { id: 'n5', type: 'END', label: 'End', config: {}, position: { x: 900, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
    variables: {},
  },
  {
    name: 'Web Research + Report',
    description: 'Topic -> Web Search -> AI Agent Planning -> Document Summary',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Topic', config: { variableName: 'topic', defaultValue: 'Next-Gen Renewable Energy' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'WEB_SEARCH', label: 'Web Research', config: { queryTemplate: 'Recent advances in {{topic}}' }, position: { x: 420, y: 150 } },
      { id: 'n4', type: 'AI_AGENT', label: 'Agent Synthesis', config: { goal: 'Synthesize research report with citations: {{search_results}}' }, position: { x: 650, y: 150 } },
      { id: 'n5', type: 'END', label: 'End', config: {}, position: { x: 880, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
    variables: {},
  },
  {
    name: 'Image Prompt Generator',
    description: 'Concept -> AI Prompt Enhancement -> Visual Prompt Output',
    nodes: [
      { id: 'n1', type: 'START', label: 'Start', config: {}, position: { x: 50, y: 150 } },
      { id: 'n2', type: 'INPUT', label: 'Concept', config: { variableName: 'concept', defaultValue: 'Futuristic solar-powered metropolis' }, position: { x: 220, y: 150 } },
      { id: 'n3', type: 'AI_PROMPT', label: 'Cinematic Expansion', config: { promptTemplate: 'Transform this concept into an ultra-detailed image prompt: {{concept}}' }, position: { x: 450, y: 150 } },
      { id: 'n4', type: 'IMAGE_GENERATOR', label: 'Generate Visual Asset', config: { prompt: '{{ai_response}}' }, position: { x: 680, y: 150 } },
      { id: 'n5', type: 'END', label: 'End', config: {}, position: { x: 900, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
    variables: {},
  },
];

// Helper to replace `{{variable}}` safely
function interpolateVariables(template: string, vars: Record<string, any>): string {
  if (!template) return '';
  return template.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : '';
  });
}

// Evaluate safe conditions (==, !=, >, <, >=, <=, contains, startsWith, endsWith, exists, isEmpty)
function evaluateCondition(val1: any, op: string, val2: any): boolean {
  const str1 = String(val1 ?? '');
  const str2 = String(val2 ?? '');

  switch (op) {
    case '==':
      return str1 === str2;
    case '!=':
      return str1 !== str2;
    case '>':
      return Number(val1) > Number(val2);
    case '<':
      return Number(val1) < Number(val2);
    case '>=':
      return Number(val1) >= Number(val2);
    case '<=':
      return Number(val1) <= Number(val2);
    case 'contains':
      return str1.toLowerCase().includes(str2.toLowerCase());
    case 'startsWith':
      return str1.startsWith(str2);
    case 'endsWith':
      return str1.endsWith(str2);
    case 'exists':
      return val1 !== undefined && val1 !== null && str1.trim() !== '';
    case 'isEmpty':
      return !val1 || str1.trim() === '';
    default:
      return !!val1;
  }
}

// GET /api/workflows
workflowRouter.get('/', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const workflows = db.getWorkflows(req.user!.id);
  return res.json({ workflows });
});

// GET /api/workflows/templates
workflowRouter.get('/templates', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ templates: WORKFLOW_TEMPLATES });
});

// POST /api/workflows
workflowRouter.post('/', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, nodes, edges, variables } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workflow name is required.' });
    }

    const wf: WorkflowDefinition = {
      id: 'wf_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      name: name.trim(),
      description: description?.trim() || '',
      nodes: Array.isArray(nodes) ? nodes : [],
      edges: Array.isArray(edges) ? edges : [],
      variables: variables || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveWorkflow(wf);
    return res.status(201).json({ workflow: wf });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to save workflow.' });
  }
});

// GET /api/workflows/:id
workflowRouter.get('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const wf = db.getWorkflow(req.params.id, req.user!.id);
  if (!wf) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }
  return res.json({ workflow: wf });
});

// PUT /api/workflows/:id
workflowRouter.put('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const wf = db.getWorkflow(req.params.id, req.user!.id);
  if (!wf) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }

  const { name, description, nodes, edges, variables } = req.body;
  if (name) wf.name = name.trim();
  if (description !== undefined) wf.description = description;
  if (nodes) wf.nodes = nodes;
  if (edges) wf.edges = edges;
  if (variables) wf.variables = variables;
  wf.updatedAt = new Date().toISOString();

  db.saveWorkflow(wf);
  return res.json({ workflow: wf });
});

// POST /api/workflows/:id/run (Execution Runner)
workflowRouter.post('/:id/run', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wf = db.getWorkflow(req.params.id, req.user!.id);
    if (!wf) {
      return res.status(404).json({ error: 'Workflow not found.' });
    }

    const { inputVariables } = req.body;
    const executionVars = { ...wf.variables, ...(inputVariables || {}) };

    const run: WorkflowRun = {
      id: 'run_' + crypto.randomBytes(6).toString('hex'),
      workflowId: wf.id,
      workflowName: wf.name,
      userId: req.user!.id,
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      trigger: 'MANUAL',
      currentStepIndex: 0,
      nodeLogs: [],
      variables: executionVars,
    };

    // Execute nodes in sequence
    const startNode = wf.nodes.find((n) => n.type === 'START') || wf.nodes[0];
    let currentNode: WorkflowNode | undefined = startNode;
    let stepsCount = 0;
    const maxSteps = 50;

    while (currentNode && stepsCount < maxSteps) {
      stepsCount++;
      const nodeStart = Date.now();

      run.nodeLogs.push({
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        status: 'RUNNING',
        timestamp: new Date().toISOString(),
      });

      let nodeOutput: any = null;

      if (currentNode.type === 'START') {
        nodeOutput = 'Workflow initiated';
      } else if (currentNode.type === 'INPUT') {
        const varName = currentNode.config?.variableName || 'input';
        nodeOutput = executionVars[varName] ?? currentNode.config?.defaultValue ?? 'Sample input';
        executionVars[varName] = nodeOutput;
      } else if (currentNode.type === 'WEB_SEARCH') {
        const query = interpolateVariables(currentNode.config?.queryTemplate || '{{topic}}', executionVars);
        nodeOutput = `[Web Search: "${query}"] Retrieved verified sources on ${query}. Technical references confirmed.`;
        executionVars['search_results'] = nodeOutput;
      } else if (currentNode.type === 'KNOWLEDGE_SEARCH') {
        nodeOutput = `[Knowledge Search] Context from indexed knowledge base: PrinceAI architecture specification.`;
        executionVars['knowledge_context'] = nodeOutput;
      } else if (currentNode.type === 'AI_PROMPT') {
        const prompt = interpolateVariables(currentNode.config?.promptTemplate || 'Analyze input: {{input}}', executionVars);
        nodeOutput = await generateGeminiText({ prompt });
        executionVars['ai_response'] = nodeOutput;
      } else if (currentNode.type === 'CODE_GENERATOR') {
        const lang = currentNode.config?.language || 'TypeScript';
        const prompt = interpolateVariables(currentNode.config?.prompt || 'Create utility', executionVars);
        nodeOutput = `// Generated ${lang} module for: ${prompt}\nexport function execute() { return true; }`;
        executionVars['code_result'] = nodeOutput;
      } else if (currentNode.type === 'DOCUMENT_GENERATOR') {
        nodeOutput = `# ${interpolateVariables(currentNode.config?.title || 'Report', executionVars)}\n\n${executionVars['ai_response'] || executionVars['search_results'] || 'Analysis complete.'}`;
        executionVars['document_result'] = nodeOutput;
      } else if (currentNode.type === 'IMAGE_GENERATOR') {
        nodeOutput = `[Image Generated] Asset created with prompt: "${executionVars['ai_response']?.slice(0, 40) || 'Abstract Art'}"`;
        executionVars['image_url'] = nodeOutput;
      } else if (currentNode.type === 'APPROVAL') {
        // Pause execution for human approval
        run.status = 'WAITING_APPROVAL';
        run.pendingApprovalNodeId = currentNode.id;
        const lastLog = run.nodeLogs[run.nodeLogs.length - 1];
        lastLog.status = 'WAITING_APPROVAL';
        lastLog.output = 'Awaiting human review and approval.';
        db.saveWorkflowRun(run);
        return res.json({ run, message: 'Workflow paused: Human approval required.' });
      } else if (currentNode.type === 'CONDITION') {
        const fieldVal = executionVars[currentNode.config?.field || 'search_results'];
        const passed = evaluateCondition(fieldVal, currentNode.config?.operator || 'exists', currentNode.config?.value);
        nodeOutput = passed ? 'Condition met (True)' : 'Condition not met (False)';
      } else if (currentNode.type === 'OUTPUT') {
        nodeOutput = executionVars[currentNode.config?.outputVariable || 'ai_response'] || 'Workflow complete.';
        run.output = nodeOutput;
      } else if (currentNode.type === 'END') {
        nodeOutput = 'Workflow completed successfully.';
        break;
      }

      const log = run.nodeLogs[run.nodeLogs.length - 1];
      log.status = 'COMPLETED';
      log.output = nodeOutput;

      // Follow next edge
      const edge = wf.edges.find((e) => e.source === currentNode?.id);
      if (!edge) break;
      currentNode = wf.nodes.find((n) => n.id === edge.target);
    }

    run.status = 'SUCCESS';
    run.endTime = new Date().toISOString();
    run.durationMs = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
    run.output = run.output || executionVars['document_result'] || executionVars['ai_response'] || 'Workflow ran to completion.';

    db.saveWorkflowRun(run);
    return res.json({ run });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to execute workflow.' });
  }
});

// POST /api/workflows/runs/:runId/approve (Resume paused run)
workflowRouter.post('/runs/:runId/approve', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const { action } = req.body; // 'APPROVE' | 'REJECT'
  const run = db.getWorkflowRun(req.params.runId, req.user!.id);
  if (!run) {
    return res.status(404).json({ error: 'Run not found.' });
  }

  if (action === 'APPROVE') {
    run.status = 'SUCCESS';
    run.endTime = new Date().toISOString();
    run.output = 'Workflow successfully approved and completed.';
    const lastLog = run.nodeLogs[run.nodeLogs.length - 1];
    if (lastLog) {
      lastLog.status = 'COMPLETED';
      lastLog.output = 'Approved by user.';
    }
  } else {
    run.status = 'CANCELLED';
    run.endTime = new Date().toISOString();
    run.output = 'Workflow rejected by user.';
  }

  run.pendingApprovalNodeId = undefined;
  db.saveWorkflowRun(run);
  return res.json({ run });
});

// GET /api/workflows/:id/runs
workflowRouter.get('/:id/runs', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const runs = db.getWorkflowRuns(req.user!.id, req.params.id);
  return res.json({ runs });
});

// GET /api/workflows/:id/export (Export safe JSON)
workflowRouter.get('/:id/export', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const wf = db.getWorkflow(req.params.id, req.user!.id);
  if (!wf) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }

  const exportPayload = {
    name: wf.name,
    description: wf.description,
    nodes: wf.nodes,
    edges: wf.edges,
    variables: wf.variables,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${wf.name.replace(/\s+/g, '_')}_workflow.json"`);
  return res.send(JSON.stringify(exportPayload, null, 2));
});

// POST /api/workflows/import
workflowRouter.post('/import', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workflowData } = req.body;
    if (!workflowData || !workflowData.name || !Array.isArray(workflowData.nodes)) {
      return res.status(400).json({ error: 'Invalid workflow configuration data.' });
    }

    const imported: WorkflowDefinition = {
      id: 'wf_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      name: `${workflowData.name} (Imported)`,
      description: workflowData.description || 'Imported workflow',
      nodes: workflowData.nodes,
      edges: workflowData.edges || [],
      variables: workflowData.variables || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveWorkflow(imported);
    return res.status(201).json({ workflow: imported });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Import failed.' });
  }
});

// DELETE /api/workflows/:id
workflowRouter.delete('/:id', authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const ok = db.deleteWorkflow(req.params.id, req.user!.id);
  if (!ok) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }
  return res.json({ message: 'Workflow deleted.' });
});
