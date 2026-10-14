import React, { useState, useEffect } from 'react';
import { ToolDefinition, TaskExecution } from './types/tool';
import { fetchTools, fetchTasks, toggleToolAttached } from './utils/api';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ToolCatalogView } from './components/ToolCatalogView';
import { RunnerView } from './components/RunnerView';
import { PipelineBuilderView } from './components/PipelineBuilderView';
import { TargetScopeView } from './components/TargetScopeView';
import { ScheduleDiffView } from './components/ScheduleDiffView';
import { TaskQueueView } from './components/TaskQueueView';
import { ToolManagerView } from './components/ToolManagerView';
import { DeveloperGuideView } from './components/DeveloperGuideView';
import { WebhookSettingsModal } from './components/WebhookSettingsModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [tasks, setTasks] = useState<TaskExecution[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string>('wordlist-gen');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);
  const [isExecutiveReportModalOpen, setIsExecutiveReportModalOpen] = useState<boolean>(false);
  const [activeAuditTarget, setActiveAuditTarget] = useState<string>('127.0.0.1');

  const loadData = async () => {
    try {
      const [fetchedTools, fetchedTasks] = await Promise.all([
        fetchTools(),
        fetchTasks(),
      ]);
      setTools(fetchedTools);
      setTasks(fetchedTasks);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load CyberSuite data:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Poll for tasks status every 3 seconds to keep background runs fresh
    const interval = setInterval(async () => {
      try {
        const fetchedTasks = await fetchTasks();
        setTasks(fetchedTasks);
      } catch (e) {
        // Silent fail during background polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAttached = async (toolId: string, attached: boolean) => {
    try {
      await toggleToolAttached(toolId, attached);
      setTools((prev) =>
        prev.map((t) => (t.id === toolId ? { ...t, attached } : t))
      );
    } catch (err: any) {
      alert(`Error updating tool status: ${err.message}`);
    }
  };

  const handleLaunchTool = (toolId: string) => {
    setSelectedToolId(toolId);
    setActiveTab('runner');
  };

  const handleAuditTarget = (targetDomain: string) => {
    setActiveAuditTarget(targetDomain);
    setActiveTab('pipelines');
  };

  const activeTaskCount = tasks.filter((t) => t.status === 'running').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
          <Shield className="w-5 h-5" />
        </div>
        <div className="text-sm font-medium text-white">Initializing CyberSuite Console...</div>
        <div className="text-xs text-slate-500 mt-1">Mounting tool manifests and process orchestrator</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeTaskCount={activeTaskCount}
        totalToolsCount={tools.length}
        onOpenWebhooks={() => setIsWebhookModalOpen(true)}
        onOpenExecutiveReport={() => setIsExecutiveReportModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 px-4 sm:px-6 pt-6">
        {error && (
          <div className="max-w-7xl mx-auto mb-6 p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800/60 rounded text-rose-200 transition-colors cursor-pointer font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            tools={tools}
            tasks={tasks}
            onSelectTab={setActiveTab}
            onLaunchTool={handleLaunchTool}
          />
        )}

        {activeTab === 'catalog' && (
          <ToolCatalogView
            tools={tools}
            onLaunchTool={handleLaunchTool}
            onToggleAttached={handleToggleAttached}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'runner' && (
          <RunnerView
            tools={tools}
            selectedToolId={selectedToolId}
            onSelectTool={setSelectedToolId}
          />
        )}

        {activeTab === 'pipelines' && (
          <PipelineBuilderView
            tools={tools}
            onOpenReport={() => setIsExecutiveReportModalOpen(true)}
          />
        )}

        {activeTab === 'targets' && (
          <TargetScopeView onAuditTarget={handleAuditTarget} />
        )}

        {activeTab === 'schedules' && <ScheduleDiffView />}

        {activeTab === 'tasks' && (
          <TaskQueueView
            tasks={tasks}
            onRefreshTasks={loadData}
            onSelectTab={setActiveTab}
            onSelectTool={setSelectedToolId}
          />
        )}

        {activeTab === 'manager' && (
          <ToolManagerView
            tools={tools}
            onRefreshTools={loadData}
            onToggleAttached={handleToggleAttached}
            onLaunchTool={handleLaunchTool}
          />
        )}

        {activeTab === 'guide' && <DeveloperGuideView />}
      </main>

      {/* Modals */}
      <WebhookSettingsModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
      />

      <ExecutiveReportModal
        isOpen={isExecutiveReportModalOpen}
        onClose={() => setIsExecutiveReportModalOpen(false)}
        targetDomain={activeAuditTarget}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-[#070a12] py-4 px-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">CyberSuite 2.0</span>
            <span aria-hidden="true">·</span>
            <span>Modular DevSecOps Platform & Task Orchestrator</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>itsmhmiri tools connected</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400">CyberTool Spec v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
