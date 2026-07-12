import { execFileSync, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const host = '127.0.0.1';
const port = 4174;
const url = `http://${host}:${port}/`;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const thresholds = {
  performance: 0.8,
  accessibility: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
};

execFileSync(npmCommand, ['run', 'build'], { stdio: 'inherit' });

const preview = spawn(
  npmCommand,
  ['run', 'preview', '--', '--host', host, '--port', String(port)],
  { stdio: 'inherit' },
);
let chrome;

try {
  await waitForServer(url);
  chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });
  const result = await lighthouse(url, {
    port: chrome.port,
    output: ['html', 'json'],
    logLevel: 'info',
    onlyCategories: Object.keys(thresholds),
  });

  if (!result) throw new Error('Lighthouse не вернул результат');

  const reports = Array.isArray(result.report)
    ? result.report
    : [result.report];
  await mkdir('lighthouse-reports', { recursive: true });
  await Promise.all([
    writeFile('lighthouse-reports/report.html', reports[0] ?? ''),
    writeFile('lighthouse-reports/report.json', reports[1] ?? ''),
  ]);

  const failures = [];
  for (const [category, minimum] of Object.entries(thresholds)) {
    const score = result.lhr.categories[category]?.score ?? 0;
    const percentage = Math.round(score * 100);
    console.log(`${category}: ${percentage}`);
    if (score < minimum)
      failures.push(`${category}: ${percentage} < ${minimum * 100}`);
  }

  if (failures.length > 0) {
    throw new Error(`Lighthouse thresholds failed: ${failures.join(', ')}`);
  }
} finally {
  await chrome?.kill();
  preview.kill('SIGTERM');
}

async function waitForServer(serverUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) return;
    } catch {
      // Preview server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Preview server did not start at ${serverUrl}`);
}
