import React, { useState, useEffect } from 'react';
import { TargetScope, DiscoveredAsset } from '../types/pipeline';
import { fetchTargets, saveTarget, deleteTarget, fetchAssets } from '../utils/api';
import {
  Globe,
  Shield,
  Plus,
  Trash2,
  Play,
  Layers,
  Search,
  ExternalLink,
  CheckCircle2,
  Server,
  Network,
  Clock,
  Filter
} from 'lucide-react';

interface TargetScopeViewProps {
  onAuditTarget: (targetDomain: string) => void;
}

export const TargetScopeView: React.FC<TargetScopeViewProps> = ({ onAuditTarget }) => {
  const [targets, setTargets] = useState<TargetScope[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [assets, setAssets] = useState<DiscoveredAsset[]>([]);
  const [assetFilter, setAssetFilter] = useState<'all' | 'port' | 'endpoint'>('all');
  const [searchAsset, setSearchAsset] = useState<string>('');

  // New Target Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string>('');
  const [newOrg, setNewOrg] = useState<string>('');
  const [newCidr, setNewCidr] = useState<string>('');
  const [newExclusions, setNewExclusions] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');

  const loadData = async () => {
    try {
      const [tList, aList] = await Promise.all([fetchTargets(), fetchAssets()]);
      setTargets(tList);
      setAssets(aList);
      if (!selectedTargetId && tList.length > 0) {
        setSelectedTargetId(tList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];

  const handleCreateTarget = async () => {
    if (!newName.trim() || !newDomain.trim()) return;
    try {
      await saveTarget({
        id: `target_${Date.now()}`,
        name: newName,
        primaryDomain: newDomain,
        organization: newOrg || 'Security Audit Group',
        ipRanges: newCidr ? newCidr.split(',').map((s) => s.trim()) : [],
        hostnames: [newDomain],
        exclusions: newExclusions ? newExclusions.split(',').map((s) => s.trim()) : [],
        description: newDesc || 'Target scope for security assessment',
        lastScanned: Date.now(),
      });
      setShowModal(false);
      setNewName('');
      setNewDomain('');
      setNewOrg('');
      setNewCidr('');
      setNewExclusions('');
      setNewDesc('');
      await loadData();
    } catch (e: any) {
      alert(`Error saving target: ${e.message}`);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (confirm('Delete this target profile?')) {
      await deleteTarget(id);
      await loadData();
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesTarget = !selectedTarget || a.targetId === selectedTarget.primaryDomain || a.targetId.includes(selectedTarget.primaryDomain);
    const matchesType = assetFilter === 'all' || a.type === assetFilter;
    const matchesSearch = a.value.toLowerCase().includes(searchAsset.toLowerCase());
    return matchesTarget && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span>Target Scopes & Discovered Asset Ledger</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Persistent attack surface management. Map client organizations, define approved CIDRs, and track discovered assets.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target Profile</span>
        </button>
      </div>

      {/* Main Grid: Target Profiles (Left) + Asset Ledger (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Scope Profiles (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Target Profiles ({targets.length})
            </span>
          </div>

          <div className="space-y-3">
            {targets.map((target) => {
              const isSelected = selectedTarget?.id === target.id;
              return (
                <div
                  key={target.id}
                  onClick={() => setSelectedTargetId(target.id)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/80 shadow-xs'
                      : 'bg-[#111827] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{target.name}</div>
                      <div className="text-xs text-cyan-400 font-mono mt-0.5">{target.primaryDomain}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {target.organization}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {target.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-slate-500">
                      CIDR: {target.ipRanges?.length ? target.ipRanges.join(', ') : 'Single Host'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAuditTarget(target.primaryDomain);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Audit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTarget(target.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Discovered Asset Ledger (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg bg-[#111827] border border-slate-800 overflow-hidden flex flex-col min-h-[500px]">
            {/* Toolbar */}
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span>Discovered Assets ({selectedTarget?.name || 'All Scopes'})</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatically logged from port scans, directory fuzzing, and SSL audits.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
                  <button
                    onClick={() => setAssetFilter('all')}
                    className={`px-2 py-1 text-[11px] font-medium rounded ${
                      assetFilter === 'all' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAssetFilter('port')}
                    className={`px-2 py-1 text-[11px] font-medium rounded ${
                      assetFilter === 'port' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    Ports
                  </button>
                  <button
                    onClick={() => setAssetFilter('endpoint')}
                    className={`px-2 py-1 text-[11px] font-medium rounded ${
                      assetFilter === 'endpoint' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400'
                    }`}
                  >
                    Endpoints
                  </button>
                </div>
              </div>
            </div>

            {/* Assets Table */}
            {filteredAssets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <Network className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-sm font-medium text-slate-300">No Discovered Assets for this Scope</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Run a port scan or directory discovery audit against this target to populate the attack surface ledger.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-sans">Type</th>
                      <th className="py-2.5 px-4">Discovered Asset</th>
                      <th className="py-2.5 px-4 font-sans">Scope</th>
                      <th className="py-2.5 px-4 font-sans">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-sans">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              asset.type === 'port'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                : 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                            }`}
                          >
                            {asset.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-white font-medium">{asset.value}</td>
                        <td className="py-2.5 px-4 text-slate-400 font-sans">{asset.targetId}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-sans text-[11px]">
                          {new Date(asset.discoveredAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Target Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Target Scope Profile</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Profile Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Production Cloud"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">Primary Domain / Host *</label>
                <input
                  type="text"
                  placeholder="e.g. acmeprod.com or 192.168.1.50"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">Organization / Client</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Security Inc."
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">IP Ranges / CIDR (comma-separated)</label>
                <input
                  type="text"
                  placeholder="10.0.0.0/24, 192.168.1.0/28"
                  value={newCidr}
                  onChange={(e) => setNewCidr(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">Exclusions / Out-of-Scope</label>
                <input
                  type="text"
                  placeholder="payment.acme.com, 10.0.0.5"
                  value={newExclusions}
                  onChange={(e) => setNewExclusions(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                />
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
                onClick={handleCreateTarget}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded cursor-pointer"
              >
                Save Target Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
