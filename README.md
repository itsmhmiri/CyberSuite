# CyberSuite 🛡️
> **All-in-One Modular Cybersecurity CLI Dashboard & Task Orchestrator**

CyberSuite is an extensible, high-performance web dashboard that unifies command-line security utilities into a centralized operations console. Built around an open plugin specification, it enables security engineers and penetration testers to configure, execute, monitor, and visualize outputs from any Python CLI tool in real time.

---

## ⚡ Key Features

- **Decoupled Plugin Architecture (CyberTool Spec v1.0)**: Zero hardcoding. Tools are defined declaratively via `manifest.json`. Adding or extending tools requires no frontend code changes.
- **One-Click Attach & Detach**: Enable or disable tools in your active workspace with persistent state.
- **Real-Time Terminal Streaming**: Subprocesses execute with unbuffered standard I/O (`PYTHONUNBUFFERED=1`) and stream live ANSI-colored logs via Server-Sent Events (SSE).
- **Dynamic Parameter Generator**: Forms (text inputs, sliders, dropdowns, and toggles) are generated automatically from each tool's manifest with live shell command previews.
- **Structured Findings & Audit Reports**: Automatically extracts machine-readable summaries into interactive UI cards (vulnerabilities, open ports, endpoint statuses, password entropy) with Markdown and JSON export.
- **Integrated Tool Management**: Built-in visual Tool Builder, GitHub repository importer, and raw JSON manifest validator.

---

## 🛠️ Pre-Connected Signature Tools

CyberSuite comes pre-configured with three high-speed security utilities authored by [@itsmhmiri](https://github.com/itsmhmiri):

| Tool | Category | Description | Repository |
| :--- | :--- | :--- | :--- |
| **WordListGen** | Recon / OSINT | Targeted dictionary generator modeling human password patterns (names, years, leetspeak, seasons). | [wordlist-gen](https://github.com/itsmhmiri/wordlist-gen) |
| **QuickBuster** | Web Security | High-concurrency async HTTP directory and route discovery with smart 404 calibration. | [quickbuster](https://github.com/itsmhmiri/quickbuster) |
| **Async Banner Scanner** | Network | High-speed asynchronous TCP port scanner and service banner grabber using native `asyncio`. | [async-banner-scanner](https://github.com/itsmhmiri/async-banner-scanner) |
| **HTTP Header Auditor** | Web Security | Posture auditor evaluating OWASP defense headers (HSTS, CSP, X-Frame-Options) with scoring. | Built-in |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- Python 3.8+

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/cybersuite.git
cd cybersuite

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔌 Authoring a Custom Tool

Every tool in CyberSuite lives in `tools/<tool_id>/` with two core files:

```
tools/my_tool/
├── manifest.json       # Metadata, argument definitions, and parser rules
└── main.py             # Standard Python script (argparse/click compatible)
```

### 1. `manifest.json`

```json
{
  "$schema": "cybertool-v1",
  "id": "port_prober",
  "name": "Subnet Port Prober",
  "version": "1.0.0",
  "author": "SecTeam",
  "category": "network",
  "entrypoint": "tools/port_prober/main.py",
  "attached": true,
  "parameters": [
    {
      "name": "target",
      "flag": "--target",
      "type": "string",
      "label": "Target Host / IP",
      "defaultValue": "127.0.0.1",
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
      "name": "stealth",
      "flag": "--stealth",
      "type": "boolean",
      "label": "Stealth Mode",
      "defaultValue": false
    }
  ]
}
```

### 2. `main.py`

```python
#!/usr/bin/env python3
import argparse, json, time

parser = argparse.ArgumentParser()
parser.add_argument("--target", required=True)
parser.add_argument("--ports", default="80,443")
parser.add_argument("--stealth", action="store_true")
args = parser.parse_args()

print(f"[*] Probing {args.target} on ports {args.ports}...")

# Optional: emit structured JSON findings between delimiter tags
print("<<<CYBERSUITE_FINDINGS_JSON>>>")
print(json.dumps({"status": "success", "summary": "Audit finished"}))
print("<<<END_CYBERSUITE_FINDINGS_JSON>>>")
```

Alternatively, use the in-app **Interactive Tool Builder** under the **Tool Manager** tab to configure and test new tools directly from your browser.

---

## 📁 Project Architecture

```
├── server/
│   └── apiPlugin.ts         # Vite execution middleware, process spawner, & SSE streamer
├── src/
│   ├── components/
│   │   ├── DashboardView.tsx       # Operations metrics & signature tool highlights
│   │   ├── ToolCatalogView.tsx     # Filterable inventory with attach/detach controls
│   │   ├── RunnerView.tsx          # Dynamic parameter form & live ANSI terminal
│   │   ├── TaskQueueView.tsx       # Active background jobs & kill switches
│   │   ├── ToolManagerView.tsx     # Attach/detach manager & visual tool builder
│   │   └── DeveloperGuideView.tsx  # In-app CyberTool specification & live validator
│   ├── types/tool.ts               # Core TypeScript schemas
│   └── utils/                      # ANSI decoder & REST/SSE API client
├── tools/                          # Plug-and-play Python security tools
│   ├── wordlist_gen/
│   ├── quickbuster/
│   ├── async_banner_scanner/
│   └── http_header_auditor/
└── wordlists/                      # Built-in fuzzing dictionaries
```

---

## 📜 License

Distributed under the Apache 2.0 License.
Built with ❤️ for the cybersecurity community.
