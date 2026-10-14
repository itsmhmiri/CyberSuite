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

    // 2. Click "Runner" tab
    console.log('[*] Navigating to Runner tab...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Runner'));
      if (btn) btn.click();
    });
    await sleep(1500);

    // Trigger Execute Tool
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Execute Tool'));
      if (btn) btn.click();
    });
    await sleep(3500);

    console.log('[+] Capturing 02_runner_terminal.png...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02_runner_terminal.png'),
      fullPage: false,
    });

    // 3. Click "Pipelines" tab
    console.log('[*] Navigating to Pipelines tab...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Pipelines'));
      if (btn) btn.click();
    });
    await sleep(2000);

    console.log('[+] Capturing 03_pipelines_builder.png...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03_pipelines_builder.png'),
      fullPage: false,
    });

    // 4. Click "Targets" tab
    console.log('[*] Navigating to Targets tab...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Targets'));
      if (btn) btn.click();
    });
    await sleep(2000);

    console.log('[+] Capturing 04_targets_assets.png...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04_targets_assets.png'),
      fullPage: false,
    });

    // 5. Click "Schedules & Diff" tab
    console.log('[*] Navigating to Schedules & Diff tab...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Schedules'));
      if (btn) btn.click();
    });
    await sleep(2000);

    console.log('[+] Capturing 05_schedules_diff.png...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05_schedules_diff.png'),
      fullPage: false,
    });

    // 6. Open Executive Report Modal
    console.log('[*] Opening Executive Audit Report...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Audit Report'));
      if (btn) btn.click();
    });
    await sleep(1500);

    console.log('[+] Capturing 06_executive_report.png...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06_executive_report.png'),
      fullPage: false,
    });

    console.log('[✓] All v2.0 screenshots captured successfully in docs/images!');
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
