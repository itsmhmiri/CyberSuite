import React, { useState, useEffect } from 'react';
import { WebhookConfig } from '../types/pipeline';
import { fetchWebhooks, saveWebhook, deleteWebhook, testWebhook } from '../utils/api';
import { Bell, Plus, Trash2, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface WebhookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookSettingsModal: React.FC<WebhookSettingsModalProps> = ({ isOpen, onClose }) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [platform, setPlatform] = useState<'discord' | 'slack' | 'telegram' | 'custom'>('discord');
  const [url, setUrl] = useState<string>('');
  const [alertOnComplete, setAlertOnComplete] = useState<boolean>(true);
  const [alertOnFailure, setAlertOnFailure] = useState<boolean>(true);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const hooks = await fetchWebhooks();
      setWebhooks(hooks);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!url.trim()) return;
    try {
      await saveWebhook({
        id: `hook_${Date.now()}`,
        platform,
        url,
        enabled: true,
        alertOnComplete,
        alertOnFailure,
        alertOnlyOnChanges: false,
      });
      setUrl('');
      await loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteWebhook(id);
    await loadData();
  };

  const handleTest = async (testUrl: string, testPlatform: string) => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await testWebhook(testPlatform, testUrl);
      setTestStatus(res.message || 'Alert dispatched successfully!');
    } catch (e: any) {
      setTestStatus(`Error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Multi-Channel Webhook Notifications</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add Webhook Form */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Add New Notification Channel
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
                >
                  <option value="discord">Discord Webhook</option>
                  <option value="slack">Slack Incoming Webhook</option>
                  <option value="telegram">Telegram Bot</option>
                  <option value="custom">Generic REST Webhook</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-slate-300">Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full bg-[#090d16] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnComplete}
                    onChange={(e) => setAlertOnComplete(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span>Alert on scan completion</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnFailure}
                    onChange={(e) => setAlertOnFailure(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span>Alert on errors</span>
                </label>
              </div>

              <button
                onClick={handleSave}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded cursor-pointer"
              >
                Add Channel
              </button>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testStatus && (
            <div className="p-3 rounded bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* Connected Webhooks List */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Connected Webhooks ({webhooks.length})
            </span>

            {webhooks.length === 0 ? (
              <div className="p-6 rounded bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                No webhooks configured. Add your Discord or Slack webhook URL above.
              </div>
            ) : (
              <div className="space-y-2">
                {webhooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-sans font-semibold text-white">
                        <span className="capitalize">{hook.platform}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                        {hook.url}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-sans">
                      <button
                        disabled={isTesting}
                        onClick={() => handleTest(hook.url, hook.platform)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 rounded text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3 text-cyan-400" />
                        <span>Test Alert</span>
                      </button>
                      <button
                        onClick={() => handleDelete(hook.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
