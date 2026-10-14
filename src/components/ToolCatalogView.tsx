import React, { useState } from 'react';
import { ToolDefinition, ToolCategory } from '../types/tool';
import { Search, Play, ExternalLink, Wrench, ShieldCheck, ShieldAlert, Sparkles, Plus } from 'lucide-react';
import { NavTab } from './Navbar';

interface ToolCatalogViewProps {
  tools: ToolDefinition[];
  onLaunchTool: (toolId: string) => void;
  onToggleAttached: (toolId: string, attached: boolean) => void;
  onSelectTab: (tab: NavTab) => void;
}

export const ToolCatalogView: React.FC<ToolCatalogViewProps> = ({
  tools,
  onLaunchTool,
  onToggleAttached,
  onSelectTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Tools' },
    { id: 'recon', label: 'Recon & OSINT' },
    { id: 'web', label: 'Web Security' },
    { id: 'network', label: 'Network & Ports' },
    { id: 'custom', label: 'Custom & Community' },
  ];

  const filteredTools = tools.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      tool.category === selectedCategory ||
      (selectedCategory === 'custom' && !tool.isBuiltIn);

    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Tool Catalog</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse and launch modular Python security assessment and auditing utilities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('manager')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect New Tool</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tools, flags, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Tool Grid */}
      {filteredTools.length === 0 ? (
        <div className="p-12 rounded-lg bg-[#111827] border border-slate-800 text-center">
          <p className="text-sm font-medium text-slate-300">No tools match your query</p>
          <p className="mt-1 text-xs text-slate-500">Try adjusting your filters or connect a new tool using the Tool Manager.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className={`p-5 rounded-lg bg-[#111827] border transition-all flex flex-col justify-between ${
                tool.attached
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/40 opacity-70 bg-slate-900/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white text-sm tracking-tight">{tool.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>by {tool.author}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px]">v{tool.version}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-medium shrink-0">
                    {tool.category}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {tool.description}
                </p>

                {/* Tags */}
                {tool.tags && tool.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {tool.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-800 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* GitHub link if available */}
                {tool.githubUrl && (
                  <div className="mt-3">
                    <a
                      href={tool.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-mono"
                    >
                      <span>{tool.githubUrl.replace('https://github.com/', '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleAttached(tool.id, !tool.attached)}
                    title={tool.attached ? 'Detach from active workspace' : 'Attach to active workspace'}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
                      tool.attached
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/40'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:bg-slate-800'
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
                </div>

                <button
                  disabled={!tool.attached}
                  onClick={() => onLaunchTool(tool.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    tool.attached
                      ? 'text-slate-950 bg-cyan-400 hover:bg-cyan-300'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Configure & Run</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
