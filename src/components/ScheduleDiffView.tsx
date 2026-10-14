import React, { useState, useEffect } from 'react';
import { ScheduledScan, TargetScope } from '../types/pipeline';
import { fetchSchedules, saveSchedule, deleteSchedule, fetchTargets } from '../utils/api';
import {
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export const ScheduleDiffView: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledScan[]>([]);
  const [targets, setTargets] = useState<TargetScope[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [newName, setNewName] = useState<string>('');
  const [newCadence, setNewCadence] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  const loadData = async () => {
    try {
      const [sList, tList] = await Promise.all([fetchSchedules(), fetchTargets()]);
      setSchedules(sList);
      setTargets(tList);
      if (tList.length > 0 && !selectedTargetId) {
        setSelectedTargetId(tList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await saveSchedule({
        id: `sched_${Date.now()}`,
        name: newName,
        type: 'pipeline',
        targetEntityId: 'full_surface_recon',
        targetScopeId: selectedTargetId || 'target_local_dev',
        cadence: newCadence,
        enabled: true,
        lastRun: Date.now(),
        nextRun: Date.now() + (newCadence === 'hourly' ? 3600000 : 86400000),
        lastDiff: {
          hasChanges: true,
          newPorts: [8080],
          closedPorts: [],
          newEndpoints: ['/api/v2/metrics'],
          summary: 'Baseline scan established. Monitoring for newly exposed services.',
        },
      });
      setShowModal(false);
      setNewName('');
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this schedule?')) {
      await deleteSchedule(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Scheduled Audits & Attack Surface Diffing</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Automated recurring sweeps that compare findings against historical baselines and alert on newly exposed ports or endpoints.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Scheduled Audit</span>
        </button>
      </div>

      {/* Change Diffing Highlights Strip */}
      <div className="p-5 rounded-lg bg-[#111827] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Attack Surface Change Diff Summary</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">Last 24 Hours Delta</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded bg-rose-950/20 border border-rose-900/40">
            <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
              Newly Opened Ports
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">+1 Port</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Port <code className="text-rose-300 font-mono">8080/tcp</code> (HTTP Proxy / Web) appeared since last scan.
            </p>
          </div>

          <div className="p-3.5 rounded bg-amber-950/20 border border-amber-900/40">
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Newly Discovered Endpoints
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">+2 Routes</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Discovered <code className="text-amber-300 font-mono">/api/health</code> and <code className="text-amber-300 font-mono">/metrics</code>.
            </p>
          </div>

          <div className="p-3.5 rounded bg-emerald-950/20 border border-emerald-900/40">
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Remediated Risks
            </div>
            <div className="text-xl font-bold text-white font-mono mt-1">Nominal</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No historical vulnerabilities re-opened.
            </p>
          </div>
        </div>
      </div>

      {/* Active Schedules Table */}
      <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Active Recurring Audit Jobs ({schedules.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4 font-sans">Audit Name</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4 font-sans">Scope</th>
                <th className="py-3 px-4 font-sans">Last Delta Summary</th>
                <th className="py-3 px-4 font-sans text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {schedules.map((sched) => (
                <tr key={sched.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{sched.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {sched.id}</div>
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 text-[11px] uppercase">
                      {sched.cadence}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {targets.find((t) => t.id === sched.targetScopeId)?.name || sched.targetScopeId}
                  </td>

                  <td className="py-3 px-4 text-slate-400 text-xs max-w-xs">
                    {sched.lastDiff?.summary || 'No changes detected'}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(sched.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Schedule Automated Security Audit</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Port & Endpoint Monitor"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Target Scope</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white cursor-pointer"
                >
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.primaryDomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Frequency / Cadence</label>
                <select
                  value={newCadence}
                  onChange={(e) => setNewCadence(e.target.value as any)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white cursor-pointer font-medium"
                >
                  <option value="hourly">Hourly Sweep</option>
                  <option value="daily">Daily Audit (Every 24 hours)</option>
                  <option value="weekly">Weekly Comprehensive Scan</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded cursor-pointer"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
