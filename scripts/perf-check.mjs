// TIER D/QA EVIDENCE - real Chromium fps / draw calls / reverse beeper.
import fs from 'node:fs';
import { serve, newContext, openGame, closeAll, redErrors } from './browser.mjs';

const lines = [];
const say = s => { console.log(s); lines.push(s); };
let fails = 0;
const ok = (n, cond, extra = '') => { say((cond ? 'PASS ' : 'FAIL ') + n + (extra ? '  ' + extra : '')); if (!cond) fails++; };

await serve();
const ctx = await newContext({ viewport: { width: 1280, height: 720 } });
const page = await openGame(ctx, { settle: 1600, query: '?unlockall' });

async function sample(name, ms = 3200) {
  await page.waitForTimeout(ms);
  const p = await page.evaluate(() => window.__tfQA.qaRender());
  say(name.padEnd(26) + ' fps ' + String(p.fps).padStart(6) + ' | draw calls ' + String(p.calls).padStart(4) +
      ' | tris ' + String(p.tris).padStart(7) + ' | frames ' + p.frames);
  return p;
}
say('REAL CHROMIUM PERFORMANCE (headless software WebGL - lower than a real GPU)\n');
const start = await sample('START MENU');
await page.click('.tf-play'); await page.waitForTimeout(1600);
const l1 = await sample('LEVEL 1');
await page.evaluate(() => window.__tfQA.qaLevel(11));
const l11 = await sample('LEVEL 11');
await page.evaluate(() => window.__tfQA.qaLevel(15));
const l15 = await sample('LEVEL 15');
await page.evaluate(() => window.__tfQA.qaFree());
const free = await sample('FREE PLAY');

// ---- reverse beeper with a REAL held S key -------------------------------
await page.evaluate(() => window.__tfQA.qaLevel(1)); await page.waitForTimeout(900);
const beep0 = await page.evaluate(() => window.__tfQA.qaAudio().beeps);
await page.keyboard.down('s'); await page.waitForTimeout(5000); await page.keyboard.up('s');
const audio = await page.evaluate(() => window.__tfQA.qaAudio());
ok('reverse beeper beeps while reversing', audio.beeps > beep0,
   'beeps ' + beep0 + ' -> ' + audio.beeps + ' | speed ' + audio.engine);
ok('stage sound bed active', !!audio.bed, 'bed=' + audio.bed);

const draws = [start, l1, l11, l15, free].map(x => x.calls);
ok('all five states actually render geometry', draws.every(d => d > 0), JSON.stringify(draws));
ok('Free Play draw calls under 200', free.calls < 200, 'calls=' + free.calls);
const red = redErrors(page.__logs);
ok('0 red console errors', red.length === 0, JSON.stringify(red.slice(0, 4)));

say('\n' + (fails === 0 ? 'PERF CHECK: PASS' : 'PERF CHECK: FAIL (' + fails + ')'));
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/QA_PERF.txt', lines.join('\n') + '\n');
await closeAll();
process.exit(fails ? 1 : 0);
