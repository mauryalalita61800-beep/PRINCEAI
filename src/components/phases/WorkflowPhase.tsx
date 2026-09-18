import React, { useState, useEffect } from 'react';
import { GitBranch, Play, Plus, ArrowRight, CheckCircle2, RefreshCw, Sparkles, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { WorkflowTemplate, WorkflowRun } from '../../types';

export const WorkflowPhase: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTemplate | null>(null);
  const [workflowInput, setWorkflowInput] = useState('Enterprise Zero-Trust Microservice Architecture');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRun, setCurrentRun] = useState<WorkflowRun | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const res = await api.getWorkflows();
      setWorkflows(res.workflows || []);
      if (res.workflows && res.workflows.length > 0) {
        setActiveWorkflow(res.workflows[0]);
      }
    } catch (err) {
      console.error('Failed to load workflows', err);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkflow || !workflowInput.trim()) return;

    setIsExecuting(true);
    setCurrentRun(null);
    try {
      const res = await api.executeWorkflow(activeWorkflow.id, workflowInput.trim());
      setCurrentRun(res.run);
    } catch (err: any) {
      alert(`Workflow execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Templates & Saved Workflows Sidebar */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Workflow Pipelines</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{workflows.length} active</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {workflows.map((wf) => {
            const isSelected = wf.id === activeWorkflow?.id;
            return (
              <div
                key={wf.id}
                onClick={() => {
                  setActiveWorkflow(wf);
                  setCurrentRun(null);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-50 border-purple-200 text-purple-900 shadow-2xs font-semibold'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="uppercase font-mono">{wf.steps?.length || 0} NODES</span>
                  <span>PRESET</span>
                </div>
                <h4 className="font-bold mb-1 leading-snug">{wf.title}</h4>
                <p className="text-[11px] text-slate-500 font-normal line-clamp-2">{wf.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Canvas & Step Progress */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Pipeline Controls Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900">{activeWorkflow?.title || 'Pipeline'}</h2>
              <p className="text-[11px] text-slate-500">{activeWorkflow?.description}</p>
            </div>

            <button
              id="btn-run-workflow"
              onClick={handleExecute}
              disabled={isExecuting || !activeWorkflow || !workflowInput.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecuting ? 'Running Pipeline...' : 'Execute Workflow'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pipeline Input Parameter</label>
            <input
              id="input-workflow-param"
              type="text"
              value={workflowInput}
              onChange={(e) => setWorkflowInput(e.target.value)}
              placeholder="Provide target topic, codebase, or document context..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Node Pipeline Diagram */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 overflow-x-auto">
          <div className="flex items-center gap-3 min-w-max">
            {/* Input Trigger Node */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs w-48 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Trigger</span>
              <h4 className="text-xs font-bold text-slate-800">User Input Event</h4>
              <p className="text-[11px] text-slate-500 truncate">{workflowInput}</p>
            </div>

            {activeWorkflow?.steps?.map((step: any, sIdx: number) => (
              <React.Fragment key={step.id || sIdx}>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs w-52 space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">
                      Node {sIdx + 1}
                    </span>
                    <span className="text-[9px] font-mono bg-purple-50 text-purple-700 px-1 py-0.5 rounded">
                      {step.type}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">{step.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{step.prompt}</p>
                </div>
              </React.Fragment>
            ))}

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* Output Node */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs w-48 space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">Result</span>
              <h4 className="text-xs font-bold text-slate-800">Final Artifact</h4>
              <p className="text-[11px] text-slate-500">Synthesized Delivery</p>
            </div>
          </div>
        </div>

        {/* Execution Output Stream */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          {currentRun ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Pipeline Execution Completed Successfully</span>
                </div>
                <span className="text-xs font-mono text-purple-700 font-bold">
                  Duration: {currentRun.durationMs}ms
                </span>
              </div>

              {/* Node execution step logs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step Execution Details ({currentRun.stepResults?.length || 0})
                </h4>

                <div className="space-y-3">
                  {currentRun.stepResults?.map((stepRes: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          Step {idx + 1}: {stepRes.name}
                        </span>
                        <span className="text-emerald-700 font-bold font-mono text-[11px]">
                          Status: {stepRes.status}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed">
                        {stepRes.output}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Output */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Final Pipeline Output</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {currentRun.finalOutput}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-16">
              <GitBranch className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-xs">Click "Execute Workflow" above to run the multi-step AI pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
