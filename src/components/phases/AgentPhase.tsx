import React, { useState, useEffect } from 'react';
import { BotMessageSquare, Play, CheckCircle2, XCircle, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { AgentTask } from '../../types';

export const AgentPhase: React.FC = () => {
  const [goal, setGoal] = useState('Research current microservices best practices, generate a resilient TypeScript rate limiter, and compile an executive summary document');
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.getAgentTasks();
      setTasks(res.tasks || []);
      if (res.tasks && res.tasks.length > 0) {
        setActiveTask(res.tasks[0]);
      }
    } catch (err) {
      console.error('Failed to load agent tasks', err);
    }
  };

  const handlePlanTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsPlanning(true);
    try {
      const res = await api.planAgentTask(goal.trim());
      setTasks((prev) => [res.task, ...prev]);
      setActiveTask(res.task);
    } catch (err: any) {
      alert(`Planning failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleApprove = async (action: 'APPROVE' | 'REJECT' | 'CANCEL') => {
    if (!activeTask) return;
    setIsExecuting(true);
    try {
      const res = await api.approveAgentTask(activeTask.id, action);
      setActiveTask(res.task);
      setTasks((prev) => prev.map((t) => (t.id === res.task.id ? res.task : t)));
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Task History */}
      <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Agent Task Log</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No agent tasks created</div>
          ) : (
            tasks.map((t) => {
              const isSelected = t.id === activeTask?.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTask(t)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200 text-blue-900 font-medium'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span
                      className={`font-bold uppercase font-mono px-1 py-0.2 rounded ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'WAITING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                    <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="line-clamp-2">{t.goal}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Agent Plan & Execution Canvas */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Goal Input Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <BotMessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 leading-tight">Autonomous AI Agent</h2>
              <p className="text-[11px] text-slate-500">
                Tool Allowlist • Human Approval Gate • Multi-Step Execution
              </p>
            </div>
          </div>

          <form onSubmit={handlePlanTask} className="flex gap-2">
            <input
              id="input-agent-goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe high-level goal for the agent to orchestrate..."
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              id="btn-agent-plan"
              type="submit"
              disabled={isPlanning || !goal.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isPlanning ? 'Formulating Plan...' : 'Generate Plan'}</span>
            </button>
          </form>
        </div>

        {/* Task Plan Details */}
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
          {activeTask ? (
            <div className="space-y-6">
              {/* Task Goal Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Task ID: {activeTask.id}</span>
                  <span className="font-mono">{new Date(activeTask.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{activeTask.goal}</h3>
              </div>

              {/* Human Approval Gate if WAITING_APPROVAL */}
              {activeTask.status === 'WAITING_APPROVAL' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Human Approval Required</h4>
                      <p className="text-[11px] text-amber-700">
                        Review the proposed sequence of {activeTask.plan.length} tools below before execution.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="btn-agent-reject"
                      onClick={() => handleApprove('REJECT')}
                      disabled={isExecuting}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium"
                    >
                      Reject
                    </button>
                    <button
                      id="btn-agent-approve"
                      onClick={() => handleApprove('APPROVE')}
                      disabled={isExecuting}
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isExecuting ? 'Executing...' : 'Approve & Execute Steps'}
                    </button>
                  </div>
                </div>
              )}

              {/* Steps Progress List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Planned Execution Sequence
                </h4>

                <div className="space-y-2.5">
                  {activeTask.plan.map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">
                            {step.tool}
                          </span>
                          <span className="text-xs text-slate-800 font-medium">{step.description}</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                            step.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.status === 'EXECUTING'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : step.status === 'WAITING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>

                      {/* Tool Output log if completed */}
                      {step.output && (
                        <div className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed">
                          {step.output}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Agent Synthesis */}
              {activeTask.finalResponse && (
                <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Agent Executive Delivery</span>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {activeTask.finalResponse}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <BotMessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Specify a high-level goal to have the PrinceAI agent formulate an approved plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
