import React, { useState } from 'react';
import { ToolDefinition, ToolParameter, ParameterType } from '../types/tool';
import { registerTool, deleteTool } from '../utils/api';
import {
  Wrench,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Download,
  Upload,
  Code,
  Github,
  Sparkles,
  Check,
  AlertCircle,
  FileCode,
  Play
} from 'lucide-react';

interface ToolManagerViewProps {
  tools: ToolDefinition[];
  onRefreshTools: () => void;
  onToggleAttached: (toolId: string, attached: boolean) => void;
  onLaunchTool: (toolId: string) => void;
}

export const ToolManagerView: React.FC<ToolManagerViewProps> = ({
  tools,
  onRefreshTools,
  onToggleAttached,
  onLaunchTool,
}) => {
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectMethod, setConnectMethod] = useState<'builder' | 'manifest' | 'github'>('builder');

  // Method 1: Visual Builder State
  const [builderId, setBuilderId] = useState<string>('');
  const [builderName, setBuilderName] = useState<string>('');
  const [builderAuthor, setBuilderAuthor] = useState<string>('');
  const [builderGithub, setBuilderGithub] = useState<string>('');
  const [builderCategory, setBuilderCategory] = useState<'web' | 'recon' | 'network' | 'crypto' | 'custom'>('custom');
  const [builderDescription, setBuilderDescription] = useState<string>('');
  const [builderScript, setBuilderScript] = useState<string>(`#!/usr/bin/env python3
import argparse
import sys
import time

def main():
    parser = argparse.ArgumentParser(description="Custom Security Tool")
    parser.add_argument("--target", "-t", required=True, help="Target host or URL")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()

    print("[*] Starting audit against:", args.target)
    time.sleep(1)
    print("[+] Audit complete. No critical vulnerabilities found.")

if __name__ == "__main__":
    main()
`);
  const [builderParams, setBuilderParams] = useState<ToolParameter[]>([
    {
      name: 'target',
      flag: '--target',
      type: 'string',
      label: 'Target Address',
      placeholder: 'example.com',
      defaultValue: '127.0.0.1',
      required: true,
      description: 'Host, IP, or URL to inspect',
    },
    {
      name: 'verbose',
      flag: '--verbose',
      type: 'boolean',
      label: 'Verbose Output',
      defaultValue: true,
      description: 'Print detailed execution steps',
    },
  ]);

  // Method 2: Raw Manifest JSON Upload / Paste
  const [manifestJsonText, setManifestJsonText] = useState<string>('');

  // Method 3: GitHub Repo Import
  const [githubUrlInput, setGithubUrlInput] = useState<string>('');
  const [githubImporting, setGithubImporting] = useState<boolean>(false);

  // Status & Feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Helper to add a parameter in the builder
  const handleAddParam = () => {
    setBuilderParams([
      ...builderParams,
      {
        name: `param_${builderParams.length + 1}`,
        flag: `--param-${builderParams.length + 1}`,
        type: 'string',
        label: `Parameter ${builderParams.length + 1}`,
        defaultValue: '',
        required: false,
      },
    ]);
  };

  const handleUpdateParam = (index: number, updates: Partial<ToolParameter>) => {
    const updated = [...builderParams];
    updated[index] = { ...updated[index], ...updates };
    setBuilderParams(updated);
  };

  const handleRemoveParam = (index: number) => {
    setBuilderParams(builderParams.filter((_, i) => i !== index));
  };

  // Submit via Visual Builder
  const handleSaveFromBuilder = async () => {
    if (!builderName.trim()) {
      setFormError('Please enter a tool name.');
      return;
    }
    const slug = (builderId || builderName).toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    setIsSubmitting(true);
    setFormError(null);

    try {
      await registerTool({
        id: slug,
        name: builderName,
        version: '1.0.0',
        author: builderAuthor || 'Security Expert',
        githubUrl: builderGithub,
        category: builderCategory,
        description: builderDescription || 'Custom security CLI tool',
        parameters: builderParams,
        scriptContent: builderScript,
        outputParser: { type: 'auto' },
      });

      setFormSuccess(`Tool "${builderName}" registered and attached successfully!`);
      setTimeout(() => {
        setShowConnectModal(false);
        setFormSuccess(null);
        onRefreshTools();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save tool');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit via Manifest JSON
  const handleSaveFromManifest = async () => {
    try {
      const parsed = JSON.parse(manifestJsonText);
      if (!parsed.id || !parsed.name || !parsed.parameters) {
        throw new Error('Manifest must contain "id", "name", and "parameters" array.');
      }
      setIsSubmitting(true);
      setFormError(null);

      await registerTool(parsed);
      setFormSuccess(`Manifest "${parsed.name}" imported and attached!`);
      setTimeout(() => {
        setShowConnectModal(false);
        setFormSuccess(null);
        onRefreshTools();
      }, 1200);
    } catch (err: any) {
      setFormError(`Invalid Manifest JSON: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit via GitHub Link (Scaffolding manifest)
  const handleImportGitHub = async () => {
    if (!githubUrlInput.trim()) {
      setFormError('Please provide a valid GitHub repository URL.');
      return;
    }

    setGithubImporting(true);
    setFormError(null);

    try {
      const match = githubUrlInput.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format. Use https://github.com/username/repo');
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Scaffold tool based on GitHub repository
      const scaffoldedTool: Partial<ToolDefinition> = {
        id: cleanRepo.toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
        name: cleanRepo.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        version: '1.0.0',
        author: owner,
        githubUrl: githubUrlInput.trim(),
        category: 'custom',
        description: `Connected from GitHub repository ${owner}/${cleanRepo}`,
        parameters: [
          {
            name: 'target',
            flag: '-t',
            type: 'string',
            label: 'Target Host / Domain',
            placeholder: 'example.com',
            defaultValue: '127.0.0.1',
            required: true,
          },
          {
            name: 'concurrency',
            flag: '-c',
            type: 'number',
            label: 'Concurrency',
            defaultValue: 10,
          },
        ],
        entrypoint: `tools/${cleanRepo}/main.py`,
      };

      await registerTool(scaffoldedTool);
      setFormSuccess(`Repository "${cleanRepo}" connected and attached to dashboard!`);
      setTimeout(() => {
        setShowConnectModal(false);
        setFormSuccess(null);
        onRefreshTools();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setGithubImporting(false);
    }
  };

  const handleExportManifest = (tool: ToolDefinition) => {
    const json = JSON.stringify(tool, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest_${tool.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteTool = async (toolId: string) => {
    if (confirm(`Are you sure you want to detach and remove tool "${toolId}"?`)) {
      await deleteTool(toolId);
      onRefreshTools();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Tool Management & Integration Hub</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Attach or detach security tools, connect new repositories, or author custom Python tools using the CyberTool Specification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect / Author Tool</span>
          </button>
        </div>
      </div>

      {/* Tool Attachment Inventory Table */}
      <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-white uppercase tracking-wider">
            Connected Tools ({tools.length} Registered)
          </div>
          <span className="text-xs text-slate-400">
            {tools.filter((t) => t.attached).length} currently active in runner
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/30 text-slate-400 font-medium border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Tool Name & Author</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 font-mono">Entrypoint</th>
                <th className="py-3 px-4">CLI Params</th>
                <th className="py-3 px-4">Workspace Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{tool.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      by {tool.author} · v{tool.version}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                      {tool.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {tool.entrypoint}
                  </td>

                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {tool.parameters.length} flags
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => onToggleAttached(tool.id, !tool.attached)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${
                        tool.attached
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {tool.attached ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Attached</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Detached</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tool.attached && (
                        <button
                          onClick={() => onLaunchTool(tool.id)}
                          title="Open in Runner"
                          className="p-1.5 rounded hover:bg-slate-800 text-cyan-400 transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => handleExportManifest(tool)}
                        title="Export manifest.json"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {!tool.isBuiltIn && (
                        <button
                          onClick={() => handleDeleteTool(tool.id)}
                          title="Remove custom tool"
                          className="p-1.5 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connect Tool Modal / Slide-over */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h3 className="text-base font-bold text-white">Connect / Author Security Tool</h3>
                <p className="text-xs text-slate-400">
                  Easily add your own Python CLI scripts or import external manifests.
                </p>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Method Tabs */}
            <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-800/80 bg-slate-900/20">
              <button
                onClick={() => setConnectMethod('builder')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  connectMethod === 'builder'
                    ? 'border-cyan-400 text-cyan-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Interactive Tool Builder</span>
              </button>

              <button
                onClick={() => setConnectMethod('github')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  connectMethod === 'github'
                    ? 'border-cyan-400 text-cyan-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>Import from GitHub</span>
              </button>

              <button
                onClick={() => setConnectMethod('manifest')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  connectMethod === 'manifest'
                    ? 'border-cyan-400 text-cyan-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Raw Manifest JSON</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* METHOD 1: VISUAL TOOL BUILDER */}
              {connectMethod === 'builder' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300">Tool Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Subdomain Recon Prober"
                        value={builderName}
                        onChange={(e) => setBuilderName(e.target.value)}
                        className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300">Tool Slug / ID</label>
                      <input
                        type="text"
                        placeholder="e.g. subdomain_recon"
                        value={builderId}
                        onChange={(e) => setBuilderId(e.target.value)}
                        className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300">Author</label>
                      <input
                        type="text"
                        placeholder="Your name or team"
                        value={builderAuthor}
                        onChange={(e) => setBuilderAuthor(e.target.value)}
                        className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300">Category</label>
                      <select
                        value={builderCategory}
                        onChange={(e) => setBuilderCategory(e.target.value as any)}
                        className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white cursor-pointer"
                      >
                        <option value="custom">Custom Tool</option>
                        <option value="recon">Recon & OSINT</option>
                        <option value="web">Web Security</option>
                        <option value="network">Network & Ports</option>
                        <option value="crypto">Cryptography / Hashes</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300">GitHub Link</label>
                      <input
                        type="text"
                        placeholder="https://github.com/..."
                        value={builderGithub}
                        onChange={(e) => setBuilderGithub(e.target.value)}
                        className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Brief description of what this tool audits..."
                      value={builderDescription}
                      onChange={(e) => setBuilderDescription(e.target.value)}
                      className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded p-2 text-xs text-white"
                    />
                  </div>

                  {/* Parameter Schema Builder */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">CLI Parameters / Arguments</span>
                      <button
                        onClick={handleAddParam}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Parameter</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {builderParams.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                        >
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              placeholder="Name (e.g. target)"
                              value={p.name}
                              onChange={(e) => handleUpdateParam(idx, { name: e.target.value })}
                              className="w-full bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              placeholder="Flag (-t)"
                              value={p.flag}
                              onChange={(e) => handleUpdateParam(idx, { flag: e.target.value })}
                              className="w-full bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <select
                              value={p.type}
                              onChange={(e) => handleUpdateParam(idx, { type: e.target.value as ParameterType })}
                              className="w-full bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="string">String / Text</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean Switch</option>
                              <option value="select">Dropdown Select</option>
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <input
                              type="text"
                              placeholder="Default value"
                              value={String(p.defaultValue ?? '')}
                              onChange={(e) => handleUpdateParam(idx, { defaultValue: e.target.value })}
                              className="w-full bg-[#090d16] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div className="md:col-span-1 text-right">
                            <button
                              onClick={() => handleRemoveParam(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Python Script Code Editor */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                      <span>Python Script (main.py)</span>
                      <span className="text-[11px] font-mono text-cyan-400">Executed by python3</span>
                    </label>
                    <textarea
                      rows={6}
                      value={builderScript}
                      onChange={(e) => setBuilderScript(e.target.value)}
                      className="w-full bg-[#050811] border border-slate-700 rounded p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* METHOD 2: GITHUB IMPORTER */}
              {connectMethod === 'github' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300">GitHub Repository Link</label>
                    <div className="mt-1 relative">
                      <Github className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="https://github.com/username/my-security-tool"
                        value={githubUrlInput}
                        onChange={(e) => setGithubUrlInput(e.target.value)}
                        className="w-full bg-[#090d16] border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Enter the public repository URL. CyberSuite will parse the repository metadata, create a CyberTool manifest scaffold, and connect it to your workspace.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <span className="font-semibold text-white">Repository Integration Guide:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Your repository can include a <code className="text-cyan-400 font-mono">manifest.json</code> in its root directory for custom parameters.</li>
                      <li>Standard entrypoints like <code className="text-cyan-400 font-mono">main.py</code> or <code className="text-cyan-400 font-mono">cli.py</code> will be automatically executed.</li>
                      <li>Standard ANSI outputs and <code className="text-cyan-400 font-mono">&lt;&lt;&lt;CYBERSUITE_FINDINGS_JSON&gt;&gt;&gt;</code> blocks will be parsed into visual cards.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* METHOD 3: RAW MANIFEST JSON */}
              {connectMethod === 'manifest' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Paste CyberTool Manifest JSON</label>
                    <button
                      onClick={() =>
                        setManifestJsonText(
                          JSON.stringify(
                            {
                              $schema: 'cybertool-v1',
                              id: 'custom-scanner',
                              name: 'Custom Network Prober',
                              version: '1.0.0',
                              author: 'SecOps Team',
                              category: 'network',
                              description: 'Fast custom socket prober',
                              entrypoint: 'tools/custom_scanner/main.py',
                              attached: true,
                              parameters: [
                                {
                                  name: 'target',
                                  flag: '-t',
                                  type: 'string',
                                  label: 'Target Host',
                                  defaultValue: '127.0.0.1',
                                  required: true,
                                },
                              ],
                            },
                            null,
                            2
                          )
                        )
                      }
                      className="text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      Insert Example Schema
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={manifestJsonText}
                    onChange={(e) => setManifestJsonText(e.target.value)}
                    placeholder='{ "$schema": "cybertool-v1", "id": "my-tool", ... }'
                    className="w-full bg-[#050811] border border-slate-700 rounded p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {connectMethod === 'builder' && (
                <button
                  disabled={isSubmitting}
                  onClick={handleSaveFromBuilder}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Attach Tool'}
                </button>
              )}

              {connectMethod === 'github' && (
                <button
                  disabled={githubImporting}
                  onClick={handleImportGitHub}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  {githubImporting ? 'Connecting...' : 'Connect Repository'}
                </button>
              )}

              {connectMethod === 'manifest' && (
                <button
                  disabled={isSubmitting}
                  onClick={handleSaveFromManifest}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Importing...' : 'Validate & Attach'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
