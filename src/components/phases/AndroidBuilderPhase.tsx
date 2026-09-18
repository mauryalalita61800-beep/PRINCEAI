import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Play, FileCode, Plus, Check } from 'lucide-react';
import { api } from '../../services/api';
import { AndroidProject, ProjectFile } from '../../types';

export const AndroidBuilderPhase: React.FC = () => {
  const [projects, setProjects] = useState<AndroidProject[]>([]);
  const [activeProject, setActiveProject] = useState<AndroidProject | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [prompt, setPrompt] = useState('Create an Android fitness tracking app with calorie counter, step logger, and workout summary cards');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.getAndroidProjects();
      setProjects(res.projects || []);
      if (res.projects && res.projects.length > 0) {
        selectProject(res.projects[0]);
      }
    } catch (err) {
      console.error('Failed to load android projects', err);
    }
  };

  const selectProject = (p: AndroidProject) => {
    setActiveProject(p);
    const ktFile = p.files.find((f) => f.name.endsWith('.kt')) || p.files[0];
    setActiveFile(ktFile);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateAndroid(prompt.trim());
      setProjects((prev) => [res.project, ...prev]);
      selectProject(res.project);
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddScreen = () => {
    if (!activeProject || !newScreenName.trim()) return;
    const cleanName = newScreenName.trim().replace(/[^a-zA-Z0-9]/g, '');
    const ktFileName = `${cleanName}Activity.kt`;
    const xmlFileName = `activity_${cleanName.toLowerCase()}.xml`;

    const newKtFile: ProjectFile = {
      name: ktFileName,
      path: `app/src/main/java/com/princeai/app/${ktFileName}`,
      language: 'kotlin',
      content: `package ${activeProject.packageName}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class ${cleanName}Activity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_${cleanName.toLowerCase()})
        title = "${cleanName} Screen"
    }
}`,
    };

    const newXmlFile: ProjectFile = {
      name: xmlFileName,
      path: `app/src/main/res/layout/${xmlFileName}`,
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="${cleanName} Screen"
        android:textSize="22sp"
        android:textStyle="bold" />

</LinearLayout>`,
    };

    const updated = {
      ...activeProject,
      files: [...activeProject.files, newKtFile, newXmlFile],
    };
    setActiveProject(updated);
    setActiveFile(newKtFile);
    setShowAddModal(false);
    setNewScreenName('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Generator Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">Android App Builder</h2>
            <p className="text-[11px] text-slate-500">Native Kotlin Activities, XML Layouts & Gradle Scaffold</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex items-center gap-2 flex-1 max-w-xl">
          <input
            id="input-android-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Android e-commerce store with product grid..."
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <button
            id="btn-android-generate"
            type="submit"
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 shrink-0"
          >
            <Play className="w-3 h-3" />
            <span>{isGenerating ? 'Building...' : 'Build Android App'}</span>
          </button>
        </form>

        <div className="flex items-center gap-2">
          {activeProject && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Screen</span>
              </button>
              <a
                id="btn-android-download-zip"
                href={`/api/android/projects/${activeProject.id}/zip`}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK ZIP</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Project Files */}
        <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-3 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Android Project Tree</span>
            <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
              Kotlin
            </span>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto flex-1">
            {activeProject?.files.map((file) => {
              const isCurrent = file.name === activeFile?.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setActiveFile(file)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-left transition-colors ${
                    isCurrent
                      ? 'bg-emerald-100/70 text-emerald-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${file.name.endsWith('.kt') ? 'text-purple-600' : 'text-blue-500'}`} />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source Code Editor */}
        <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
          <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">
              {activeFile?.path || activeFile?.name || 'File'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              Android Studio Ready
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              id="textarea-android-code"
              value={activeFile?.content || ''}
              onChange={(e) => {
                if (!activeProject || !activeFile) return;
                const newContent = e.target.value;
                const updatedFiles = activeProject.files.map((f) =>
                  f.name === activeFile.name ? { ...f, content: newContent } : f
                );
                setActiveProject({ ...activeProject, files: updatedFiles });
                setActiveFile({ ...activeFile, content: newContent });
              }}
              className="w-full h-full font-mono text-xs bg-transparent text-slate-100 resize-none focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Add Screen Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add New Screen Activity</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Screen Name</label>
              <input
                type="text"
                value={newScreenName}
                onChange={(e) => setNewScreenName(e.target.value)}
                placeholder="e.g. Profile, Settings, Checkout"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScreen}
                disabled={!newScreenName.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Create Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
