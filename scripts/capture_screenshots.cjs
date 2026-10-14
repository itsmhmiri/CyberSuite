const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/images');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('[*] Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    console.log('[*] Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // 1. Capture Dashboard View
    console.log('[+] Capturing 01_dashboard_overview.png...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01_dashboard_overview.png'),
      fullPage: false,
    });

    // 2. Click "Runner & Terminal" tab
    console.log('[*] Navigating to Runner & Terminal tab...');
    const runnerBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('Runner & Terminal'));
    });
    if (runnerBtn) {
      await runnerBtn.click();
      await sleep(1500);

      // Trigger a run to produce real live ANSI logs
      console.log('[*] Triggering Execute Tool...');
      const executeBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find((b) => b.textContent && b.textContent.includes('Execute Tool'));
      });
      if (executeBtn) {
        await executeBtn.click();
        await sleep(3500); // wait for process run and logs to stream in
      }

      console.log('[+] Capturing 02_runner_terminal.png...');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '02_runner_terminal.png'),
        fullPage: false,
      });

      // Switch to Structured Findings tab
      console.log('[*] Switching to Structured Findings tab...');
      const findingsTab = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find((b) => b.textContent && b.textContent.includes('Structured Findings'));
      });
      if (findingsTab) {
        await findingsTab.click();
        await sleep(1500);
        console.log('[+] Capturing 03_structured_findings.png...');
        await page.screenshot({
          path: path.join(OUTPUT_DIR, '03_structured_findings.png'),
          fullPage: false,
        });
      }
    }

    // 3. Click "Tool Manager" tab
    console.log('[*] Navigating to Tool Manager tab...');
    const managerBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('Tool Manager'));
    });
    if (managerBtn) {
      await managerBtn.click();
      await sleep(1500);

      console.log('[+] Capturing 04_tool_manager.png...');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '04_tool_manager.png'),
        fullPage: false,
      });
    }

    // 4. Click "Developer Guide" tab
    console.log('[*] Navigating to Developer Guide tab...');
    const guideBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('Developer Guide'));
    });
    if (guideBtn) {
      await guideBtn.click();
      await sleep(1500);

      console.log('[+] Capturing 05_developer_guide.png...');
      await page.screenshot({
        path: path.join(OUTPUT_DIR, '05_developer_guide.png'),
        fullPage: false,
      });
    }

    console.log('[✓] All screenshots captured successfully in docs/images!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
