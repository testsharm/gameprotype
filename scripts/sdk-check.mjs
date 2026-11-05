// A3 PROOF: run WITHOUT aborting the SDK script and prove our own code never
// emits "CrazySDK is not initialized yet" (the owner saw 13 of those).
import { serve, newContext, openGame, closeAll } from './browser.mjs';
let fails = 0;
const ck = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) fails++; };
await serve();
const ctx = await newContext({ viewport: { width: 1024, height: 576 }, blockSDK: false });
const page = await openGame(ctx, { settle: 2000 });
await page.click('.tf-play'); await page.waitForTimeout(1800);
// exercise every ads / portal entry point that used to call the SDK unguarded
for (const k of ['pause', 'settings', 'levels', 'garage', 'help', 'result', 'fail', 'map', 'confirm']) {
  await page.evaluate(x => window.__tfQA.qaWindow(x), k); await page.waitForTimeout(220);
  await page.evaluate(() => window.__tfQA.qaClose()); await page.waitForTimeout(120);
}
for (let i = 1; i <= 15; i++) { await page.evaluate(n => window.__tfQA.qaLevel(n), i); await page.waitForTimeout(160); }
await page.waitForTimeout(1800);
const logs = page.__logs || [];
const bad = logs.filter(l => /CrazySDK is not initialized yet|CrazySDK.*not.*init/i.test(l.text));
const net = logs.filter(l => /crazygames-sdk-v3|ERR_FAILED/i.test(l.text));
console.log('\nconsole entries: ' + logs.length);
console.log('CrazySDK-not-initialized messages: ' + bad.length);
console.log('SDK network failures (no portal in sandbox, expected): ' + net.length);
for (const l of logs.slice(0, 12)) console.log('  [' + l.type + '] ' + l.text.slice(0, 130));
ck('ZERO CrazySDK is not initialized yet', bad.length === 0, JSON.stringify(bad.slice(0, 4).map(x => x.text)));
ck('no pageerror exceptions', logs.filter(l => l.type === 'pageerror').length === 0,
   JSON.stringify(logs.filter(l => l.type === 'pageerror').slice(0, 4).map(x => x.text)));
console.log('\n' + (fails === 0 ? 'SDK CHECK: PASS' : 'SDK CHECK: FAIL (' + fails + ')'));
await closeAll();
process.exit(fails ? 1 : 0);
