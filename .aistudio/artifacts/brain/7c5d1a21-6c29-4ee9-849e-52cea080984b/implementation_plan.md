# CyberSuite 2.0: Automated Pipelines, Asset Inventory, Scheduled Scans & Executive Reporting

An end-to-end architectural roadmap and implementation plan to elevate CyberSuite into an automated security operations platform. Incorporates a **Visual Multi-Tool Pipeline Builder** with conditional logic, **Target Scope & Asset Inventory Management**, **Scheduled Recurring Audits with Change Diffing**, and **Multi-Channel Webhooks with Executive PDF/HTML Reporting**.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Product Roadmap**:
> 1. **Visual Multi-Tool Workflow Builder**: Drag-and-drop / node-based pipeline orchestrator allowing users to chain tools together with conditional branches (e.g., Scan ports with `async-banner-scanner` &rarr; If web ports open, trigger `quickbuster` &rarr; If domain keywords found, trigger `wordlist-gen`).
> 2. **Target Scope & Asset Inventory**: Persistent target profiles (domains, CIDR subnets, organizations, and excluded scopes) with an automated discovered asset ledger.
> 3. **Scheduled Scans & Change Diffing**: Recurring background audits with automated differential analysis that alerts when new open ports, new routes, or attack surface changes appear.
> 4. **Multi-Channel Webhooks & Executive Reporting**: Push instant alerts to Slack, Discord, and Telegram, with one-click generation of branded, printable executive security audit reports.

---

### 1. Overview & Core Concept

- **What It Delivers**: Transforms CyberSuite from a single-command CLI runner into an automated DevSecOps platform. Security engineers can map organizational targets, construct reusable multi-stage audit workflows, schedule automated scans, receive instant alerts upon new vulnerabilities or attack surface expansions, and generate executive-ready deliverables.
- **Modularity Preservation**: All new automation layers strictly adhere to the **CyberTool Specification (v1.0)**. Any custom Python tool connected now or in the future automatically participates in pipeline chaining, scheduling, asset mapping, and webhook alerting without custom glue code.

---

### 2. Deep Feature Architecture & Technical Specifications

#### Feature 1: Visual Multi-Tool Pipeline Builder & Chaining Engine
```
┌────────────────────────────────────────────────────────────────────────┐
│                   Visual Pipeline Canvas (Node Graph)                  │
│                                                                        │
│  ┌───────────────────────┐                                             │
│  │ Step 1: Port Scanner  │                                             │
│  │ (async-banner-scanner)│                                             │
│  └───────────┬───────────┘                                             │
│              │ Output: [open_ports]                                    │
│              ▼                                                         │
│  ┌───────────────────────┐                                             │
│  │ Condition: Has HTTP?  ├───[False]──► (Skip Web Audit)               │
│  │ (ports 80, 443, 8080) │                                             │
│  └───────────┬───────────┘                                             │
│              │ [True]                                                  │
│              ▼                                                         │
│  ┌───────────────────────┐          ┌───────────────────────────────┐  │
│  │ Step 2: QuickBuster   ├─────────►│ Step 3: WordListGen           │  │
│  │ (Fuzz Discovered Web) │          │ (Targeted OSINT Dictionary)   │  │
│  └───────────────────────┘          └──────────────┬────────────────┘  │
│                                                    │                   │
│                                                    ▼                   │
│                                     ┌───────────────────────────────┐  │
│                                     │ Webhook Alert + Report Export │  │
│                                     └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```
- **Pipeline Data Schema (`PipelineDefinition`)**:
  - `id`, `name`, `description`, `trigger` (`manual` | `scheduled`)
  - `steps`: Array of pipeline steps containing `toolId`, `parameterMappings` (supports dynamic variables like `{{target.domain}}`, `{{step1.open_ports}}`), and `condition` rules.
  - `branches`: Conditional paths evaluated after each tool completes based on exit code or parsed findings.
- **Backend Execution Orchestrator**:
  - Sequentially resolves inputs from previous step outputs.
  - Streams consolidated pipeline execution logs via SSE to the UI with a live multi-step progress bar.

---

#### Feature 2: Target Scope & Persistent Asset Inventory
- **Target Profiles (`TargetScope`)**:
  - Store organizational scopes: Organization Name, Primary Domain, Hostnames, CIDR ranges, and Explicit Out-of-Scope Exclusions.
  - Quick Launch: 1-click execution of any tool or pipeline against an active target profile.
