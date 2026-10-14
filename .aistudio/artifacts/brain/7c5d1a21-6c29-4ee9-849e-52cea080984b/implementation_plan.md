# CyberSuite: Modular Cyber Security CLI Dashboard & Plugin Hub

A fully modular, extensible web dashboard and execution orchestrator for cybersecurity professionals. Built around an open **CyberTool Specification** that allows anyone to easily write, attach, detach, configure, and execute custom Python CLI tools, pre-loaded with the user's three signature security tools (`wordlist-gen`, `quickbuster`, `async-banner-scanner`) and complete with an interactive Developer Guide.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions Based on Your Feedback**:
> 1. **Zero Hardcoding — Modular Plugin Architecture**: Tools are strictly decoupled from the dashboard. Each tool is defined by a standard **CyberTool Manifest** (`manifest.json` + Python executable). The dashboard dynamically renders parameter forms, validates inputs, executes commands, and parses output purely from this specification.
> 2. **Attach & Detach Tool Management**: A dedicated Tool Manager allows security experts to attach new tools (via Git URL, manifest upload, or visual builder), detach/disable tools with a single click, configure tool categories, and export/share tool packages.
> 3. **Default Integration of Your 3 GitHub Tools**:
>    - **`wordlist-gen`**: OSINT-targeted password and dictionary generator modeling human behavioral patterns.
>    - **`quickbuster`**: High-concurrency async HTTP directory and endpoint discovery tool with smart 404 calibration.
>    - **`async-banner-scanner`**: Fast asynchronous TCP/UDP port scanner and service banner grabber.
> 4. **Built-in Interactive Developer Guide & Spec Reference**: A comprehensive in-app documentation center detailing the CyberTool Specification, parameter schemas, output parsing conventions, a boilerplate Python starter template, and step-by-step instructions for writing and attaching custom tools.

---

### 1. Overview & Core Concept

- **What It Does**: CyberSuite provides a unified operational dashboard where cybersecurity professionals can manage a library of CLI tools, attach new utilities, configure parameters via an auto-generated interface, run tasks with live unbuffered terminal output streaming, extract structured findings, and export audit reports.
- **Modularity Principle**: Any Python developer can write a tool adhering to our standard CLI argument conventions, drop in a `manifest.json` (or use the web-based Tool Builder), and have their tool instantly available in the dashboard with working forms and terminal visualization.
- **Target Audience**: Penetration testers, red/blue teams, DevSecOps engineers, and tool creators seeking a clean graphical command center without rewriting CLI logic into web code.

---

### 2. The CyberTool Standard Specification (Plugin Architecture)

To ensure any expert can write and connect a tool in minutes, we establish the **CyberTool Specification (v1.0)**:

```
tools/
├── <tool_id>/
│   ├── manifest.json       <-- Standard metadata, parameter schema & parser rules
│   ├── main.py             <-- Standard Python CLI script (argparse/click compatible)
│   └── requirements.txt    <-- Dependencies
```

#### Manifest Schema (`manifest.json`)
```json
{
  "$schema": "cybertool-v1",
  "id": "quickbuster",
  "name": "QuickBuster",
  "version": "1.2.0",
  "author": "itsmhmiri",
  "githubUrl": "https://github.com/itsmhmiri/quickbuster",
  "category": "web",
  "description": "High-speed HTTP directory and endpoint discovery tool with smart calibration",
  "entrypoint": "tools/quickbuster/main.py",
  "parameters": [
    {
      "name": "url",
      "flag": "-u",
      "type": "string",
      "label": "Target URL",
      "placeholder": "https://example.com",
      "required": true,
      "description": "Base target URL to fuzz"
    },
    {
      "name": "wordlist",
      "flag": "-w",
      "type": "select",
      "label": "Wordlist Preset",
      "options": ["common-endpoints", "api-routes", "sensitive-files", "custom"],
      "defaultValue": "common-endpoints"
    },
    {
      "name": "concurrency",
      "flag": "-c",
      "type": "number",
      "label": "Concurrency / Threads",
      "defaultValue": 25,
      "min": 1,
      "max": 200
    },
    {
      "name": "calibrate",
      "flag": "--calibrate",
      "type": "boolean",
      "label": "Smart 404 Calibration",
      "defaultValue": true
    }
  ],
  "outputParser": {
    "type": "line_matcher",
    "regexFindings": "\\[(?<status>\\d{3})\\]\\s+(?<path>\\S+)\\s+\\((?<size>\\d+)\\s*bytes\\)"
  }
}
```

---

### 3. User Experience & Visual Design

#### Key Views & Workspaces
1. **Tool Dashboard & Launcher**:
   - Visual catalog grouped by categories (`All`, `Web Security`, `Reconnaissance & OSINT`, `Network & Infrastructure`, `Custom / Community`).
   - Quick launch cards displaying tool author, status (`Attached` / `Detached`), run count, and launch button.
2. **Tool Runner & Live Workspace**:
   - **Dynamic Parameter Form**: Dynamically rendered strictly from the tool's parameter definitions (text inputs, selects, numeric bounds, toggles, wordlist pickers).
   - **Command Previewer**: Interactive command preview displaying the exact terminal command (`python3 tools/wordlist_gen/main.py --name John ...`) with click-to-copy.
   - **Live Terminal (Tab 1)**: High-performance ANSI console with real-time log streaming, line numbering, auto-scroll toggle, clear, and pause.
   - **Structured Findings (Tab 2)**: Automatically parsed results (e.g. Discovered HTTP routes, Generated wordlist statistics, Discovered open ports & banner fingerprints) with severity indicators and filterable tables.
   - **Raw JSON / Export (Tab 3)**: Export completed execution reports in Markdown, JSON, or formatted HTML.
