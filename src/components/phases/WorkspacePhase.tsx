import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, FileCode, Trash2, Download, Sparkles, Check, X, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { WorkspaceProject, ProjectFile } from '../../types';

export const WorkspacePhase: React.FC = () => {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [activeProject, setActiveProject] = useState<WorkspaceProject | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [aiInstruction, setAiInstruction] = useState('Add strict validation checks and sanitize inputs');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectType, setNewProjectType] = useState('website');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.getWorkspaceProjects();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0) {
        selectProject(res.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load workspace projects', err);
    }
  };

  const selectProject = (p: WorkspaceProject) => {
    setActiveProject(p);
    setSelectedFile(p.files[0] || null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    try {
      const res = await api.createWorkspaceProject({
        title: newProjectTitle.trim(),
        type: newProjectType,
      });
      setProjects([res.project, ...projects]);
      selectProject(res.project);
      setShowNewModal(false);
      setNewProjectTitle('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAiRefactor = async () => {
    if (!activeProject || !selectedFile || !aiInstruction.trim()) return;

    setIsAiEditing(true);
    try {
      const res = await api.aiEditWorkspaceFile(activeProject.id, selectedFile.path, aiInstruction.trim());
      // Update local state with pending diff
      setActiveProject({ ...activeProject, pendingDiff: res.diff });
    } catch (err: any) {
      alert(`AI modification error: ${err.message}`);
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleApproveDiff = async (action: 'APPROVE' | 'REJECT') => {
    if (!activeProject) return;
    try {
      const res = await api.approveWorkspaceDiff(activeProject.id, action);
      setActiveProject(res.project);
      const updatedFile = res.project.files.find((f: ProjectFile) => f.path === selectedFile?.path);
      if (updatedFile) setSelectedFile(updatedFile);
      alert(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Projects & File Tree */}
      <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col h-full">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</span>
          <button
            onClick={() => setShowNewModal(true)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Create Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Project List */}
        <div className="p-2 border-b border-slate-200 space-y-1">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => selectProject(proj)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                proj.id === activeProject?.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{proj.title}</span>
              </div>
              <span className="text-[10px] font-mono opacity-80 uppercase">{proj.type}</span>
            </button>
          ))}
        </div>

        {/* Files of Active Project */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Files ({activeProject?.files.length || 0})
          </div>
          {activeProject?.files.map((file) => {
            const isSelected = file.path === selectedFile?.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-mono flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>

        {activeProject && (
          <div className="p-2 border-t border-slate-200">
            <a
              href={`/api/workspace/projects/${activeProject.id}/zip`}
              download
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Project ZIP</span>
            </a>
          </div>
        )}
      </div>

      {/* Editor & AI Diff Inspector */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Top Action Bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-800">
              {selectedFile?.path || 'No File Selected'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <input
              type="text"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="AI instruction to refactor this file..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleAiRefactor}
              disabled={isAiEditing || !selectedFile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isAiEditing ? 'Refactoring...' : 'AI Refactor'}</span>
            </button>
          </div>
        </div>

        {/* Pending AI Diff Review Bar (Approval Required) */}
        {activeProject?.pendingDiff && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div className="text-xs text-amber-900 font-medium">
              ⚠️ <span className="font-bold">AI Proposed Modification:</span> User approval required before applying changes to{' '}
              <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{activeProject.pendingDiff.file}</code>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApproveDiff('REJECT')}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-100"
              >
                <X className="w-3.5 h-3.5 text-red-600" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleApproveDiff('APPROVE')}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Apply</span>
              </button>
            </div>
          </div>
        )}

        {/* Code Content / Side-by-Side Diff if pending */}
        <div className="flex-1 overflow-hidden">
          {activeProject?.pendingDiff ? (
            <div className="grid grid-cols-2 h-full divide-x divide-slate-800 bg-slate-950 font-mono text-xs">
              {/* Original Before */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="h-8 px-3 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 flex items-center">
                  Original Content (Before)
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {activeProject.pendingDiff.original}
                </div>
              </div>

              {/* Modified After */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="h-8 px-3 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center">
                  Proposed AI Revision (After)
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-emerald-200 whitespace-pre-wrap leading-relaxed bg-emerald-950/20">
                  {activeProject.pendingDiff.modified}
                </div>
              </div>
            </div>
          ) : (
            <textarea
              value={selectedFile?.content || ''}
              onChange={(e) => {
                if (!activeProject || !selectedFile) return;
                const newContent = e.target.value;
                const updatedFiles = activeProject.files.map((f) =>
                  f.path === selectedFile.path ? { ...f, content: newContent } : f
                );
                setActiveProject({ ...activeProject, files: updatedFiles });
                setSelectedFile({ ...selectedFile, content: newContent });
              }}
              className="w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-100 resize-none focus:outline-none leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateProject}
            className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200"
          >
            <h3 className="text-sm font-bold text-slate-900">Create New Workspace Project</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="e.g. Enterprise Cloud Portal"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select
                value={newProjectType}
                onChange={(e) => setNewProjectType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value="website">Website Scaffold</option>
                <option value="android">Android App</option>
                <option value="custom">Custom Multi-File</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProjectTitle.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
