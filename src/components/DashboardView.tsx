import React from 'react';
import { ToolDefinition, TaskExecution } from '../types/tool';
import { NavTab } from './Navbar';
import { Shield, Play, Terminal, ExternalLink, ArrowRight, CheckCircle2, Clock, Wrench, FileCode, Cpu } from 'lucide-react';

interface DashboardViewProps {
  tools: ToolDefinition[];
  tasks: TaskExecution[];
  onSelectTab: (tab: NavTab) => void;
  onLaunchTool: (toolId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tools,
  tasks,
  onSelectTab,
  onLaunchTool,
}) => {
  const attachedTools = tools.filter(t => t.attached);
  const runningTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Find user's three signature tools
  const signatureToolIds = ['wordlist-gen', 'quickbuster', 'async-banner-scanner'];
  const signatureTools = tools.filter(t => signatureToolIds.includes(t.id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Security Operations & CLI Hub</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Modular orchestrator for Python security tools. Run tests with live ANSI terminal streaming and structured findings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('manager')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-md transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage & Attach Tools</span>
          </button>
          <button
            onClick={() => onSelectTab('guide')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/50 rounded-md transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Developer Guide</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Available Tools</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">{tools.length}</span>
            <span className="text-xs text-slate-400">
              ({attachedTools.length} attached)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Tasks</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">{runningTasks.length}</span>
            <span className="text-xs text-slate-400">running now</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed Audits</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">{completedTasks.length}</span>
            <span className="text-xs text-slate-400">executions</span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Plugin Standard</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-300 font-mono">v1.0</span>
            <span className="text-xs text-slate-400">CyberTool Spec</span>
          </div>
        </div>
      </div>

      {/* Signature Pre-Connected Tools Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Pre-Connected Security Suite</h2>
            <p className="text-xs text-slate-400">Default CLI security tools ready for instant execution</p>
          </div>
          <button
            onClick={() => onSelectTab('catalog')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View All Tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {signatureTools.map((tool) => (
            <div
              key={tool.id}
              className="p-5 rounded-lg bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-white text-sm tracking-tight">{tool.name}</div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700/60 font-medium shrink-0">
                    {tool.category}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {tool.description}
                </p>

                {tool.githubUrl && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
                    <span>GitHub:</span>
                    <a
                      href={tool.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>{tool.githubUrl.replace('https://github.com/', '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {tool.parameters.length} CLI arguments
                </span>
                <button
                  onClick={() => onLaunchTool(tool.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Launch</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extensible Architecture Callout */}
      <div className="p-5 rounded-lg bg-gradient-to-r from-slate-900 via-slate-900 to-[#101b30] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Want to attach a custom tool or write a new one?</span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            The dashboard uses a declarative schema. Simply define parameters and point to a Python script, or follow our standard template to connect your repository.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onSelectTab('manager')}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Attach New Tool
          </button>
          <button
            onClick={() => onSelectTab('guide')}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
          >
            Read Spec Guide
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Task Executions</h2>
            <p className="text-xs text-slate-400">Live background process logs and execution results</p>
          </div>
          <button
            onClick={() => onSelectTab('tasks')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View Full Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 rounded-lg bg-[#111827] border border-slate-800 text-center">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-300">No tools executed yet</div>
            <p className="mt-1 text-xs text-slate-500">
              Select any tool from the catalog to run an audit and view real-time streaming output.
            </p>
            <button
              onClick={() => onLaunchTool('wordlist-gen')}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Sample Scan</span>
            </button>
          </div>
        ) : (
          <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Tool</th>
                    <th className="py-2.5 px-4 font-mono">Command Executed</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 font-mono">Duration</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {tasks.slice(0, 5).map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4 font-sans font-medium text-white">
                        {task.toolName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">
                        {task.command}
                      </td>
                      <td className="py-2.5 px-4 font-sans">
                        {task.status === 'running' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Running</span>
                          </span>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-sky-400">Completed</span>
                        )}
                        {task.status === 'failed' && (
                          <span className="text-rose-400">Failed</span>
                        )}
                        {task.status === 'aborted' && (
                          <span className="text-amber-400">Aborted</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {task.durationMs !== undefined ? `${(task.durationMs / 1000).toFixed(2)}s` : 'Active'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        <button
                          onClick={() => onSelectTab('runner')}
                          className="text-cyan-400 hover:underline cursor-pointer text-xs"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
