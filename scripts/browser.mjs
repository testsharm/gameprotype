// Real Chromium harness for TerraForm 3D QA.
// Chromium binary ships inside @sparticuz/chromium (npm registry, no CDN needed).
// Usage: import { launch, serve, openGame, shoot, closeAll } from './browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHOTS = path.join(ROOT, 'docs/screenshots');
export const DIST = path.join(ROOT, 'dist');

// The Amazon-Linux-2023 shared libraries inside the npm package must be
// inflated on Debian. Do this once per process, before launching Chromium.
process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs22.x';
const { default: chromium, setupLambdaEnvironment } = await import('@sparticuz/chromium');
const { inflate } = await import('../node_modules/@sparticuz/chromium/build/lambdafs.js');
await inflate(path.join(ROOT, 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
setupLambdaEnvironment('/tmp/al2023/lib');
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib', '/tmp', process.env.LD_LIBRARY_PATH || ''].filter(Boolean).join(':');
process.env.FONTCONFIG_PATH = '/tmp/fonts';
const { chromium: pw } = await import('playwright-core');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

let server = null;
let browser = null;
export const PORT = Number(process.env.TF_QA_PORT || 4179);

export async function serve(dir = DIST) {
  if (server) return server;
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(String(req.url).split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(PORT, '127.0.0.1', r));
  return server;
}

export async function launch() {
  if (browser) return browser;
  const exe = await chromium.executablePath();
  browser = await pw.launch({ executablePath: exe, headless: true,
    args: [...chromium.args, '--no-sandbox'], env: { ...process.env } });
  return browser;
}

export function url(qs = '') { return `http://127.0.0.1:${PORT}/${qs}`; }

// A fresh browser context = fresh localStorage = NEW PLAYER by default.
export async function newContext(opts = {}) {
  const b = await launch();
  const ctx = await b.newContext({
    viewport: opts.viewport || { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    hasTouch: !!opts.touch,
    isMobile: false,
    ...(opts.extra || {})
  });
  if (opts.blockSDK !== false) {
    // Outside the CrazyGames portal the SDK script cannot connect. We still
    // test our OWN no-op path, but keep the network noise out of console QA.
    await ctx.route('**/crazygames-sdk-v3.js', r => r.abort());
  }
  return ctx;
}

export async function openGame(ctx, opts = {}) {
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push({ type: m.type(), text: m.text(), src: m.location().url }));
  page.on('pageerror', e => logs.push({ type: 'pageerror', text: e.message, src: '' }));
  page.on('requestfailed', r => {
    const u = r.url();
    if (/crazygames|favicon/i.test(u)) return;   // known harmless outside portal
    logs.push({ type: 'requestfailed', text: u, src: '' });
  });
  await page.goto(url(opts.query || ''), { waitUntil: 'load', timeout: 60000 });
  // Wait until the loading screen is gone and the start screen is visible.
  await page.waitForFunction(() => {
    const l = document.getElementById('loading-screen');
    const s = document.getElementById('tf-start');
    return (!!s && getComputedStyle(s).display !== 'none') &&
      (!l || getComputedStyle(l).visibility === 'hidden' || getComputedStyle(l).opacity === '0');
  }, { timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(opts.settle === undefined ? 2200 : opts.settle);
  page.__logs = logs;
  return page;
}

export async function shoot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const f = path.join(SHOTS, name.endsWith('.png') ? name : name + '.png');
  await page.screenshot({ path: f, timeout: 90000, animations: 'disabled' });
  return f;
}

export function redErrors(logs) {
  return logs.filter(l => (l.type === 'error' || l.type === 'pageerror') &&
    !/favicon|Receiving end does not exist|crazygames-sdk-v3\.js|ERR_CONNECTION_CLOSED|ERR_FAILED/i.test(l.text));
}

export async function closeAll() {
  if (browser) { try { await browser.close(); } catch (e) {} browser = null; }
  if (server) { await new Promise(r => server.close(r)); server = null; }
}

export { ROOT };
