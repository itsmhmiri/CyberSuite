import React, { useState, useEffect, useRef } from 'react';
import { ToolDefinition, TaskExecution, ToolParameter } from '../types/tool';
import { renderAnsiText, stripAnsi } from '../utils/ansi';
import { executeTool, killTask } from '../utils/api';
import {
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  Terminal,
  FileText,
  Download,
  Search,
  ExternalLink,
  Shield,
  Layers,
  ArrowDownCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

interface RunnerViewProps {
  tools: ToolDefinition[];
  selectedToolId: string;
  onSelectTool: (toolId: string) => void;
  onTaskCompleted?: (task: TaskExecution) => void;
}

export const RunnerView: React.FC<RunnerViewProps> = ({
  tools,
  selectedToolId,
  onSelectTool,
}) => {
  const attachedTools = tools.filter((t) => t.attached);
  const currentTool = tools.find((t) => t.id === selectedToolId) || attachedTools[0] || tools[0];

  // Parameter state dictionary
  const [params, setParams] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'terminal' | 'findings' | 'export'>('terminal');

  // Execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [commandString, setCommandString] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [parsedFindings, setParsedFindings] = useState<any>(null);
  const [executionDuration, setExecutionDuration] = useState<number | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);

  // Terminal UI options
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [logSearch, setLogSearch] = useState<string>('');
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Initialize parameters when tool changes
  useEffect(() => {
    if (currentTool) {
      const initial: Record<string, any> = {};
      for (const p of currentTool.parameters) {
        initial[p.name] = p.defaultValue !== undefined ? p.defaultValue : (p.type === 'boolean' ? false : '');
      }
      setParams(initial);
    }
  }, [currentTool?.id]);

  // Compute live command string preview
  useEffect(() => {
    if (!currentTool) return;
    const parts = ['python3', currentTool.entrypoint];
    for (const p of currentTool.parameters) {
      const val = params[p.name];
      if (p.type === 'boolean') {
        if (val === true) {
          parts.push(p.flag);
        }
      } else if (val !== undefined && val !== null && val !== '') {
        parts.push(p.flag);
        const strVal = String(val);
        parts.push(strVal.includes(' ') ? `"${strVal}"` : strVal);
      }
    }
    setCommandString(parts.join(' '));
  }, [currentTool, params]);

  // Auto-scroll terminal
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Handle running tool
  const handleRun = async () => {
    if (!currentTool || isRunning) return;

    setIsRunning(true);
    setLogs([`\x1b[36m[*] Initializing ${currentTool.name}...\x1b[0m\n`]);
    setParsedFindings(null);
    setExecutionDuration(null);

    try {
      const { taskId, command } = await executeTool(currentTool.id, params);
      setCurrentTaskId(taskId);
      setCommandString(command);

      // Connect to SSE stream
      if (sseRef.current) {
        sseRef.current.close();
      }

      const sse = new EventSource(`/api/tasks/${taskId}/stream`);
      sseRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'log') {
            setLogs((prev) => [...prev, data.chunk]);
          } else if (data.type === 'done') {
            setIsRunning(false);
            const payload = data.payload || data;
            if (payload.durationMs) setExecutionDuration(payload.durationMs);
            if (payload.parsedFindings) setParsedFindings(payload.parsedFindings);
            sse.close();
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      sse.onerror = () => {
        setIsRunning(false);
        sse.close();
      };
    } catch (err: any) {
      setIsRunning(false);
      setLogs((prev) => [...prev, `\n\x1b[31m[-] Execution failed: ${err.message}\x1b[0m\n`]);
    }
  };

  const handleStop = async () => {
    if (!currentTaskId) return;
    try {
      await killTask(currentTaskId);
      setIsRunning(false);
      if (sseRef.current) sseRef.current.close();
    } catch (e) {
      console.error('Error stopping task:', e);
    }
  };

  const handleClear = () => {
    setLogs([]);
    setParsedFindings(null);
    setExecutionDuration(null);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(commandString);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 1800);
  };

  const handleCopyLogs = () => {
    const raw = stripAnsi(logs.join(''));
    navigator.clipboard.writeText(raw);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 1800);
  };

  const handleExportMarkdown = () => {
    if (!currentTool) return;
    const cleanLogs = stripAnsi(logs.join(''));
    const content = `# Security Audit Report - ${currentTool.name}
Generated: ${new Date().toISOString()}
Target Command: \`${commandString}\`
Status: ${isRunning ? 'In Progress' : 'Completed'}
Duration: ${executionDuration ? `${(executionDuration / 1000).toFixed(2)}s` : 'N/A'}

## Execution Output
\`\`\`text
${cleanLogs}
\`\`\`

${parsedFindings ? `## Structured Intelligence Summary\n\`\`\`json\n${JSON.stringify(parsedFindings, null, 2)}\n\`\`\`` : ''}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${currentTool.id}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const payload = {
      tool: currentTool,
      command: commandString,
      durationMs: executionDuration,
      executedAt: new Date().toISOString(),
      findings: parsedFindings,
      rawOutput: stripAnsi(logs.join('')),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findings_${currentTool?.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter logs for search
  const filteredLogs = logSearch
    ? logs.filter((l) => stripAnsi(l).toLowerCase().includes(logSearch.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{currentTool ? currentTool.name : 'Tool Runner'}</span>
              {currentTool?.isBuiltIn && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-medium">
                  Built-in
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              Configure parameters, execute CLI command, and view real-time unbuffered streaming.
            </p>
          </div>
        </div>

        {/* Tool Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Active Tool:</span>
          <select
            value={currentTool?.id}
            onChange={(e) => onSelectTool(e.target.value)}
            className="bg-[#111827] border border-slate-700 text-xs text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
          >
            {attachedTools.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dynamic Parameter Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-lg bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                CLI Configuration Flags
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {currentTool?.parameters.length} options
              </span>
            </div>

            {/* Dynamic Form inputs */}
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {currentTool?.parameters.map((param: ToolParameter) => (
                <div key={param.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      <span>{param.label}</span>
                      {param.required && <span className="text-rose-400">*</span>}
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                      {param.flag}
                    </span>
                  </div>

                  {param.type === 'string' && (
                    <input
                      type="text"
                      placeholder={param.placeholder || ''}
                      value={params[param.name] ?? ''}
                      onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                      className="w-full bg-[#090d16] border border-slate-700/80 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                    />
                  )}

                  {param.type === 'number' && (
                    <input
                      type="number"
                      min={param.min}
                      max={param.max}
                      step={param.step || 1}
                      value={params[param.name] ?? ''}
                      onChange={(e) => setParams({ ...params, [param.name]: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#090d16] border border-slate-700/80 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                    />
                  )}

                  {param.type === 'select' && (
                    <select
                      value={params[param.name] ?? ''}
                      onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                      className="w-full bg-[#090d16] border border-slate-700/80 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono transition-colors cursor-pointer"
                    >
                      {param.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {param.type === 'boolean' && (
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params[param.name] ?? false}
                        onChange={(e) => setParams({ ...params, [param.name]: e.target.checked })}
                        className="w-4 h-4 rounded bg-[#090d16] border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400">
                        {params[param.name] ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  )}

                  {param.description && (
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Shell Command Preview */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Command Preview
                </span>
                <button
                  onClick={handleCopyCommand}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
                >
                  {copiedCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCommand ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded bg-[#080c14] border border-slate-800/80 font-mono text-[11px] text-cyan-300 overflow-x-auto break-all select-all">
                {commandString}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Abort Execution</span>
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Tool</span>
                </button>
              )}

              <button
                onClick={handleClear}
                title="Clear console output"
                className="p-2 rounded-md border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Console & Findings (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden flex flex-col min-h-[580px]">
            {/* Header Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'terminal'
                      ? 'bg-slate-800 text-cyan-300 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Live Terminal</span>
                  {isRunning && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('findings')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'findings'
                      ? 'bg-slate-800 text-cyan-300 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Structured Findings</span>
                  {parsedFindings && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-cyan-300 font-mono ml-1">
                      New
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('export')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'export'
                      ? 'bg-slate-800 text-cyan-300 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Audit Export</span>
                </button>
              </div>

              {/* Status / Timing Badge */}
              <div className="flex items-center gap-2">
                {executionDuration !== null && (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{(executionDuration / 1000).toFixed(2)}s</span>
                  </span>
                )}
                {isRunning && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Executing</span>
                  </span>
                )}
              </div>
            </div>

            {/* TAB 1: Live Terminal Output */}
            {activeTab === 'terminal' && (
              <div className="flex-1 flex flex-col bg-[#050811]">
                {/* Terminal Toolbar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0f1d] border-b border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter terminal lines..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="bg-transparent text-slate-300 placeholder-slate-600 focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                        className="w-3 h-3 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Auto-scroll</span>
                    </label>
                    <button
                      onClick={handleCopyLogs}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Terminal Screen */}
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto max-h-[500px] select-text">
                  {logs.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600 select-none">
                      <Terminal className="w-8 h-8 mb-2 opacity-40" />
                      <p>Console idle. Configure parameters and click 'Execute Tool'.</p>
                    </div>
                  ) : (
                    <div>
                      {filteredLogs.map((chunk, index) => (
                        <span key={index} className="whitespace-pre-wrap leading-relaxed">
                          {renderAnsiText(chunk)}
                        </span>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Structured Findings */}
            {activeTab === 'findings' && (
              <div className="flex-1 p-5 overflow-y-auto max-h-[540px] space-y-4">
                {!parsedFindings ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center">
                    <Layers className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
                    <p className="text-sm font-medium text-slate-300">No Structured Findings Available</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Execute a scan to generate parsed endpoint tables, port fingerprints, or password analytics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Banner */}
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider">
                          Scan Intelligence Summary
                        </div>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {parsedFindings.summary || 'Assessment completed successfully'}
                        </p>
                      </div>
                      {parsedFindings.grade && (
                        <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-lg font-bold font-mono text-cyan-300">
                          {parsedFindings.grade}
                        </div>
                      )}
                    </div>

                    {/* WordListGen Specific View */}
                    {parsedFindings.sample_entries && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            Generated Target Passwords ({parsedFindings.total_generated} variants)
                          </span>
                        </div>
                        <div className="rounded border border-slate-800 overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Candidate</th>
                                <th className="p-2.5">Length</th>
                                <th className="p-2.5">Entropy</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {parsedFindings.sample_entries.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                  <td className="p-2.5 text-cyan-300 font-semibold">{item.password}</td>
                                  <td className="p-2.5 text-slate-400">{item.length}</td>
                                  <td className="p-2.5 text-emerald-400">{item.entropy} bits</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* QuickBuster Specific View */}
                    {parsedFindings.endpoints && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            Discovered HTTP Endpoints ({parsedFindings.endpoints_found} found)
                          </span>
                        </div>
                        <div className="rounded border border-slate-800 overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Path / Route</th>
                                <th className="p-2.5">Size</th>
                                <th className="p-2.5">Latency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {parsedFindings.endpoints.map((ep: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                  <td className="p-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        ep.status < 300
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                          : ep.status < 400
                                          ? 'bg-sky-950 text-sky-400 border border-sky-800/60'
                                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                                      }`}
                                    >
                                      {ep.status}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-white font-medium">{ep.path}</td>
                                  <td className="p-2.5 text-slate-400">{ep.size_bytes} B</td>
                                  <td className="p-2.5 text-slate-400">{ep.latency_ms}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Async Banner Scanner Specific View */}
                    {parsedFindings.open_ports && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            Discovered Open Ports & Service Banners ({parsedFindings.open_ports_count} open)
                          </span>
                        </div>
                        <div className="rounded border border-slate-800 overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                              <tr>
                                <th className="p-2.5">Port</th>
                                <th className="p-2.5">Service</th>
                                <th className="p-2.5">Latency</th>
                                <th className="p-2.5">Grabbed Banner</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {parsedFindings.open_ports.map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                  <td className="p-2.5 text-emerald-400 font-bold">{p.port}/tcp</td>
                                  <td className="p-2.5 text-cyan-300">{p.service}</td>
                                  <td className="p-2.5 text-slate-400">{p.latency_ms}ms</td>
                                  <td className="p-2.5 text-slate-300 max-w-xs truncate">
                                    {p.banner || <span className="text-slate-600">(no banner)</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* HTTP Security Headers Specific View */}
                    {parsedFindings.findings && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-300">
                            OWASP Security Header Posture Check
                          </span>
                        </div>
                        <div className="space-y-2">
                          {parsedFindings.findings.map((h: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3 rounded border text-xs ${
                                h.status === 'pass'
                                  ? 'bg-emerald-950/20 border-emerald-800/40'
                                  : 'bg-rose-950/20 border-rose-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-white">{h.header}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    h.status === 'pass' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                                  }`}
                                >
                                  {h.status === 'pass' ? 'PRESENT' : 'MISSING'}
                                </span>
                              </div>
                              <p className="mt-1 text-slate-400 text-[11px]">{h.description}</p>
                              {h.recommendation && (
                                <p className="mt-1 font-mono text-[11px] text-amber-300">
                                  Recommendation: {h.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Audit Export */}
            {activeTab === 'export' && (
              <div className="flex-1 p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Generate Security Audit Artifacts</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Export verifiable audit evidence, parsed vulnerability telemetry, and executive summaries for your team.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-white font-medium text-xs">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>Markdown Audit Report</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-normal">
                        Ready-to-commit technical audit file including targets, flags, raw terminal proof, and findings.
                      </p>
                    </div>
                    <button
                      onClick={handleExportMarkdown}
                      className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .md</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-white font-medium text-xs">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>Structured JSON Findings</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-normal">
                        Machine-readable telemetry for pipeline integration, SIEM ingestion, or automated tracking.
                      </p>
                    </div>
                    <button
                      onClick={handleExportJSON}
                      className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .json</span>
                    </button>
                  </div>
                </div>

                {/* Raw JSON Preview */}
                {parsedFindings && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-slate-400">Findings Schema Payload:</span>
                    <pre className="p-3 rounded bg-[#090d16] border border-slate-800 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-48">
                      {JSON.stringify(parsedFindings, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
