import React from 'react';
import { Terminal, Shield, Play, ListOrdered, Wrench, BookOpen, Activity, GitBranch, Globe, Clock, Bell, FileText } from 'lucide-react';

export type NavTab = 'dashboard' | 'catalog' | 'runner' | 'pipelines' | 'targets' | 'schedules' | 'tasks' | 'manager' | 'guide';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeTaskCount: number;
  totalToolsCount: number;
  onOpenWebhooks: () => void;
  onOpenExecutiveReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  activeTaskCount,
  onOpenWebhooks,
  onOpenExecutiveReport,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'catalog', label: 'Tools', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'runner', label: 'Runner', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'pipelines', label: 'Pipelines', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: 'targets', label: 'Targets', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'schedules', label: 'Schedules & Diff', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'Queue', icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: 'manager', label: 'Manager', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'guide', label: 'Docs', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur border-b border-slate-800/80 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>CyberSuite</span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700/60 font-medium">
                  2.0
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-400 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 bg-slate-800/90 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'tasks' && activeTaskCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold animate-pulse">
                    {activeTaskCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action Hub */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenWebhooks}
            title="Configure Alert Webhooks"
            className="p-1.5 rounded border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenExecutiveReport}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Report</span>
          </button>

          <button
            onClick={() => onSelectTab('runner')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-all shadow-sm shadow-cyan-500/20 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Tool</span>
          </button>
        </div>
      </div>
    </header>
  );
};
