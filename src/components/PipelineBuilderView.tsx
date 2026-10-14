import React, { useState, useEffect } from 'react';
import { PipelineDefinition, PipelineExecutionRecord, PipelineStep } from '../types/pipeline';
import { ToolDefinition } from '../types/tool';
import { fetchPipelines, savePipeline, executePipeline, fetchPipelineExecutions } from '../utils/api';
import { renderAnsiText } from '../utils/ansi';
import {
  Play,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Terminal,
  Shield,
  FileCode,
  Sparkles,
  GitBranch,
  Filter
} from 'lucide-react';

interface PipelineBuilderViewProps {
  tools: ToolDefinition[];
  onOpenReport?: (exec: PipelineExecutionRecord) => void;
}

export const PipelineBuilderView: React.FC<PipelineBuilderViewProps> = ({ tools, onOpenReport }) => {
  const [pipelines, setPipelines] = useState<PipelineDefinition[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('full_surface_recon');
  const [targetHost, setTargetHost] = useState<string>('127.0.0.1');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [executions, setExecutions] = useState<PipelineExecutionRecord[]>([]);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);

  // New Pipeline Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPipelineName, setNewPipelineName] = useState<string>('');
  const [newPipelineDesc, setNewPipelineDesc] = useState<string>('');
  const [newPipelineSteps, setNewPipelineSteps] = useState<PipelineStep[]>([
    {
      id: 'step_1',
      toolId: 'async-banner-scanner',
      name: 'Initial Port Probing',
      parameterOverrides: { ports: '80,443,8080' },
      condition: { type: 'always' },
    },
    {
      id: 'step_2',
      toolId: 'quickbuster',
      name: 'Web Route Discovery',
      parameterOverrides: { wordlist: 'wordlists/common_endpoints.txt' },
      condition: { type: 'if_ports_open', value: '80,443,8080' },
    },
  ]);

  const loadData = async () => {
    try {
      const [pipes, execs] = await Promise.all([fetchPipelines(), fetchPipelineExecutions()]);
      setPipelines(pipes);
      setExecutions(execs);
      if (!selectedPipelineId && pipes.length > 0) {
        setSelectedPipelineId(pipes[0].id);
      }
    } catch (e) {
      console.error('Failed to load pipelines:', e);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(async () => {
      try {
        const execs = await fetchPipelineExecutions();
        setExecutions(execs);
      } catch (e) {}
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const activePipeline = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0];
  const activeExecution =
    executions.find((e) => e.id === currentExecutionId) ||
    executions.find((e) => e.pipelineId === activePipeline?.id) ||
    executions[0];

  const handleRunPipeline = async () => {
    if (!activePipeline || isExecuting) return;
    setIsExecuting(true);
    try {
      const { executionId } = await executePipeline(activePipeline.id, targetHost);
      setCurrentExecutionId(executionId);
      await loadData();
    } catch (e: any) {
      alert(`Pipeline error: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;
    try {
      const created = await savePipeline({
        id: `pipe_${Date.now()}`,
        name: newPipelineName,
        description: newPipelineDesc || 'Custom automated workflow',
        category: 'custom',
        steps: newPipelineSteps,
        isBuiltIn: false,
      });
      setShowCreateModal(false);
      setNewPipelineName('');
      setNewPipelineDesc('');
      await loadData();
      setSelectedPipelineId(created.id);
    } catch (e: any) {
      alert(`Error creating pipeline: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-cyan-400" />
            <span>Automated Multi-Tool Pipelines</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Chain security tools into conditional, multi-stage workflows with automated parameter propagation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

      {/* Target & Pipeline Selector Strip */}
      <div className="p-4 rounded-lg bg-[#111827] border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Workflow:</span>
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="w-full sm:w-auto bg-[#090d16] border border-slate-700 text-xs text-white rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.steps.length} Steps)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 flex-1 sm:max-w-xs">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Target Domain / IP:</span>
            <input
              type="text"
              value={targetHost}
              onChange={(e) => setTargetHost(e.target.value)}
              placeholder="127.0.0.1 or example.com"
              className="w-full bg-[#090d16] border border-slate-700 text-xs text-white rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            disabled={isExecuting}
            onClick={handleRunPipeline}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Starting Pipeline...' : 'Execute Workflow'}</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Canvas / Step Nodes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Pipeline Architecture ({activePipeline?.steps.length} Stages)</span>
          </h2>
          <span className="text-xs text-slate-400">
            {activePipeline?.description}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {activePipeline?.steps.map((step, idx) => (
            <div
              key={step.id}
              className="p-4 rounded-lg bg-[#111827] border border-slate-800 flex flex-col justify-between relative group hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                    Stage {idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {step.toolId}
                  </span>
                </div>
                <div className="text-xs font-bold text-white tracking-tight">{step.name}</div>

                {/* Condition Box */}
                {step.condition && step.condition.type !== 'always' && (
                  <div className="mt-2.5 p-2 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 font-mono flex items-center gap-1.5">
                    <Filter className="w-3 h-3 shrink-0" />
                    <span>Requires open ports [{step.condition.value}]</span>
                  </div>
                )}
                {step.condition?.type === 'always' && (
                  <div className="mt-2.5 text-[11px] text-slate-400 font-mono">
                    Condition: Always execute
                  </div>
                )}
              </div>

              {idx < (activePipeline.steps.length - 1) && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Pipeline Execution Progress & Logs */}
      {activeExecution && (
        <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden space-y-0">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Execution: {activeExecution.pipelineName}</span>
                <span className="text-slate-500 font-mono text-[11px]">[{activeExecution.target}]</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Status: <span className="text-emerald-400 uppercase font-bold">{activeExecution.status}</span>
                {activeExecution.durationMs && ` · ${(activeExecution.durationMs / 1000).toFixed(1)}s total`}
              </div>
            </div>

            {/* Step Selection Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {activeExecution.stepResults.map((sr, idx) => (
                <button
                  key={sr.stepId}
                  onClick={() => setActiveStepTab(idx)}
                  className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeStepTab === idx
                      ? 'bg-slate-800 text-cyan-300 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sr.status === 'completed' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                  {sr.status === 'running' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                  {sr.status === 'skipped' && <span className="text-slate-500 text-[10px] font-mono">SKIP</span>}
                  <span>{sr.stepName.replace(/Step \d+: /, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Terminal Output */}
          {activeExecution.stepResults[activeStepTab] && (
            <div className="p-4 bg-[#050811] text-xs font-mono min-h-[280px] max-h-[420px] overflow-y-auto">
              {activeExecution.stepResults[activeStepTab].skipReason ? (
                <div className="p-4 text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>{activeExecution.stepResults[activeStepTab].skipReason}</span>
                </div>
              ) : activeExecution.stepResults[activeStepTab].logs.length === 0 ? (
                <div className="p-6 text-slate-600 text-center">
                  Stage pending or waiting for prerequisites...
                </div>
              ) : (
                activeExecution.stepResults[activeStepTab].logs.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {renderAnsiText(line)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* New Pipeline Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Custom Security Pipeline</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Pipeline Name</label>
                <input
                  type="text"
                  placeholder="e.g. Infrastructure Attack Surface Scan"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="What does this automated workflow accomplish?"
                  value={newPipelineDesc}
                  onChange={(e) => setNewPipelineDesc(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded p-2 text-xs text-white"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300">Workflow Stages</span>
                <div className="mt-2 space-y-2">
                  {newPipelineSteps.map((step, idx) => (
                    <div key={step.id} className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">Stage {idx + 1}: {step.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Tool: {step.toolId}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                        {step.condition?.type || 'always'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded cursor-pointer"
              >
                Save Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
