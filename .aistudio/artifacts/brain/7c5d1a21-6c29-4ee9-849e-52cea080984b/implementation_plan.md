# CyberSuite: Full-Tour Live App Screenshots & README Integration

Capture crisp, high-resolution live screenshots of the running CyberSuite application using Puppeteer across all primary views, save them to a dedicated documentation assets folder, and embed them into the project's `README.md` for a professional, visually compelling GitHub repository presence.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Choices**:
> - **Capture Method**: Headless browser automation via Puppeteer executing against the active local app (`http://localhost:3000`).
> - **Coverage**: Full tour covering the 4 core views:
>   1. **Dashboard & Operations Console**: KPI statistics, signature tool suite, and recent activity.
>   2. **Runner & Live Terminal**: Dynamic parameter controls, shell command preview, and real-time ANSI terminal streaming.
>   3. **Structured Findings & Intelligence**: Auto-parsed route/port findings and entropy analytics.
>   4. **Tool Manager & Builder**: Attach/detach inventory, GitHub importer, and visual manifest authoring.
>   5. **Developer Guide & Validator**: In-app documentation and interactive schema validator.

---

### 1. Overview & Core Concept

- **What It Delivers**: An automated capture pipeline using Puppeteer to take viewport screenshots of each tab in the live CyberSuite application at standard desktop resolution (1440×900), optimized for GitHub display in dark mode, and seamlessly embedded into `README.md`.
- **Target Audience**: GitHub visitors, open-source contributors, and cybersecurity professionals evaluating the tool suite.
- **Key Value**: Provides immediate visual proof of working features, real-time terminal streaming, and modular tool management without requiring visitors to clone and build first.

---

### 2. User Experience & Visual Design

#### Screenshot Inventory & Layout
1. **Hero Banner / Dashboard Preview** (`docs/images/01_dashboard_overview.png`):
   - Full desktop view showing KPI metric strip, signature tools banner (`wordlist-gen`, `quickbuster`, `async-banner-scanner`), and live activity feed.
2. **Runner & Real-Time Terminal** (`docs/images/02_runner_terminal.png`):
   - Dynamic parameter controls alongside active monospace ANSI terminal showing streaming execution of `quickbuster` and `wordlist-gen`.
3. **Structured Findings & Intelligence Cards** (`docs/images/03_structured_findings.png`):
   - Rich tabular view of discovered endpoints with color-coded HTTP status pills (200 OK, 301 Redirect, 403 Forbidden) and service banners.
4. **Tool Management & Visual Builder** (`docs/images/04_tool_manager.png`):
   - Inventory table showing Attached/Detached toggles, GitHub repository link importer, and the interactive manifest builder.

#### README Integration Design
- High-contrast, clean Markdown layout with expandable details or side-by-side comparison tables.
- Proper relative paths (`docs/images/...`) so screenshots render correctly on GitHub web, mobile apps, and markdown previewers.
- Retina-crisp presentation with descriptive alt text and clean caption kickers.

---

### 3. Technical Architecture & Implementation Steps

```
┌────────────────────────────────────────────────────────┐
│              Live App (http://localhost:3000)          │
│  [Dashboard] [Catalog] [Runner] [Manager] [Guide]      │
└──────────────────────────┬─────────────────────────────┘
                           │ Page Navigation & Clicks
                           ▼
┌────────────────────────────────────────────────────────┐
│            Puppeteer Headless Automation Script        │
│  - Sets viewport (1440 x 900)                          │
│  - Navigates through tabs & triggers test run          │
│  - Captures high-res PNGs to `docs/images/`            │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             Updated GitHub README.md File              │
│  - Embedded screenshot figures with clean captions     │
│  - Interactive tour of all core dashboard capabilities │
└────────────────────────────────────────────────────────┘
```

#### Step-by-Step Execution Sequence
1. **Install Puppeteer**: Add `puppeteer` as a dev dependency to allow automated headless Chromium capture.
2. **Automated Capture Script (`scripts/capture_screenshots.js`)**:
   - Launches headless browser, navigates to `http://localhost:3000`.
   - Captures **Dashboard View**.
   - Navigates to **Runner View**, runs a live scan with sample parameters to populate real ANSI terminal logs, and captures **Runner & Terminal**.
   - Switches to **Structured Findings** tab and captures **Findings View**.
   - Navigates to **Tool Manager**, opens the Connect Tool dialog, and captures **Tool Manager & Builder**.
   - Saves all PNG files to `docs/images/`.
3. **Update `README.md`**:
   - Place hero screenshot prominently below the title.
   - Insert dedicated "Visual Tour & Features" section with annotated screenshots.
4. **Verification**: Verify images exist, build passes, and README formatting is clean.
