import React from 'react';
import { TaskExecution } from '../types/tool';
import { killTask } from '../utils/api';
import { Terminal, Square, Clock, AlertCircle, CheckCircle, RefreshCw, Play } from 'lucide-react';
import { NavTab } from './Navbar';

interface TaskQueueViewProps {
  tasks: TaskExecution[];
  onRefreshTasks: () => void;
  onSelectTab: (tab: NavTab) => void;
  onSelectTool: (toolId: string) => void;
}

export const TaskQueueView: React.FC<TaskQueueViewProps> = ({
  tasks,
  onRefreshTasks,
  onSelectTab,
  onSelectTool,
}) => {
  const handleKill = async (taskId: string) => {
    try {
      await killTask(taskId);
      onRefreshTasks();
    } catch (e) {
      console.error('Error killing task:', e);
    }
  };

  const handleOpenInRunner = (toolId: string) => {
    onSelectTool(toolId);
    onSelectTab('runner');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Task Execution Queue</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time process monitor for running security audits, scans, and background CLI tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshTasks}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh Tasks</span>
          </button>
        </div>
      </div>

      {/* Task Queue Table */}
      {tasks.length === 0 ? (
        <div className="p-12 rounded-lg bg-[#111827] border border-slate-800 text-center">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-300">No active or historical tasks</p>
          <p className="mt-1 text-xs text-slate-500">
            Executions will appear here when you run tools from the Catalog or Runner.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Task ID</th>
                  <th className="py-3 px-4 font-sans">Tool Name</th>
                  <th className="py-3 px-4">Shell Command</th>
                  <th className="py-3 px-4 font-sans">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 font-sans text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-cyan-400 font-bold">
                      {task.id.slice(0, 16)}...
                    </td>

                    <td className="py-3 px-4 font-sans text-white font-medium">
                      {task.toolName}
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate" title={task.command}>
                      {task.command}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      {task.status === 'running' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Running</span>
                        </span>
                      )}
                      {task.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 text-sky-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                      {task.status === 'failed' && (
                        <span className="inline-flex items-center gap-1.5 text-rose-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Failed (Exit {task.exitCode ?? 1})</span>
                        </span>
                      )}
                      {task.status === 'aborted' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-400">
                          <Square className="w-3 h-3" />
                          <span>Aborted</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300 tabular-nums">
                      {task.durationMs !== undefined
                        ? `${(task.durationMs / 1000).toFixed(2)}s`
                        : `${((Date.now() - task.startTime) / 1000).toFixed(1)}s (live)`}
                    </td>

                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        {task.status === 'running' && (
                          <button
                            onClick={() => handleKill(task.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded hover:bg-rose-500/30 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>Kill</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenInRunner(task.toolId)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Terminal className="w-3 h-3 text-cyan-400" />
                          <span>View Logs</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
