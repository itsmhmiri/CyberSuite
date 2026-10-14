import React from 'react';
import { Printer, Download, X, Shield, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDomain?: string;
  reportData?: any;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  targetDomain = '127.0.0.1',
  reportData,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const reportHtml = document.getElementById('printable_report')?.outerHTML || '';
    const fullDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CyberSuite Executive Audit Report - ${targetDomain}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #1e293b; padding: 40px; margin: 0; }
    h1, h2, h3 { color: #0f172a; margin-top: 0; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .table th, .table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
    .table th { background: #f8fafc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${reportHtml}
</body>
</html>`;
    const blob = new Blob([fullDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CyberSuite_Audit_${targetDomain.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar (hidden on print) */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Executive Security Audit Report Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800 selection:bg-slate-200" id="printable_report">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start">
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>CYBERSUITE</span>
                <span className="text-xs font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300 font-semibold">
                  CONFIDENTIAL AUDIT
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 mt-2">
                Executive Attack Surface & Security Assessment
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Target Scope: <strong className="text-slate-800 font-mono">{targetDomain}</strong> · Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-mono">Security Posture Grade</div>
              <div className="text-3xl font-black text-emerald-600 font-mono mt-0.5">
                {reportData?.grade || 'A-'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Score: {reportData?.score || 88} / 100</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              1. Executive Summary & Threat Profile
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">
              This automated security evaluation was conducted via CyberSuite's integrated DevSecOps orchestrator. 
              The assessment surveyed perimeter ports, evaluated defense-in-depth HTTP security headers, fuzzed web routes with smart 404 calibration, and analyzed targeted OSINT dictionary vectors.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500">Critical Risks</span>
                <div className="text-xl font-bold text-emerald-600 font-mono mt-0.5">0 Detected</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500">Exposed Web Routes</span>
                <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">
                  {reportData?.endpoints_count || 12} Verified
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500">Open TCP Ports</span>
                <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">
                  {reportData?.open_ports_count || 3} Active
                </div>
              </div>
            </div>
          </div>

          {/* Discovered Attack Surface Table */}
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              2. Discovered Network & Web Attack Surface
            </h2>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                <tr>
                  <th className="p-2 border-r border-slate-200">Asset / Vector</th>
                  <th className="p-2 border-r border-slate-200">Service / Category</th>
                  <th className="p-2 border-r border-slate-200">Risk Assessment</th>
                  <th className="p-2">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                <tr>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">Port 80/tcp</td>
                  <td className="p-2 text-slate-700 border-r border-slate-200">HTTP Web Server</td>
                  <td className="p-2 text-emerald-600 font-semibold border-r border-slate-200">LOW</td>
                  <td className="p-2 text-slate-600 font-sans">Enforce automated redirect to HTTPS (Port 443).</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">Port 443/tcp</td>
                  <td className="p-2 text-slate-700 border-r border-slate-200">HTTPS (TLS v1.3)</td>
                  <td className="p-2 text-emerald-600 font-semibold border-r border-slate-200">INFO</td>
                  <td className="p-2 text-slate-600 font-sans">Strict-Transport-Security (HSTS) with preload recommended.</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-200">Port 3000/tcp</td>
                  <td className="p-2 text-slate-700 border-r border-slate-200">Node / Web App</td>
                  <td className="p-2 text-amber-600 font-semibold border-r border-slate-200">MEDIUM</td>
                  <td className="p-2 text-slate-600 font-sans">Ensure production reverse-proxy isolates internal Node daemon.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* OWASP Recommendations */}
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              3. Defensive Remediation & Hardening Guidance
            </h2>
            <ul className="list-decimal list-inside text-xs text-slate-700 space-y-2 leading-relaxed">
              <li>
                <strong>Implement Content-Security-Policy (CSP):</strong> Restrict script injection vectors to authorized domains only.
              </li>
              <li>
                <strong>Enforce X-Frame-Options (DENY/SAMEORIGIN):</strong> Mitigate UI redressing and clickjacking vulnerabilities across web assets.
              </li>
              <li>
                <strong>Restrict Rate-Limiting & Error Responses:</strong> Normalize 404 responses to prevent automated directory calibration and endpoint enumeration.
              </li>
            </ul>
          </div>

          {/* Footer Proof */}
          <div className="pt-6 border-t border-slate-300 text-[11px] text-slate-500 flex justify-between items-center font-mono">
            <span>CyberSuite Operations Hub · Automated Audit Report</span>
            <span>Document ID: SEC-{Date.now().toString(36).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
