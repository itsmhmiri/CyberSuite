import React, { useState } from 'react';
import { BookOpen, Code, Terminal, Layers, FileCode, Check, Copy, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

export const DeveloperGuideView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'operator' | 'spec' | 'template' | 'manage' | 'validator'>('operator');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Playground validator state
  const [playgroundJson, setPlaygroundJson] = useState<string>(`{
  "$schema": "cybertool-v1",
  "id": "my_scanner",
  "name": "Subnet Port Prober",
  "version": "1.0.0",
  "author": "SecTeam",
  "category": "network",
  "description": "Scans subnet for open administrative ports",
  "entrypoint": "tools/my_scanner/main.py",
  "parameters": [
    {
      "name": "subnet",
      "flag": "--subnet",
      "type": "string",
      "label": "Target Subnet CIDR",
      "defaultValue": "192.168.1.0/24",
      "required": true
    },
    {
      "name": "ports",
      "flag": "--ports",
      "type": "string",
      "label": "Ports to Probe",
      "defaultValue": "22,80,443,8080"
    },
    {
      "name": "timeout",
      "flag": "--timeout",
      "type": "number",
      "label": "Socket Timeout",
      "defaultValue": 1.5
    },
    {
      "name": "stealth",
      "flag": "--stealth",
      "type": "boolean",
      "label": "Stealth Rate-limiting",
      "defaultValue": true
    }
  ]
}`);

  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; parsed?: any }>({
    valid: true,
  });

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleValidatePlayground = (text: string) => {
    setPlaygroundJson(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed.id) throw new Error('Field "id" is required (unique slug).');
      if (!parsed.name) throw new Error('Field "name" is required (display title).');
      if (!Array.isArray(parsed.parameters)) throw new Error('Field "parameters" must be an array.');
      for (const p of parsed.parameters) {
        if (!p.name || !p.flag || !p.type) {
          throw new Error(`Parameter missing required fields: name, flag, or type.`);
        }
      }
      setValidationResult({ valid: true, parsed });
    } catch (e: any) {
      setValidationResult({ valid: false, error: e.message });
    }
  };

  const pythonStarterCode = `#!/usr/bin/env python3
"""
Custom Security Tool - CyberSuite Standard Compliant
Compatible with unbuffered streaming and visual findings extraction.
"""

import argparse
import json
import sys
import time

# Optional ANSI colors for high-contrast live terminal display
RESET = "\\033[0m"
BOLD = "\\033[1m"
CYAN = "\\033[36m"
GREEN = "\\033[32m"
YELLOW = "\\033[33m"
BLUE = "\\033[34m"

def main():
    parser = argparse.ArgumentParser(description="Demonstration Security Tool")
    parser.add_argument("--target", "-t", required=True, help="Target host, domain, or IP")
    parser.add_argument("--threads", "-c", type=int, default=10, help="Concurrency workers")
    parser.add_argument("--stealth", action="store_true", help="Enable stealth mode")
    args = parser.parse_args()

    print(f"{CYAN}{BOLD}[*] Initializing audit against {args.target}...{RESET}")
    print(f"{BLUE}[*] Concurrency: {args.threads} workers | Stealth: {args.stealth}{RESET}")
    print()

    # Simulate inspection phases (with unbuffered live output)
    time.sleep(0.5)
    print(f"{GREEN}[+] Connected to target host successfully.{RESET}")
    time.sleep(0.5)
    print(f"{YELLOW}[!] Detected open port 8080 (Potential Admin Panel){RESET}")
    time.sleep(0.5)
    print(f"{GREEN}[+] Completed security inspection in 1.5s.{RESET}")
    print()

    # OPTIONAL: Emit structured JSON block for the dashboard's visual cards
    # Wrap your JSON summary between <<<CYBERSUITE_FINDINGS_JSON>>> tags:
    structured_findings = {
        "status": "success",
        "target": args.target,
        "summary": "Audit completed. Discovered 1 open administrative service.",
        "findings": [
            {
                "service": "HTTP Admin",
                "port": 8080,
                "severity": "Medium",
                "recommendation": "Restrict administrative access to authorized VPN subnets."
            }
        ]
    }

    print("<<<CYBERSUITE_FINDINGS_JSON>>>")
    print(json.dumps(structured_findings))
    print("<<<END_CYBERSUITE_FINDINGS_JSON>>>")

if __name__ == "__main__":
    main()
`;

  const manifestExample = `{
  "$schema": "cybertool-v1",
  "id": "my_security_tool",
  "name": "My Security Tool",
  "version": "1.0.0",
  "author": "YourName",
  "githubUrl": "https://github.com/yourname/my-security-tool",
  "category": "web",
  "tags": ["scanner", "recon", "python"],
  "description": "High-performance security scanner written in Python",
  "entrypoint": "tools/my_security_tool/main.py",
  "attached": true,
  "parameters": [
    {
      "name": "target",
      "flag": "--target",
      "type": "string",
      "label": "Target Host / IP",
      "placeholder": "example.com",
      "required": true,
      "description": "Hostname or IP to audit"
    },
    {
      "name": "threads",
      "flag": "--threads",
      "type": "number",
      "label": "Worker Threads",
      "defaultValue": 10,
      "min": 1,
      "max": 100
    },
    {
      "name": "stealth",
      "flag": "--stealth",
      "type": "boolean",
      "label": "Stealth Mode",
      "defaultValue": false
    }
  ],
  "outputParser": {
    "type": "auto"
  }
}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span>CyberSuite Documentation & Developer Guide</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Complete guide on running security tools, authoring new modular Python utilities, and managing connected tools.
        </p>
      </div>

      {/* Guide Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveSection('operator')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'operator'
              ? 'bg-slate-800 text-cyan-300 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Operator Manual (Running Tools)
        </button>
        <button
          onClick={() => setActiveSection('spec')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'spec'
              ? 'bg-slate-800 text-cyan-300 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. The CyberTool Specification
        </button>
        <button
          onClick={() => setActiveSection('template')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'template'
              ? 'bg-slate-800 text-cyan-300 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Writing Python Tools
        </button>
        <button
          onClick={() => setActiveSection('manage')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'manage'
              ? 'bg-slate-800 text-cyan-300 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Managing & Sharing Tools
        </button>
        <button
          onClick={() => setActiveSection('validator')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'validator'
              ? 'bg-slate-800 text-cyan-300 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          5. Live Manifest Validator
        </button>
      </div>

      {/* SECTION 1: OPERATOR MANUAL */}
      {activeSection === 'operator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-[#111827] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Section 1: Operator's Workflow & Dashboard Usage</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              CyberSuite provides a real-time operations console to execute CLI security tools in unbuffered background tasks without terminal clutter.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>1. Configure & Preview</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select any tool in the <strong>Runner</strong>. As you modify inputs (domains, ports, threads, flags), the command preview updates in real-time.
                </p>
              </div>

              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>2. Live Terminal Streaming</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong>Execute Tool</strong>. The backend spawns an unbuffered Python subprocess and streams ANSI-colored terminal output via Server-Sent Events (SSE).
                </p>
              </div>

              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3. Structured Findings & Export</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Switch to the <strong>Structured Findings</strong> tab to review parsed routes, open ports, and risk ratings. Export clean Markdown reports or JSON payloads anytime.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-[#111827] border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Pre-Loaded Default Tool Suite</h3>
            <p className="text-xs text-slate-400">
              CyberSuite ships with 3 pre-connected signature security utilities authored by <code>itsmhmiri</code>:
            </p>
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs">
                <div className="font-semibold text-white">WordListGen (Targeted OSINT Dictionary)</div>
                <p className="text-slate-400 mt-0.5">
                  Generates targeted password wordlists based on target human OSINT attributes (names, company, pets, years, seasons, leetspeak rules).
                </p>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs">
                <div className="font-semibold text-white">QuickBuster (Async HTTP Directory Fuzzer)</div>
                <p className="text-slate-400 mt-0.5">
                  High-speed asynchronous endpoint and directory discovery tool featuring smart 404 calibration to eliminate wildcard false positives.
                </p>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-xs">
                <div className="font-semibold text-white">Async Banner Scanner (TCP Port & Service Prober)</div>
                <p className="text-slate-400 mt-0.5">
                  Fast asynchronous TCP port prober and service banner grabber using Python native asyncio.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: THE CYBERTOOL SPEC */}
      {activeSection === 'spec' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">The CyberTool Manifest Standard (v1.0)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Every tool in CyberSuite is governed by a declarative <code>manifest.json</code>.
                </p>
              </div>
              <button
                onClick={() => handleCopy('spec_manifest', manifestExample)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedCode === 'spec_manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'spec_manifest' ? 'Copied' : 'Copy Manifest'}</span>
              </button>
            </div>

            <pre className="p-4 rounded bg-[#050811] border border-slate-800 text-cyan-300 text-xs font-mono overflow-x-auto">
              {manifestExample}
            </pre>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-white">Parameter Type Specifications:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <code className="text-cyan-400 font-bold font-mono">string</code>
                  <p className="text-slate-400 mt-1">
                    Text input. Passed to CLI as <code>&lt;flag&gt; &lt;value&gt;</code>. Supports <code>placeholder</code>, <code>defaultValue</code>, and <code>required</code>.
                  </p>
                </div>

                <div className="p-4 rounded bg-slate-900 border border-slate-800">
                  <code className="text-cyan-400 font-bold font-mono">number</code>
                  <p className="text-slate-400 mt-1">
                    Numeric stepper. Supports <code>min</code>, <code>max</code>, and <code>step</code>.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <code className="text-cyan-400 font-bold font-mono">boolean</code>
                  <p className="text-slate-400 mt-1">
                    Toggle switch. If true, the flag (e.g. <code>--verbose</code>) is appended to the CLI command.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <code className="text-cyan-400 font-bold font-mono">select</code>
                  <p className="text-slate-400 mt-1">
                    Dropdown selection. Provide an <code>options</code> array of valid strings (e.g. wordlist paths).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PYTHON TEMPLATE */}
      {activeSection === 'template' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-[#111827] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Starter Python Script Template (main.py)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Copy and customize this script to build your own tool for CyberSuite.
                </p>
              </div>
              <button
                onClick={() => handleCopy('python_code', pythonStarterCode)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedCode === 'python_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'python_code' ? 'Copied' : 'Copy Python Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded bg-[#050811] border border-slate-800 text-emerald-300 text-xs font-mono overflow-x-auto max-h-[500px]">
              {pythonStarterCode}
            </pre>

            <div className="p-4 rounded bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-white">Key Guidelines for Tool Authors:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
                <li>
                  <strong>Unbuffered I/O:</strong> CyberSuite automatically runs processes with <code className="text-cyan-400 font-mono">PYTHONUNBUFFERED=1</code> so outputs stream immediately to the dashboard.
                </li>
                <li>
                  <strong>ANSI Colors:</strong> Feel free to use standard ANSI codes (<code>\033[36m</code>, <code>\033[32m</code>). CyberSuite parses them into high-contrast colored web spans.
                </li>
                <li>
                  <strong>Structured Findings:</strong> Print your summary object between <code className="text-cyan-400 font-mono">&lt;&lt;&lt;CYBERSUITE_FINDINGS_JSON&gt;&gt;&gt;</code> tags. The dashboard will automatically extract and render it in the Structured Findings tab.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: MANAGING TOOLS */}
      {activeSection === 'manage' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-[#111827] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white">Managing, Attaching & Sharing Tools</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              CyberSuite makes it trivial to attach, detach, configure, or export tools across development teams.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-white">Attaching vs. Detaching Tools</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In the <strong>Tool Manager</strong>, toggle the <strong>Attached</strong> button for any tool. Detached tools remain registered in your library but won't clutter your active workspace or Runner dropdown.
                </p>
              </div>

              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-white">Sharing Tool Packages with Colleagues</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click the <strong>Download</strong> icon next to any tool in the Tool Manager to export its <code className="text-cyan-400 font-mono">manifest.json</code>. Your peers can then simply click <strong>Connect Tool &gt; Raw Manifest JSON</strong> and paste the file to immediately mount the tool!
                </p>
              </div>

              <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-xs font-semibold text-white">Connecting GitHub Repositories</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In the Connect Tool modal, select <strong>Import from GitHub</strong> and paste any public security tool link. CyberSuite scaffolds the manifest definition and links it directly to your workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: LIVE MANIFEST VALIDATOR */}
      {activeSection === 'validator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-[#111827] border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Interactive Manifest Playground & Validator</h2>
              <p className="text-xs text-slate-400 mt-1">
                Test your CyberTool manifest schema in real time before connecting it to the dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              {/* Left: JSON Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">manifest.json Playground:</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                      validationResult.valid
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {validationResult.valid ? 'Valid Schema' : 'Syntax / Schema Error'}
                  </span>
                </div>

                <textarea
                  rows={16}
                  value={playgroundJson}
                  onChange={(e) => handleValidatePlayground(e.target.value)}
                  className="w-full bg-[#050811] border border-slate-700 rounded p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                />

                {!validationResult.valid && (
                  <p className="text-xs text-rose-400 font-mono">
                    Error: {validationResult.error}
                  </p>
                )}
              </div>

              {/* Right: Real-time UI Preview */}
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live UI Preview
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-1">
                    {validationResult.parsed?.name || 'Tool Name'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {validationResult.parsed?.description || 'Description preview...'}
                  </p>
                </div>

                {/* Rendered mock parameters */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Generated Parameters:</span>
                  {validationResult.parsed?.parameters?.map((p: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{p.label || p.name}</span>
                        <code className="text-slate-500 text-[10px] font-mono">{p.flag}</code>
                      </div>
                      <input
                        disabled
                        type="text"
                        value={String(p.defaultValue ?? '')}
                        className="w-full bg-[#090d16] border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-400 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