- **Discovered Asset Ledger**:
  - Centralized inventory aggregated from tool outputs:
    - Discovered Subdomains & IP mappings
    - Open Ports & Service Banners (with discovery timestamp)
    - Discovered HTTP Routes & Status codes
    - Security Header Posture history

---

#### Feature 3: Scheduled Recurring Scans & Change Diffing Engine
- **Cron / Interval Scheduler (`ScheduledJob`)**:
  - Configurable cadences: Hourly, Daily, Weekly, or custom intervals.
  - Background process execution managed by backend timer registry.
- **Differential Analysis ("Attack Surface Diff")**:
  - Compares the latest execution result against the previous baseline.
  - Generates clear delta alerts:
    - 🔴 **New Open Port**: e.g. Port `8080` (HTTP Proxy) newly discovered since last scan.
    - 🟡 **New Exposed Route**: e.g. `/api/debug` newly returned HTTP 200.
    - 🟢 **Remediated Finding**: Previously open vulnerable port closed.

---

#### Feature 4: Multi-Channel Webhooks & Executive Reporting
- **Multi-Channel Webhooks**:
  - **Discord**: Embed cards with color-coded severity indicators.
  - **Slack**: Block Kit messages with direct links to dashboard task logs.
  - **Telegram**: Formatted Markdown alerts with summary statistics.
  - Trigger configuration: Alert on every completed scan, on pipeline failure, or only when new findings/changes are detected.
- **Executive Audit Report Generator**:
  - Generates clean, high-impact HTML/PDF deliverables:
    - Executive Summary & Security Posture Score
    - Discovered Assets & Attack Surface Matrix
    - Finding Details, OWASP Compliance Ratings & Remediation Recommendations
    - Raw Technical Audit Proof & Execution Timestamps

---

### 3. User Experience & Visual Design

- **Navigation Integration**:
  - Top Bar tabs expanded with dedicated views:
    `Dashboard` · `Tool Catalog` · `Runner` · `Pipelines` · `Targets` · `Schedules & Diff` · `Tool Manager` · `Developer Guide`
- **Design Constitution Adherence**:
  - Zero-pill text metadata with subtle `·` separators.
  - Modern dark DevSecOps canvas (`#090D16`) with high-contrast tabular numerals (`JetBrains Mono`).
  - Interactive pipeline flow nodes styled with crisp hairline borders (`border-slate-800`), status indicators, and real-time execution timers.

---

### 4. Technical Architecture & File Plan

```
server/
├── apiPlugin.ts               # Core router (extended with /api/pipelines, /api/targets, /api/schedules, /api/webhooks)
├── pipelineRunner.ts          # Multi-step tool chainer and variable interpolation engine
├── diffEngine.ts              # Output comparator detecting new ports, routes, and risk changes
└── webhookNotifier.ts         # Dispatcher for Discord, Slack, and Telegram webhooks

src/
├── types/
│   ├── tool.ts                # Existing CyberTool schemas
│   ├── pipeline.ts            # Pipeline nodes, connections, and step execution models
│   ├── target.ts              # Target profiles and asset ledger definitions
│   └── schedule.ts            # Cron schedules, diff results, and webhook configs
├── components/
│   ├── PipelineBuilderView.tsx # Visual node/card pipeline editor & execution monitor
│   ├── TargetScopeView.tsx    # Asset inventory ledger and target profile manager
│   ├── ScheduleDiffView.tsx   # Automated recurring scan scheduler & change diffs
│   ├── WebhookSettingsModal.tsx# Webhook config for Discord/Slack/Telegram
│   └── ExecutiveReportModal.tsx# Printable executive HTML/PDF report generator
```

#### Step-by-Step Implementation Sequence
1. **Schema & Types**: Define TypeScript models for pipelines, target scopes, asset inventories, scheduled jobs, diff deltas, and webhook configs.
2. **Backend Engine Extensions**:
   - Pipeline orchestrator with variable substitution (`{{step1.target_ip}}`).
   - Differential analysis engine comparing latest findings against historical baselines.
   - Webhook dispatcher with Discord/Slack/Telegram payload formatters.
   - Recurring cron/timer runner.
3. **Pipeline Builder View**: Interactive visual workflow creator with pre-built workflow templates (e.g., "Full Recon & Web Audit Pipeline").
4. **Target Scope & Asset Inventory View**: Persistent profile manager with discovered assets matrix.
5. **Scheduler & Change Diff View**: Timeline of runs showing delta badges (new open ports, new endpoints).
6. **Executive Report Generator**: Formatted printable report modal with print/PDF CSS and Markdown/HTML download.
7. **Testing & Verification**: Verify full compilation, linting, and automated test execution.
