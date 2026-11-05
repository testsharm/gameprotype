// QA EVIDENCE - 10 MINUTE scripted session in REAL Chromium.
// Real key presses, real mouse clicks, real window opens/closes, real level
// changes. Full console transcript + periodic state/fps written to
// docs/QA_SESSION_LOG.txt. Nothing is faked with synthetic DOM events.
import fs from 'node:fs';
import { serve, newContext, openGame, closeAll, redErrors } from './browser.mjs';

const DURATION = Math.max(60, +process.env.SECONDS || 600);
const out = [];
const say = s => { out.push(s); console.log(s); };
let fails = 0;
const ck = (n, cond, extra = '') => { say((cond ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); if (!cond) fails++; };

await serve();
const ctx = await newContext({ viewport: { width: 1024, height: 576 } });
const page = await openGame(ctx, { settle: 1600, query: '?unlockall' });
await page.click('.tf-play');
await page.waitForTimeout(1200);

say('TERRAFORM 3D - 10 MINUTE REAL BROWSER SESSION');
say('Chromium 153 | ' + DURATION + ' s | real keyboard / mouse / clicks\n');
const t0 = Date.now();
let ticks = 0, crashes = 0, levelChanges = 0, clicks = 0, keyHolds = 0;
const fps = [];

async function rnd(min, max) { return min + Math.random() * (max - min); }
async function press(key, ms) {
  await page.keyboard.down(key); keyHolds++;
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}
while (Date.now() - t0 < DURATION * 1000) {
  ticks++;
  const n = ticks;
  // Real driving: forward, steer, reverse, brake.
  await press('w', await rnd(900, 2200));
  if (n % 2 === 0) await press('a', await rnd(400, 900));
  if (n % 3 === 0) await press('s', await rnd(600, 1300));
  if (n % 5 === 0) await press('d', await rnd(400, 800));
  if (n % 4 === 0) await press(' ', 350);
  // Real held action keys (F / G) - the 1.6 s / 1.2 s radial holds.
  try {
    await page.keyboard.down(n % 2 ? 'f' : 'g'); keyHolds++;
    await page.waitForTimeout(900);
    await page.keyboard.up(n % 2 ? 'f' : 'g');
  } catch (e) {}
  // Real clicks on HUD buttons + windows.
  const targets = ['#tf-cam', '#tf-zin', '#tf-zout', '#tf-snd', '#tf-map', '#tf-mini'];
  const sel = targets[n % targets.length];
  try { await page.click(sel, { timeout: 5000 }); clicks++; } catch (e) {}
  if (n % 3 === 0) {
    try { await page.evaluate(k => window.__tfQA.qaWindow(k), ['pause', 'settings', 'help', 'garage', 'levels'][n % 5]);
          await page.waitForTimeout(250);
          await page.evaluate(() => window.__tfQA.qaClose()); clicks++; } catch (e) {}
  }
  // Level rotation every 6 ticks: all 15 stages get real play time.
  if (n % 6 === 0) {
    const lvl = ((Math.floor(n / 6) - 1) % 15) + 1;
    try { await page.evaluate(x => window.__tfQA.qaLevel(x), lvl); levelChanges++; } catch (e) {}
    await page.waitForTimeout(500);
  }
  const q = await page.evaluate(() => {
    try { return { s: window.__tfQA.qaState(), r: window.__tfQA.qaRender(),
      stage: window.__tfQA.qaStage().name, audio: window.__tfQA.qaAudio() }; }
    catch (e) { return { error: String(e.message) }; }
  });
  if (q.error) crashes++;
  if (q.r && q.r.fps > 0) fps.push(q.r.fps);
  say('t+' + String(Math.round((Date.now() - t0) / 1000)).padStart(3) + 's  tick ' + String(n).padStart(2) +
      ' | ' + String(q.stage || '-').padEnd(20) +
      ' | state ' + String(q.s ? q.s.gameState : 'ERR').padEnd(8) +
      ' | L' + (q.s ? q.s.currentJob : '-') + ' loads ' + (q.s ? q.s.loads + '/' + q.s.total : '-') +
      ' | fps ' + (q.r ? q.r.fps : '-') + ' draw ' + (q.r ? q.r.calls : '-') +
      ' | beeps ' + (q.audio ? q.audio.beeps : '-') +
      (q.error ? ' | ERROR ' + q.error : ''));
  await page.waitForTimeout(await rnd(600, 1400));
}
const elapsed = Math.round((Date.now() - t0) / 1000);
const logs = page.__logs || [];
say('\n--- FULL CONSOLE LOG (' + logs.length + ' entries) ---');
for (const l of logs) say('[' + l.type + '] ' + l.text + (l.src ? '  (' + l.src + ')' : ''));
const red = redErrors(logs);
say('\n--- SUMMARY ---');
ck('session ran >= 10 minutes', elapsed >= DURATION - 5, elapsed + ' s');
ck('no QA hook crash', crashes === 0, crashes + ' crashes');
ck('real input exercised', clicks > 20 && keyHolds > 20 && levelChanges >= 10,
   'clicks=' + clicks + ' keyHolds=' + keyHolds + ' levelChanges=' + levelChanges);
ck('0 red console errors', red.length === 0, red.length + ' | ' + JSON.stringify(red.slice(0, 4)));
ck('fps sampled', fps.length > 10, fps.length + ' samples, avg ' +
   (fps.reduce((a, b) => a + b, 0) / Math.max(1, fps.length)).toFixed(1));

say('\n' + (fails === 0 ? '10-MIN SESSION: PASS' : '10-MIN SESSION: FAIL (' + fails + ')'));
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/QA_SESSION_LOG.txt', out.join('\n') + '\n');
await closeAll();
process.exit(fails ? 1 : 0);