3. **Tool Management Hub (Attach / Detach / Import)**:
   - Complete inventory of installed tools with quick toggles to **Attach** (enable) or **Detach** (hide/disable).
   - **"Connect New Tool" Wizard**:
     - *Mode A (Git / URL Import)*: Paste a GitHub repository or raw manifest URL.
     - *Mode B (Manifest File Upload)*: Drag and drop a `manifest.json` file.
     - *Mode C (Visual Manifest Builder)*: Form to define arguments, flags, types, and python commands interactively.
   - **Export Tool Package**: Download any tool configuration as a shareable JSON manifest.
4. **Task Queue & Execution History**:
   - Monitor active background jobs, process PIDs, start timestamps, execution durations, and status badges (`running`, `completed`, `failed`, `aborted`).
   - Abort / Kill switch (`SIGTERM`) for long-running network or fuzzing tasks.
5. **Interactive Developer & User Guide**:
   - Comprehensive documentation view within the app:
     - *Section 1: User Manual*: Running tools, managing tasks, interpreting results.
     - *Section 2: The CyberTool Standard*: Full JSON manifest specification breakdown.
     - *Section 3: Developing a Custom Python Tool*: Python starter script using `argparse` and unbuffered streaming.
     - *Section 4: Connecting Tools to the Dashboard*: How to attach, validate, and share tools.
     - *Live Manifest Playground*: Built-in JSON editor with real-time schema validation and command preview.

#### Visual Identity & Theme
- **Aesthetic Direction**: High-density DevSecOps console inspired by modern developer platforms (Linear, Datadog, Snyk). Clean structural dark palette with high legibility.
- **Color Palette (60-30-10 Rule)**:
  - Neutral Canvas (60%): `#090D16` deep obsidian slate
  - Structural Panels (30%): `#111827` surface container with hairline borders `#1F2937`
  - Functional Accent (10%): `#0EA5E9` cyber sky blue for interactive focus; `#10B981` emerald for active status; `#EF4444` red for critical findings/kill actions.
- **Typography**:
  - Interface: `Plus Jakarta Sans`
  - Code, Parameters & Terminal: `JetBrains Mono` with `tabular-nums`
- **Zero-Pill Discipline**: Metadata uses clean text with `·` dividers; status controls use purposeful segmented buttons.

---

### 4. Technical Architecture & Component Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CyberSuite Frontend                               │
│  ┌─────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │ Tool Catalog & Filter   │  │ Tool Runner View                          │  │
│  │ - Search & Categories   │  │ - Dynamic Form from manifest.json         │  │
│  │ - Attached Tools Only   │  │ - Real-time SSE Terminal Streamer         │  │
│  │ - Quick Run             │  │ - Structured Findings Parser View         │  │
│  └────────────┬────────────┘  └─────────────────────┬─────────────────────┘  │
│               │                                     │                        │
│  ┌────────────┴────────────┐  ┌─────────────────────┴─────────────────────┐  │
│  │ Tool Management Hub     │  │ Developer & User Guide                    │  │
│  │ - Attach / Detach Tools │  │ - Specification Documentation             │  │
│  │ - Git & File Importers  │  │ - Python Boilerplate Templates            │  │
│  │ - Manifest Builder      │  │ - Manifest Playground & Validator         │  │
│  └────────────┬────────────┘  └───────────────────────────────────────────┘  │
└───────────────┼─────────────────────────────────────┼────────────────────────┘
                │ REST (CRUD manifests)               │ SSE / REST (Execute)
                ▼                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Execution Engine (Vite Dev Server API)                    │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │ Tool Registry Service            │  │ Task & Process Orchestrator      │  │
│  │ - Loads built-in tool manifests  │  │ - Validates parameters           │  │
│  │ - Persists custom user tools     │  │ - Spawns unbuffered child_process│  │
│  │ - Manages attached/detached state│  │ - Streams stdout/stderr via SSE  │  │
│  └──────────────────────────────────┘  │ - Handles SIGTERM aborts         │  │
│                                        └─────────────────┬────────────────┘  │
└──────────────────────────────────────────────────────────┼───────────────────┘
                                                           ▼
                                         ┌──────────────────────────────────┐
                                         │ Pre-Connected Python Tools       │
                                         │ 1. wordlist-gen (OSINT seeds)    │
                                         │ 2. quickbuster (Async fuzzing)   │
                                         │ 3. async-banner-scanner (Ports)  │
                                         │ + User Custom Connected Scripts  │
                                         └──────────────────────────────────┘
```

#### Step-by-Step Implementation Sequence
1. **Core Tool Suite Implementation**: Implement full, working Python scripts for `wordlist-gen`, `quickbuster`, and `async-banner-scanner` inside modular tool directories with their corresponding `manifest.json` files.
2. **Backend Plugin & Execution Server**: Configure Vite API middleware to handle `/api/tools` (CRUD + attach/detach), `/api/execute` (spawn unbuffered process), `/api/tasks/:id/stream` (SSE output streaming), and `/api/tasks/:id/kill`.
3. **Frontend Architecture & Navigation**: Build the modular app shell with tabbed navigation: *Dashboard*, *Tool Catalog*, *Active Workspace*, *Task Queue*, *Tool Manager (Attach/Detach)*, and *Developer Guide*.
4. **Dynamic Tool Runner & Live Terminal**: Implement dynamic schema-driven form generator, live command string preview, and ANSI streaming terminal.
5. **Tool Manager (Attach/Detach)**: Implement tool toggles, manifest upload/importer, and visual tool builder.
6. **Comprehensive Developer Guide**: Build the full interactive documentation view with code examples, manifest schema specification, and interactive validator.
